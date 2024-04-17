import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import * as constants from '../const.js';
import {consumeMessages} from './consume-messages.js';
import * as commentRoute from './comment-routes.js';

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

// Get user Rating count by username
app.get('/api/comment/userRate/:username', commentRoute.getRatingCountByUsername);

// Get event Rating avarage by username
app.get('/api/comment/eventRate/:eventId', commentRoute.getRatingAvgByEventId);

// Get user rating for specific event
app.get('/api/comment/rate', commentRoute.getUserRatingForEvent);

// Get Comments count by Event ID
app.get('/api/comment/count/:eventId?', commentRoute.getCommentsCountByEventId);

// Get Comments array by Event ID
app.get('/api/comment/:eventId?', commentRoute.getCommentsArrayByEventId);

// Delete All Comments - for debugging
app.delete('/api/comment/empty', commentRoute.deleteAllComments);

// for debugging
app.post('/api/comment', commentRoute.addComment);

app.all('*', (req, res) => {
  res.status(400).json({ error: 'Bad Request' });});

consumeMessages();

app.listen(port, () => {
  console.log(`Comment Server running on port ${port}`);
});
