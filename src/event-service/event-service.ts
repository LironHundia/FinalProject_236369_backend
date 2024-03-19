import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import { IEvent, Event, validateEvent } from '../models/event-model.js';
import { validateEventDates, createSuccessfulResponse, createErrorResponse, validateDateUpdate } from '../utilities.js';
import {PublisherChannel} from './publisher-channel.js';
import * as constants from '../const.js';

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

const publisherChannel = new PublisherChannel();

// Add Event
app.post('/api/event', async (req, res) => {
  try {
    // Validate the request body using the validateEvent function
    const { error } = validateEvent(req.body);
    if (error) {
      return createErrorResponse(res, 400, JSON.stringify({ error: error.details[0].message }));
    }
    if (validateEventDates(req.body.start_date, req.body.end_date) == false) 
    {
      return createErrorResponse(res, 400, JSON.stringify({error: "invalid date" }));
    }

    // If validation passes, create a new Event document and save it to the database
    const newEvent: IEvent = new Event(req.body);
    await newEvent.save();

    return createSuccessfulResponse(res, 201,JSON.stringify({ _id: newEvent.id }));
  } catch (error) {
    console.error('Error adding event:', error);
    return createErrorResponse(res, 500, "Internal server error");
  }
});

// Update Event
app.put('/api/event/:eventId', async (req, res) => {
  const eventId = req.params.eventId;
  const {end_date, start_date} = req.body;

  // Check if eventId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return createErrorResponse(res, 400, JSON.stringify({error: "Bad Request - eventId is not a valid ObjectId"}));
  }
 
  // Check if end_date is provided
  if (!end_date && !start_date) {
    return createErrorResponse(res, 400, JSON.stringify({error: "Bad Request - start_date or end_date are required"}));
  }

  let EndDate : string;
  let StartDate : string;
  //checking if the event exists and the new end_date is valid
  try {
    // Fetch the current event
    const currentEvent = await Event.findById(eventId);

    // Check if the event exists
    if (!currentEvent)
    {
      return createErrorResponse(res, 400, JSON.stringify({error: "Bad Request - event not found"}));
    }

    // if we updated date - take the new date, otherwise take the old one
    EndDate = end_date? end_date : currentEvent.end_date;
    StartDate = start_date? start_date : currentEvent.start_date;

    // Check if the update is valid
    if (!validateEventDates(StartDate, EndDate) || !validateDateUpdate(currentEvent, StartDate) )
    {
      return createErrorResponse(res, 400, JSON.stringify({error: "Bad Request - invalid new dates"}));
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    return createErrorResponse(res, 500, JSON.stringify({error: "Internal server error"}));
  }
  
  //update the event
  let updatedEvent: IEvent;
  try {
    updatedEvent = await Event.findOneAndUpdate({_id: eventId}, {start_date: StartDate, end_date: EndDate}, {new: true});
  } catch (error) {
    console.error('Error updating event:', error);
    return createErrorResponse(res, 500, JSON.stringify({error: "Internal server error"}));
  }

  //create update event for User and Order services by message broker
  try{
    await publisherChannel.sendEvent(constants.EVENT_UPDATE_EXCHANGE, constants.EVENT_UPDATE_QUEUE, JSON.stringify({_id: updatedEvent._id, end_date: updatedEvent.end_date}));
    return createSuccessfulResponse(res, 200, JSON.stringify({_id: updatedEvent._id}));
  } catch (error) {
    console.error('Error sending event to message broker:', error);
    return createErrorResponse(res, 500, JSON.stringify({error: "Internal server error"}));
  }
});

// Get Single Event
app.get('/api/event/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    // Check if eventId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return createErrorResponse(res, 400, JSON.stringify({error: "Bad Request - eventId is not a valid ObjectId"}));
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return createErrorResponse(res, 404, JSON.stringify({error: "Event not found"}));
    } 
    return createSuccessfulResponse(res, 200, JSON.stringify(event));
    
  } catch (error) {
    console.error('Error getting event:', error);
    return createErrorResponse(res, 500, JSON.stringify({error: "Internal server error"}));
  }
});

// Get All Events with Available Tickets
app.get('/api/event', async (req, res) => {
  try {
    const events = await Event.find({ total_available_tickets: { $gt: 0 } });
    return createSuccessfulResponse(res, 200, JSON.stringify(events));
  } catch (error) {
    console.error('Error getting events:', error);
    return createErrorResponse(res, 500, JSON.stringify({error: "Internal server error"}));
  }
});

app.delete('/api/event/empty', async (req, res) => {
  try {
    // Delete all orders using deleteMany method
    const deleteResult = await Event.deleteMany({});
    return createSuccessfulResponse(res, 200, JSON.stringify({message: "event DB deleted successfully"}));
  } catch (error) {
    console.error('Error deleting eventDB:', error);
    return createErrorResponse(res, 500, JSON.stringify({error: "Internal server error"}));
  }
});

app.listen(port, () => {
  console.log(`Event Server running on port ${port}`);
});
