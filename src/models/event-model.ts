import mongoose, { Schema, Document } from 'mongoose';
import Joi from 'joi';  

export enum Category {
  Charity_Event = "Charity Event",
  Concert = "Concert",
  Conference = "Conference",
  Convention = "Convention",
  Exhibition = "Exhibition",
  Festival = "Festival",
  ProductLaunch = "Product Launch",
  SportEvent = "Sport Event",
}

// Define the ticketsCategories schema
const ticketsCategoriesSchema = new Schema({
    type: String,
    price: Number,
    initialQuantity: Number,
    availableQuantity: Number,
 } ,  {_id: false} );

// Define the reservation schema
 const reservationSchema = new mongoose.Schema({
    orderId: String,
    username: String,
    ticketType: String,
    quantity: Number,
    expiresAt: Date,
    confirmed: { type: Boolean, default: false }
  });

// Define the event schema
const eventSchema = new Schema({
    name: String,
    category: { type: String, enum: Object.values(Category) }, // replace with your categories
    location: String,
    startDate: String,
    endDate: String,
    description: String,
    totalAvailableTickets: Number,
    lowestPrice: Number,
    imageUrl: String,
    tickets: {
        type: [ticketsCategoriesSchema],
        validate: [arrayLimit, 'expects at least 1 ticket item!.']
    },
    reservations: [reservationSchema],
});

function arrayLimit(val: Array<any>) {
    return val.length > 0;
}

export interface IEvent extends Document {
    name: string;
    category: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
    totalAvailableTickets: number;
    lowestPrice: number;
    imageUrl: string;
    tickets: Array<{
        type: string;
        price: number;
        initialQuantity: number;
        availableQuantity: number;
    }>;
    reservations: Array<{
        username: string;
        orderId: string;
        ticketType: string;
        quantity: number;
        expiresAt: Date;
        confirmed: boolean;
    }>;
}

export const Event = mongoose.model<IEvent>('Event', eventSchema);


export const validateEvent = (messageBody: any) => {
    // Define the ticketsCategories schema
    const ticketsCategoriesJoiSchema = Joi.object({
        type: Joi.string().required(),
        price: Joi.number().required(),
        initialQuantity: Joi.number().required(),
        availableQuantity: Joi.number().required(),
    });

    // Define the event schema
    const eventJoiSchema = Joi.object({
        name: Joi.string().required(),
        category: Joi.string().valid('Charity Event', 'Concert', 'Conference', 'Convention', 'Exhibition', 'Festival', 'Product Launch', 'Sport Event').required(),
        location: Joi.string().optional(),
        startDate: Joi.string().isoDate().required(),
        endDate: Joi.string().isoDate().required(),
        description: Joi.string().required(),
        tickets: Joi.array().items(ticketsCategoriesJoiSchema).min(1).required(),
        totalAvailableTickets: Joi.number().required(),
        lowestPrice: Joi.number().required(),
        imageUrl: Joi.string().uri().allow('').optional(), //add difault image url if not provided
    }).unknown();

    // Validate the message body
    return eventJoiSchema.validate(messageBody);
}