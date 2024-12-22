require('dotenv').config();
const { StreamChat } = require("stream-chat");
const { clerkClient } = require("@clerk/clerk-sdk-node");
const users = clerkClient.users;


// Stream API credentials
const apiKey = process.env.API_STREAM_KEY;
const apiSecret = process.env.API_SECRET;

// Initialize Stream Chat server client
const serverClient = StreamChat.getInstance(apiKey, apiSecret);

exports.getToken=(req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const token = serverClient.createToken(userId); // Generate token
    return res.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    return res.status(500).json({ error: "Failed to generate token" });
  }
}




exports.getAvailableUsers=async(req, res)=> {
  try {
    // Get all users from Clerk
    const allUsers = await users.getUserList();

  const userList = allUsers.data;
    if (!Array.isArray(userList)) {
      throw new Error("Unexpected response structure from Clerk API. Expected an array in `data`.");
    }
    // Get the current user's ID from the request (you'll pass it as a query parameter)
    const {currentUserId} = req.query;
    

    // Filter out the current user
    const availableUsers = userList
      .filter((user) => user.id !== currentUserId)
      .map((user) => ({
        id: user.id,
        name: user.fullName,
        email: user.primaryEmailAddress.emailAddress,
        imageUrl:user?.imageUrl
      }));

    res.status(200).json(availableUsers);
  } catch (error) {
    console.error("Error fetching available users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}


exports.messageSeller = async (req, res) => {
  const { user, creator } = req.body;

  try {
    console.log("Incoming data:", { user, creator });

    // 1. Extend the timeout for Stream API requests
    serverClient.axiosInstance.defaults.timeout = 10000; // Set timeout to 10 seconds
    console.log("Timeout set to 10 seconds");

    // 2. Ensure buyer and seller exist as Stream Chat users
    console.log("Before querying users");
    const existingUsers = await serverClient.queryUsers({
      id: { $in: [user?.id, creator?.id] },
    });
    console.log("Existing users:", existingUsers);

    const existingUserIds = existingUsers.users.map((u) => u.id);

    const usersToCreate = [];
    if (!existingUserIds.includes(user?.id)) {
      usersToCreate.push(user);
    }
    if (!existingUserIds.includes(creator?.id)) {
      usersToCreate.push(creator);
    }

    if (usersToCreate.length > 0) {
      console.log("Creating users:", usersToCreate);
      await serverClient.upsertUsers(usersToCreate);
    }

    // 3. Check if a channel already exists with both users
    console.log("Checking for existing channel with both members");
    const existingChannel = await serverClient.queryChannels({
      type: "messaging", // Specify channel type
      members: { $in: [user?.id, creator?.id] }, // Query for channels containing both users
    });

    if (existingChannel.length > 0) {
      console.log("Channel already exists:", existingChannel[0]);
      res.status(200).json({ channelId: existingChannel[0].id });
    } else {
      // 4. Create a unique channel ID
      const channelId = `${user?.id}_${creator?.id}`.slice(0, 64);
      console.log("Creating new channel with ID:", channelId);

      const channel = serverClient.channel("messaging", channelId, {
        name: `Chat about Vehicle`,
        members: [user?.id, creator?.id],
        created_by_id: user?.id, // Specify the user who is creating the channel
      });
      await channel.create();

      res.status(201).json({ channelId });
    }
  } catch (error) {
    console.error("Error in messageSeller:", error.message);

    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout occurred");
    }

    res.status(500).send("Server error");
  }
};



