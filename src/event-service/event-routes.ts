import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as constants from '../const.js';
import { IEvent, Event, validateEvent } from '../models/event-model.js';
import {PublisherChannel} from './publisher-channel.js';
import { validateEventDates, validateDateUpdate} from '../utilities.js';

const publisherChannel = new PublisherChannel();

export async function addNewEvent(req: Request, res: Response) {
    try {
        // Validate the request body using the validateEvent function
        const { error } = validateEvent(req.body);
        if (error) {
            res.status(constants.STATUS_BAD_REQUEST).send(error.details[0].message);
            return;
        }
        if (validateEventDates(req.body.start_date, req.body.end_date) == false) {
            res.status(constants.STATUS_BAD_REQUEST).send('invalid date');
            return;
        }

        // If validation passes, create a new Event document and save it to the database
        const newEvent: IEvent = new Event(req.body);
        await newEvent.save();

        res.status(constants.STATUS_CREATED).send({ _id: newEvent.id });
        return;
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }
}

export async function updateEvent(req: Request, res: Response) {
    const eventId = req.params.eventId;
    const { end_date, start_date } = req.body;

    // Check if eventId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - eventId is not a valid ObjectId');
        return;
    }

    // Check if end_date is provided
    if (!end_date && !start_date) {
        res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - start_date or end_date are required');
        return;
    }

    let EndDate: string;
    let StartDate: string;
    //checking if the event exists and the new end_date is valid
    try {
        // Fetch the current event
        const currentEvent = await Event.findById(eventId);

        // Check if the event exists
        if (!currentEvent) {
            res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - event not found');
            return;
        }

        // if we updated date - take the new date, otherwise take the old one
        EndDate = end_date ? end_date : currentEvent.end_date;
        StartDate = start_date ? start_date : currentEvent.start_date;

        // Check if the update is valid
        if (!validateEventDates(StartDate, EndDate) || !validateDateUpdate(currentEvent, StartDate)) {
            res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - invalid new dates');
            return;
        }
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }

    //update the event
    let updatedEvent: IEvent;
    try {
        updatedEvent = await Event.findOneAndUpdate({ _id: eventId }, { start_date: StartDate, end_date: EndDate }, { new: true });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }

    //create update event for User and Order services by message broker
    try {
        await publisherChannel.sendEvent(constants.EVENT_UPDATE_EXCHANGE, constants.EVENT_UPDATE_QUEUE, JSON.stringify({ _id: updatedEvent._id, end_date: updatedEvent.end_date }));
        res.status(constants.STATUS_OK).send({ _id: updatedEvent._id });
        return;
    } catch (error) {
        console.error('Error sending event to message broker:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }
}

export async function getEventById(req: Request, res: Response) {
    try {
        const eventId = req.params.eventId;
        // Check if eventId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - eventId is not a valid ObjectId');
            return;
        }

        const event = await Event.findById(eventId);
        if (!event) {
            res.status(constants.STATUS_NOT_FOUND).send('Event not found');
            return;
        }
        res.status(constants.STATUS_OK).send(event);
        return;

    } catch (error) {
        console.error('Error getting event:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }
}

export async function getAllAvailableEvents(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || constants.DEFAULT_PAGE; //gets the page parameter from query params. defaulting to 1 if it's not provided.
    let limit = parseInt(req.query.limit as string) || constants.DEFAULT_LIMIT;
    limit = Math.min(limit, constants.DEFAULT_LIMIT); // limit is the minimum of the provided limit and DEFAULT_LIMIT
    const skip = (page - 1) * limit;

    try {
        const availabelEvents = await Event.aggregate([
            {
              $match: {
                'tickets.available_quantity': { $gt: 0 } // Match events with available tickets
              }
            },
            { $unwind: '$tickets' }, // Deconstruct the tickets array
            {
              $match: {
                'tickets.available_quantity': { $gt: 0 } // Match tickets that are available
              }
            },
            {
              $group: {
                _id: '$_id', // Group by event ID
                name: { $first: '$name' }, // Include the event name
                start_date: { $first: '$start_date' }, // Include the event start date
                description: { $first: '$description' }, // Include the event description
                total_available_tickets: { $first: '$total_available_tickets' }, // Include the total number of available tickets
                lowestPrice: { $min: '$tickets.price' } // Get the minimum price of available tickets
              }
            },
           // { $sort: { lowestPrice: 1 } }, // **** OPTION TO SORT BY PRICE!!! ****
            { $skip: skip }, // Skip the first 'skip' documents
            { $limit: limit } // Limit the results to 'limit' documents
          ])

        res.status(constants.STATUS_OK).send(availabelEvents);
        return;
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }
}

export async function getAllEvents(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || constants.DEFAULT_PAGE; //gets the page parameter from query params. defaulting to 1 if it's not provided.
        let limit = parseInt(req.query.limit as string) || constants.DEFAULT_LIMIT;
        limit = Math.min(limit, constants.DEFAULT_LIMIT); // limit is the minimum of the provided limit and DEFAULT_LIMIT
        const skip = (page - 1) * limit;

        const events = await Event.find().skip(skip).limit(limit);
        res.status(constants.STATUS_OK).send(events);
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }
}

export async function secureTickets(req: Request, res: Response) {
    const { eventId, ticketType, quantity, orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - eventId is not a valid ObjectId');
        return;
    }

    try {
        const event = await Event.findById(eventId);
        const ticketCategory = event.tickets.find(ticket => ticket.type === ticketType);

        if (ticketCategory && ticketCategory.available_quantity >= quantity) {
            // Reduce the available quantity to secure the tickets - TODO: Ensure this is done atomically
            ticketCategory.available_quantity -= quantity;
            event.total_available_tickets -= quantity;

            // Add a temporary reservation with orderId and expiry time
            event.reservations.push({
                orderId,
                ticketType,
                quantity,
                expiresAt: new Date(Date.now() + 2 * 60000), // 2 minutes from now
                confirmed: false
            });

            await event.save();

            // Set a timeout to release the tickets if not confirmed
            // Independently, after 2 minutes, check if the reservation is confirmed - non blocking async function
            setTimeout(async () => {
                const eventToUpdate = await Event.findById(eventId);
                const reservation = eventToUpdate.reservations.find(res => res.orderId === orderId);

                if (reservation) {
                    if (!reservation.confirmed) //if it's not confirmed, release the tickets
                    {
                        // Release the tickets
                        const ticketToUpdate = eventToUpdate.tickets.find(ticket => ticket.type === ticketType);
                        ticketToUpdate.available_quantity += quantity;
                        event.total_available_tickets += quantity;
                        eventToUpdate.reservations = eventToUpdate.reservations.filter(res => res.orderId !== orderId);
                        await eventToUpdate.save();
                    }
                    else //if it's confirmed, the tickets are bought
                    {
                        eventToUpdate.reservations = eventToUpdate.reservations.filter(res => res.orderId !== orderId);
                        await eventToUpdate.save();
                    }
                }
            }, 2 * 60000); // 2 minutes

            res.status(constants.STATUS_OK).json({ message: 'Tickets secured', orderId });
        } else {
            res.status(constants.STATUS_BAD_REQUEST).json({ message: 'Not enough tickets available' });
        }
    } catch (error) {
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Error securing tickets', error });
    }
}

export async function buyTickets(req: Request, res: Response) {
    // Endpoint to confirm ticket purchase
    const { eventId, orderId } = req.body;

    try {
        const event = await Event.findById(eventId);
        const reservation = event.reservations.find(res => res.orderId === orderId);

        if (reservation && !reservation.confirmed) {
            // Confirm the reservation
            reservation.confirmed = true;
            await event.save();

            res.status(constants.STATUS_OK).json({ message: 'Tickets purchase confirmed', orderId });
        } else {
            res.status(constants.STATUS_BAD_REQUEST).json({ message: 'Reservation not found or already confirmed' });
        }
    } catch (error) {
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Error confirming ticket purchase', error });
    }
}

export async function deleteAllEvents(req: Request, res: Response) {
    try {
        // Delete all orders using deleteMany method
        await Event.deleteMany({});
        res.status(constants.STATUS_OK).send('Event DB deleted successfully');
        return;
    } catch (error) {
        console.error('Error deleting eventDB:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }
}