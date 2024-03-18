import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import { Comment } from '../models/comment-model.js';
import {consumeMessages} from './consume-messages.js';

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
dotenv.config();

const port = process.env.PORT || 3004;

const dbURI = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@finalproject.szjndb6.mongodb.net/EventsBooking?retryWrites=true&w=majority&appName=FinalProject`;
await mongoose.connect(dbURI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Add Comment
app.post('/api/comment', async (req, res) => {
  try {
    const { eventId, text } = req.body;
    const newComment = new Comment({ eventId, text });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Comments by Event ID
app.get('/api/comment/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const comments = await Comment.find({ eventId });
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/comment/empty', async (req, res) => {
  try {
    // Delete all orders using deleteMany method
    const deleteResult = await Comment.deleteMany({});
    res.status(200).json({ message: 'comment DB deleted successfully' });
  } catch (error) {
    console.error('Error deleting commentDB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const AddComment = async (msg) => {
  try {
    const messageContent = JSON.parse(msg);
    const { eventId, text } = messageContent;
    const newComment = new Comment({ eventId, text });
    await newComment.save();
  } catch (error) {
    console.error('Error adding comment:', error);
  }
};

consumeMessages();

app.listen(port, () => {
  console.log(`Comment Server running on port ${port}`);
});
