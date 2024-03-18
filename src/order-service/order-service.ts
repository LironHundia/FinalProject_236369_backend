import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import {Order} from '../models/order-model.js';

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
dotenv.config();

const port = process.env.PORT || 3003;

// Connect to MongoDB
const dbURI = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@finalproject.szjndb6.mongodb.net/EventsBooking?retryWrites=true&w=majority&appName=FinalProject`;
await mongoose.connect(dbURI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


// Add Order
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, eventId, tickets } = req.body;
    const newOrder = new Order({ userId, eventId, tickets });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error adding order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/order/empty', async (req, res) => {
  try {
    // Delete all orders using deleteMany method
    const deleteResult = await Order.deleteMany({});
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Order Server running on port ${port}`);
});
