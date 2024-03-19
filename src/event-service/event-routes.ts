import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as constants from '../const.js';
import { IEvent, Event, validateEvent } from '../models/event-model.js';
import {PublisherChannel} from './publisher-channel.js';
import { validateEventDates, validateDateUpdate} from '../utilities.js';

const publisherChannel = new PublisherChannel();

export async function addNewEvent(req: Request, res: Response)
{
    try {
        // Validate the request body using the validateEvent function
        const { error } = validateEvent(req.body);
        if (error) {
            res.status(400).send(error.details[0].message);
            return;
        }
        if (validateEventDates(req.body.start_date, req.body.end_date) == false) 
        {
            res.status(400).send('invalid date');
            return;
        }
    
        // If validation passes, create a new Event document and save it to the database
        const newEvent: IEvent = new Event(req.body);
        await newEvent.save();
        
        res.status(201).send({ _id: newEvent.id });
        return;
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).send('Internal server error');
        return;
    }
}

export async function updateEvent(req: Request, res: Response)
{
    const eventId = req.params.eventId;
    const {end_date, start_date} = req.body;

    // Check if eventId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400).send('Bad Request - eventId is not a valid ObjectId');
        return;
    }
    
    // Check if end_date is provided
    if (!end_date && !start_date) {
        res.status(400).send('Bad Request - start_date or end_date are required');
        return;
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
            res.status(400).send('Bad Request - event not found');
            return;
        }

        // if we updated date - take the new date, otherwise take the old one
        EndDate = end_date? end_date : currentEvent.end_date;
        StartDate = start_date? start_date : currentEvent.start_date;

        // Check if the update is valid
        if (!validateEventDates(StartDate, EndDate) || !validateDateUpdate(currentEvent, StartDate) )
        {
            res.status(400).send('Bad Request - invalid new dates');
            return;
        }
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).send('Internal server error');
        return;
    }
    
    //update the event
    let updatedEvent: IEvent;
    try {
        updatedEvent = await Event.findOneAndUpdate({_id: eventId}, {start_date: StartDate, end_date: EndDate}, {new: true});
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).send('Internal server error');
        return; 
    }

    //create update event for User and Order services by message broker
    try{
        await publisherChannel.sendEvent(constants.EVENT_UPDATE_EXCHANGE, constants.EVENT_UPDATE_QUEUE, JSON.stringify({_id: updatedEvent._id, end_date: updatedEvent.end_date}));
        res.status(200).send({ _id: updatedEvent._id });
        return;
    } catch (error) {
        console.error('Error sending event to message broker:', error);
        res.status(500).send('Internal server error');
        return; 
    }
}

export async function getEventById(req: Request, res: Response)
{
    try {
        const eventId = req.params.eventId;
        // Check if eventId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            res.status(400).send('Bad Request - eventId is not a valid ObjectId');
            return;
        }
        
        const event = await Event.findById(eventId);
        if (!event) {
            res.status(404).send('Event not found');
            return;
        } 
        res.status(200).send(event);
        return;
        
      } catch (error) {
        console.error('Error getting event:', error);
        res.status(500).send('Internal server error');
        return; 
      }
}

export async function getAllAvailableEvents(req: Request, res: Response)
{
    try {
        const page = parseInt(req.query.page as string) || constants.DEFAULT_PAGE; //gets the page parameter from query params. defaulting to 1 if it's not provided.
        let limit = parseInt(req.query.limit as string) || constants.DEFAULT_LIMIT;
        limit = Math.min(limit, constants.DEFAULT_LIMIT); // limit is the minimum of the provided limit and DEFAULT_LIMIT
        const skip = (page - 1) * limit;

        const events = await Event.find({ total_available_tickets: { $gt: 0 } }).skip(skip).limit(limit);
        res.status(200).send(events);
        return;
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).send('Internal server error');
        return;
    }
}

export async function getAllEvents(req: Request, res: Response)
{
    try {
        const page = parseInt(req.query.page as string) || constants.DEFAULT_PAGE; //gets the page parameter from query params. defaulting to 1 if it's not provided.
        let limit = parseInt(req.query.limit as string) || constants.DEFAULT_LIMIT;
        limit = Math.min(limit, constants.DEFAULT_LIMIT); // limit is the minimum of the provided limit and DEFAULT_LIMIT
        const skip = (page - 1) * limit;

        const events = await Event.find().skip(skip).limit(limit);
        res.status(200).send(events);
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).send('Internal server error');
        return;
    }
}

export async function secureTickets(req: Request, res: Response)
{
    //TODO
}

export async function buyTickets(req: Request, res: Response)
{
    //TODO
}

export async function deleteAllEvents(req: Request, res: Response)
{
    try {
        // Delete all orders using deleteMany method
        await Event.deleteMany({});
        res.status(200).send('Event DB deleted successfully');
        return;
    } catch (error) {
        console.error('Error deleting eventDB:', error);
        res.status(500).send('Internal server error');
        return;
    }
}