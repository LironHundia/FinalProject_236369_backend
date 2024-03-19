import mongoose, { Schema, Document } from 'mongoose';

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