import { Request, Response } from 'express';
import { Order } from '../models/order-model.js';
import { set } from 'mongoose';
import { setLimit, setSkip } from '../utilities.js';


/*export async function addOrder(req: Request, res: Response)  //TODO - Need to move implementation to be with Message Broker (RabbitMQ) - see comment-service for reference
{
    try {
        const { userId, eventId, quantity, totalPrice, ticketsType, startDate, endDate } = req.body;
        const newOrder = new Order({ userId, eventId, quantity, totalPrice, ticketsType, startDate, endDate });
        await newOrder.save();
        res.status(201).send(newOrder);
    } catch (error) {
        console.error('Error adding order:', error);
        res.status(500).send('Internal server error');
    }
}*/

export async function addNewOrderFromListener(msg: string) {
    try {
        const messageContent = JSON.parse(msg);
        const { userId, eventId, quantity, totalPrice, ticketType, start_date, end_date } = messageContent;
        const newOrder = new Order({ userId, eventId, quantity, totalPrice, ticketsType: ticketType, startDate:start_date, endDate:end_date });
        await newOrder.save();
    } catch (error) {
        console.error('Error adding order:', error);
    }
}

export async function getUserNextEvent(req: Request, res: Response) {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }
    try {
        const nextEvent = await Order
            .findOne({ userId: userId, startDate: { $gte: new Date() } })
            .sort({ startDate: 1 });

        if (!nextEvent) {
            return res.status(404).json({ message: 'No upcoming events found for this user' });
        }
        res.status(200).json({ event: { eventId: nextEvent.eventId, startDate: nextEvent.startDate } });
    } catch (error) {
        console.error('Error fetching next event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getOrdersByUserId(req: Request, res: Response) {
    const userId = req.params.userId;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    let limit = setLimit(req.query.limit);
    let skip = setSkip(req.query.skip);

    try {
        const orders = await Order.find({ userId: userId }).skip(skip).limit(limit);
        res.status(200).json({ orders: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deleteAllOrders(req: Request, res: Response) {
    try {
        // Delete all orders using deleteMany method
        const deleteResult = await Order.deleteMany({});
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}