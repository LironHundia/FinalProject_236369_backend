import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import * as constants from '../const.js';
import * as orderRoute from './order-routes.js';
import {consumeMessages} from './consume-messages.js';


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

// Get next event by user ID
app.get('/api/order/nextEvent/:username?', orderRoute.getUserNextEvent); 

// Get all Orders by user ID
app.get('/api/order/:username?', orderRoute.getOrdersByUserId); 

// Delete All Orders - for debugging
app.delete('/api/order/empty', orderRoute.deleteAllOrders);

app.all('*', (req, res) => {
  res.status(400).json({ error: 'Bad Request' });
});

consumeMessages();

app.listen(port, () => {
  console.log(`Order Server running on port ${port}`);
});
