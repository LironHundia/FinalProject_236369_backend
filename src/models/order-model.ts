import * as mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, default: uuidv4() },
    userId: String,
    eventId: String,
    tickets: Number,
  });
  
  export const Order = mongoose.model('Order', orderSchema);