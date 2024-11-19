const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const DBConnection = require('./config/connect');
const path = require('path');

const app = express();
dotenv.config();

// Connect to DB
DBConnection();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/admin', require('./routers/adminRoutes'));
app.use('/api/user', require('./routers/userRoutes'));

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
