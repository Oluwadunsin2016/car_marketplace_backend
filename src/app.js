const express = require('express');
const cors = require('cors');
const carRoutes = require('./modules/cars/car.routes');
const userRoutes = require('./modules/users/user.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const savedCarRoutes = require('./modules/saved-cars/savedCar.routes');
const { corsOrigins } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: function (origin, callback) {
    if (corsOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use('/api/car', carRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/saved-cars', savedCarRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'success' });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
