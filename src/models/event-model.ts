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
    initial_quantity: Number,
    available_quantity: Number,
 } ,  {_id: false} );

// Define the event schema
const eventSchema = new Schema({
    name: String,
    category: { type: String, enum: Object.values(Category) }, // replace with your categories
    organizer: String,
    start_date: String,
    end_date: String,
    description: String,
    tickets: {
        type: [ticketsCategoriesSchema],
        validate: [arrayLimit, 'expects at least 1 ticket item!.']
    },
    total_available_tickets: Number,
    image_url: String,
});

function arrayLimit(val: Array<any>) {
    return val.length > 0;
}

export interface IEvent extends Document {
    name: string;
    category: string;
    organizer: string;
    start_date: string;
    end_date: string;
    description: string;
    tickets: Array<{
        type: string;
        price: number;
        initial_quantity: number;
        available_quantity: number;
    }>;
    total_available_tickets: number;
    image_url: string;
    is_event_available: boolean;
}

export const Event = mongoose.model<IEvent>('Event', eventSchema);


export const validateEvent = (messageBody: any) => {
    // Define the ticketsCategories schema
    const ticketsCategoriesJoiSchema = Joi.object({
        type: Joi.string().required(),
        price: Joi.number().required(),
        initial_quantity: Joi.number().required(),
        available_quantity: Joi.number().required(),
    });

    // Define the event schema
    const eventJoiSchema = Joi.object({
        name: Joi.string().required(),
        category: Joi.string().valid('Charity Event', 'Concert', 'Conference', 'Convention', 'Exhibition', 'Festival', 'Product Launch', 'Sport Event').required(),
        organizer: Joi.string().required(),
        start_date: Joi.string().isoDate().required(),
        end_date: Joi.string().isoDate().required(),
        description: Joi.string().required(),
        tickets: Joi.array().items(ticketsCategoriesJoiSchema).min(1).required(),
        total_available_tickets: Joi.number().required(),
        image_url: Joi.string().uri().allow('').optional(), //add difault image url if not provided
    }).unknown();

    // Validate the message body
    return eventJoiSchema.validate(messageBody);
}