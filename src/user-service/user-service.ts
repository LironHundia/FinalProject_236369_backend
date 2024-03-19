import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import * as constants from '../const.js';
import { createSuccessfulResponse, createErrorResponse } from '../utilities.js';
import { User, IUser, validateUserComment } from '../models/user-model.js';
import {PublisherChannel} from './publisher-channel.js';

const app = express();
app.use(bodyParser.json());

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

const publisherChannel = new PublisherChannel();

// Add new User
app.post('/api/user', async (req, res) => {
  // Validate the request body
  const {username} = req.body;
  if (!username) {
    return createErrorResponse(res, 400, JSON.stringify({ error: "Bad Request - username is required" }));
  }

  // Ensure that the user does not exist -- TODO: Ensure in API Gateway
  try{
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      return createErrorResponse(res, 400, JSON.stringify({ error: 'Username already exists' }));
    }
  }
  catch (error) {
    console.error('Error finding user:', error);
    return createErrorResponse(res, 500, JSON.stringify({ error: 'Internal server error' }));
  }
  // Create new user
  try {
    const newUser: IUser = new User({ username: req.body.username, num_of_oderes_made: 0, next_event: { event_name: '', event_id: 0, event_start_date: '', event_end_date: '' }});
    await newUser.save();
    return createSuccessfulResponse(res, 201, JSON.stringify(newUser));
  } catch (error) {
    console.error('Error adding user:', error);
    return createErrorResponse(res, 500, JSON.stringify({ error: 'Internal server error' }));
  }
});

// Add new comment
app.post('/api/user/comment', async (req, res) => {
  // Validate the request body
  const {error} = validateUserComment(req.body);
  if (error) {
    console.error('Error validating user comment:', error);
    return createErrorResponse(res, 400, JSON.stringify({ error: error.details[0].message }));
  }
  try {
    await publisherChannel.sendEvent(constants.COMMENT_EXCHANGE, constants.COMMENT_QUEUE, JSON.stringify(req.body));
    return createSuccessfulResponse(res, 201, JSON.stringify({message: 'Comment added successfully'}));
  }
  catch (error) {
    console.error('Error adding event:', error);
    return createErrorResponse(res, 500, JSON.stringify({ error: 'Internal server error' }));
  }
});

app.delete('/api/user/empty', async (req, res) => {
  try {
    // Delete all comments except the one with the specified ID
    const deleteResult = await User.deleteMany({ username: { $ne: constants.ADMIN_USER } });
    res.status(200).json({ message: 'User DB deleted successfully' });
  } catch (error) {
    console.error('Error deleting userDB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`User Server running on port ${port}`);
});
