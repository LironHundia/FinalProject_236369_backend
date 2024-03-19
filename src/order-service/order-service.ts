import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import * as orderRoute from './order-routes.js';

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
app.post('/api/orders', orderRoute.addOrder); //TODO - Need to move implementation to be with Message Broker (RabbitMQ) - see comment-service for reference

// Update Order date
 //TODO - Need to implement with Message Broker (RabbitMQ) - see comment-service for reference

// Get next event by user ID
app.get('/api/order/nextEvent/:userId', orderRoute.getUserNextEvent); //TODO

// Get all Orders by user ID
app.get('/api/order/:userId', orderRoute.getOrdersByUserId); //TODO

// Delete All Orders - for debugging
app.delete('/api/order/empty', orderRoute.deleteAllOrders);

app.listen(port, () => {
  console.log(`Order Server running on port ${port}`);
});
