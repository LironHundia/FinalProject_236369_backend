import * as mongoose from "mongoose";

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    eventId: String,
    quantity: Number,
    totalPrice: Number,
    ticketsType: String,
    startDate: Date,
    endDate: Date,
    purchaseDate: { type: Date, default: Date.now },
  });
  
  export const Order = mongoose.model('Order', orderSchema);
  Order.createIndexes();