import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import * as constants from '../const.js';
import * as userRoute from './user-routes.js';

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

// Connect to MongoDB
dotenv.config();

const port = process.env.PORT || 3002;

const dbURI = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@finalproject.szjndb6.mongodb.net/EventsBooking?retryWrites=true&w=majority&appName=FinalProject`;
await mongoose.connect(dbURI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Signup
app.post('/api/signup', userRoute.signup); //TODO - CHECK

// Login
app.post('/api/login', userRoute.login); //TODO - CHECK

// Logout
app.post('/api/logout', userRoute.logout); //TODO - CHECK

// Get Username (by username in the token)
app.get('/api/username', userRoute.getUsername); //TODO - CHECK

// Update permissions (by username in the body)
app.put('/api/permission', userRoute.updatePermissions); //TODO - CHECK

// Get User (by username in the token) 
app.get('/api/user', userRoute.getUser);

// Buy Ticket
app.post('/api/user/buy', userRoute.buyTicket);

// Retry Buy Ticket
app.post('/api/user/secure', userRoute.secureTicket);

// Add new comment
app.post('/api/comment', userRoute.addComment);

// Delete all Users - for debugging
app.delete('/api/user/empty', userRoute.deleteAllUsers);

app.listen(port, () => {
  console.log(`User Server running on port ${port}`);
});
