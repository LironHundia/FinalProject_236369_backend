import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
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

// Get Comments array by Event ID
app.get('/api/comment/:eventId', commentRoute.getCommentsArrayByEventId); //TODO

// Get Comments count by Event ID
app.get('/api/comment/backofficce/:eventId', commentRoute.getCommentsCountByEventId); //TODO

// Delete All Comments - for debugging
app.delete('/api/comment/empty', commentRoute.deleteAllComments);

consumeMessages();

app.listen(port, () => {
  console.log(`Comment Server running on port ${port}`);
});
