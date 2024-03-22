import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import * as eventRoute from './event-routes.js';

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
app.post('/api/event', eventRoute.addNewEvent);

// Update Event
app.put('/api/event/:eventId', eventRoute.updateEvent); 

// Get Single Event with comments array
app.get('/api/event/:eventId', eventRoute.getEventById);

// Get All Events with Available Tickets
app.get('/api/event', eventRoute.getAllAvailableEvents); //TODO - CHECK

// Get All Events
app.get('/api/event/all', eventRoute.getAllEvents); //TODO - CHECK

// Secure Tickets
app.post('/api/event/secure', eventRoute.secureTickets);  //TODO

// Buy Tickets
app.post('/api/event/confirm', eventRoute.buyTickets);  //TODO

// Delete All Events - for debugging
app.delete('/api/event/empty', eventRoute.deleteAllEvents);

app.listen(port, () => {
  console.log(`Event Server running on port ${port}`);
});
