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
        if (validateEventDates(req.body.startDate, req.body.endDate) == false) {
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
    const { endDate, startDate } = req.body;

    // Check if eventId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - eventId is not a valid ObjectId');
        return;
    }

    // Check if end_date is provided
    if (!endDate && !startDate) {
        res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - start_date or end_date are required');
        return;
    }

    let updateEndDate: string;
    let updateStartDate: string;
    //checking if the event exists and the new endDate is valid
    try {
        // Fetch the current event
        const currentEvent = await Event.findById(eventId);

        // Check if the event exists
        if (!currentEvent) {
            res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - event not found');
            return;
        }

        // if we updated date - take the new date, otherwise take the old one
        updateEndDate = endDate ? endDate : currentEvent.endDate;
        updateStartDate = startDate ? startDate : currentEvent.startDate;

        // Check if the update is valid
        if (!validateEventDates(updateStartDate, updateEndDate) || !validateDateUpdate(currentEvent, updateStartDate)) {
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
        updatedEvent = await Event.findOneAndUpdate({ _id: eventId }, { startDate: updateStartDate, endDate: updateEndDate }, { new: true });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }

    //create update event for User and Order services by message broker
    try {
        await publisherChannel.sendEvent(constants.EVENT_UPDATE_EXCHANGE, constants.EVENT_UPDATE_QUEUE, JSON.stringify({ eventId: updatedEvent._id, startDate: updatedEvent.startDate, endDate: updatedEvent.endDate }));
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
                'tickets.availableQuantity': { $gt: 0 } // Match events with available tickets
              }
            },
            { $unwind: '$tickets' }, // Deconstruct the tickets array
            {
              $match: {
                'tickets.availableQuantity': { $gt: 0 } // Match tickets that are available
              }
            },
            {
              $group: {
                _id: '$_id', // Group by event ID
                name: { $first: '$name' }, // Include the event name
                category: { $first: '$category' }, // Include the event category
                description: { $first: '$description' }, // Include the event description
                startDate: { $first: '$startDate' }, // Include the event start date
                endDate: { $first: '$endDate' }, // Include the event end date
                location: { $first: '$location' }, // Include the event location
                tickets: { $push: '$tickets' }, // Include the available tickets
                totalAvailableTickets: { $first: '$totalAvailableTickets' }, // Include the total number of available tickets
                imageUrl: { $first: '$imageUrl' }, // Include the event image
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

export async function secureTickets(req: Request, res: Response) 
{
    const { eventId, username, ticketType, quantity, orderId } = req.body;
    const quantity_value = parseInt(quantity);

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - eventId is not a valid ObjectId');
        return;
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - event not found');
            return;
        }
        const ticketCategory = event.tickets.find(ticket => ticket.type === ticketType);

        if (ticketCategory && ticketCategory.availableQuantity >= quantity_value) {
            // Reduce the available quantity to secure the tickets - TODO: Ensure this is done atomically
            ticketCategory.availableQuantity -= quantity_value;
            const username = ''; // Declare or initialize the 'username' variable

            event.totalAvailableTickets -= quantity_value;

            // Add a temporary reservation with orderId and expiry time
            event.reservations.push({
                orderId,
                username,
                ticketType,
                quantity: quantity_value,
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
                        ticketToUpdate.availableQuantity += quantity_value;
                        eventToUpdate.totalAvailableTickets += quantity_value;
                        eventToUpdate.reservations = eventToUpdate.reservations.filter(res => res.orderId !== orderId);
                        await eventToUpdate.save();
                    }
                    else //if it's confirmed, the tickets are bought
                    {
                        eventToUpdate.reservations = eventToUpdate.reservations.filter(res => res.orderId !== orderId);
                        await eventToUpdate.save();
                    }
                }
                else {
                    console.log('Reservation not found');
                }
            }, 2 * 60000); // 2 minutes

            res.status(constants.STATUS_OK).json({ message: 'Tickets secured', orderId });
            return;
        } else {
            res.status(constants.STATUS_BAD_REQUEST).json({ message: 'Bad order: Not enough tickets available in this category' });
            return;
        }
    } catch (error) {
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Error securing tickets', error });
        return;
    }
}

export async function buyTickets(req: Request, res: Response) 
{
    // Endpoint to confirm ticket purchase
    const { eventId, orderId } = req.body;

    try {
        const event = await Event.findById(eventId);
        const reservation = event.reservations.find(res => res.orderId === orderId);

        if (reservation && !reservation.confirmed) {
            // Confirm the reservation
            reservation.confirmed = true;
            await event.save();

            res.status(constants.STATUS_OK).json({ message: 'Tickets purchase confirmed', eventName: event.name ,startDate: event.startDate, endDate: event.endDate});
            return;
        } else {
            res.status(constants.STATUS_BAD_REQUEST).send('Reservation not found or already confirmed');
            return;
        }
    } catch (error) {
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Error confirming ticket purchase', error });
        return;
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