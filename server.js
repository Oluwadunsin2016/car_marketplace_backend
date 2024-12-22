require('dotenv').config(); // Load environment variables
const express = require('express');
// const bodyParser = require('body-parser');
const carRoutes=require('./routes/carRoutes')
const userRoutes=require('./routes/userRoutes')
const { sequelize } = require('./models');
const cors = require('cors');

const allowedOrigins = ['https://postgram-pi.vercel.app', 'http://localhost:5173'];
const app = express();
app.use(express.json());
// app.use(cors({ credentials:true })); // Replace with your React app’s origin

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/car', carRoutes);
app.use('/api/user', userRoutes);

app.use("/",(req,res)=>{
res.json({
  message:"sucess"
})
})

const PORT = process.env.PORT || 4000;

// Database connection and server start
//     app.listen(PORT, () => {
//     console.log('DB Config:', {
//   username: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     host: process.env.DB_HOST,
//     port:process.env.DB_PORT,
//     dialect: "postgres"
// });
//       console.log(`Server is running on http://localhost:${PORT}`);
//     });
sequelize
  .authenticate().then(() => {
    console.log('Database connected successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err.message);
  });
