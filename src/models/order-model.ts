import * as mongoose from "mongoose";

// Order Schema
const orderSchema = new mongoose.Schema({
    username: { type: String, index: true },
    eventId: String,
    eventName: String,
    description: String,
    location: String,
    organizer: String,
    quantity: Number,
    totalPrice: Number,
    ticketsType: String,
    startDate: Date,
    endDate: Date,
    purchaseDate: { type: Date, default: Date.now },
  });
  
  export const Order = mongoose.model('Order', orderSchema);
  Order.createIndexes();