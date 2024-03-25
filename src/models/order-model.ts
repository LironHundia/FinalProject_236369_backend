import * as mongoose from "mongoose";

// Order Schema
const orderSchema = new mongoose.Schema({
    username: { type: String, index: true },
    eventId: String,
    quantity: Number,
    totalPrice: Number,
    ticketsType: String,
    start_date: Date,
    end_date: Date,
    purchaseDate: { type: Date, default: Date.now },
  });
  
  export const Order = mongoose.model('Order', orderSchema);
  Order.createIndexes();