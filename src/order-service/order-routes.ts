import * as constants from '../const.js';
import { Request, Response } from 'express';
import { Order } from '../models/order-model.js';


export async function addOrder(req: Request, res: Response)  //TODO - Need to move implementation to be with Message Broker (RabbitMQ) - see comment-service for reference
{
    try {
        const { userId, eventId, tickets } = req.body;
        const newOrder = new Order({ userId, eventId, tickets });
        await newOrder.save();
        res.status(201).send(newOrder);
      } catch (error) {
        console.error('Error adding order:', error);
        res.status(500).send('Internal server error');
      }
}

export async function getUserNextEvent(req: Request, res: Response)
{
    //TODO
}

export async function getOrdersByUserId(req: Request, res: Response)
{
    //TODO - including skip and limit (see event for reference)
}

export async function deleteAllOrders(req: Request, res: Response)
{
    try {
        // Delete all orders using deleteMany method
        const deleteResult = await Order.deleteMany({});
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}