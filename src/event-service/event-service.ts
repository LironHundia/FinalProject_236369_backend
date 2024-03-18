import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import { Event } from '../models/event-model.js';

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
dotenv.config();

let port = process.env.PORT || 3001;

const dbURI = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@finalproject.szjndb6.mongodb.net/EventsBooking?retryWrites=true&w=majority&appName=FinalProject`;
await mongoose.connect(dbURI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Add Event
app.post('/api/event', async (req, res) => {
  try {
    const { eventName, remainingTickets } = req.body;
    const newEvent = new Event({ eventName, remainingTickets });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Event
app.put('/api/event/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { remainingTickets } = req.body;
    const updatedEvent = await Event.findOneAndUpdate({ eventId }, { remainingTickets }, { new: true });
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Single Event
app.get('/api/event/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    console.log(eventId);
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.status(200).json(event);
    }
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Events with Available Tickets
app.get('/api/event', async (req, res) => {
  try {
    const events = await Event.find({ remainingTickets: { $gt: 0 } });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/event/empty', async (req, res) => {
  try {
    // Delete all orders using deleteMany method
    const deleteResult = await Event.deleteMany({});
    res.status(200).json({ message: 'event DB deleted successfully' });
  } catch (error) {
    console.error('Error deleting eventDB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Event Server running on port ${port}`);
});
