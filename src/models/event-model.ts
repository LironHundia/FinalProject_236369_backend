import * as mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

// Event Schema
const eventSchema = new mongoose.Schema({
    eventName: String,
    remainingTickets: Number,
  });
  
export const Event = mongoose.model('Event', eventSchema);