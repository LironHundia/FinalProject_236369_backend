import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import * as constants from '../const.js';
import { User } from '../models/user-model.js';
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

// Add User
app.post('/api/user', async (req, res) => {
  try {
    const { username, permission } = req.body;
    const newUser = new User({ username, permission });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/user/comment', async (req, res) => {
  try {
    await publisherChannel.sendEvent(constants.COMMENT_EXCHANGE, constants.COMMENT_QUEUE, JSON.stringify(req.body));
    res.statusCode = 201;
    res.end("we have received your comment");
  }
  catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ error: 'Internal server error' });
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
