import { Request, Response } from 'express';
import { Order } from '../models/order-model.js';
import { set } from 'mongoose';
import { setLimit, setSkip } from '../utilities.js';



export async function updateOrder(msg: string)
{
    try {
        const messageContent = JSON.parse(msg);
        const { eventId, startDate, endDate } = messageContent;
        await Order.updateMany({ eventId: eventId }, { startDate: startDate, endDate: endDate });
        return;
    } catch (error) {
        console.error('Error updating order:', error);
    }
}

export async function addNewOrderFromListener(msg: string) {
    try {
        const messageContent = JSON.parse(msg);
        const { username, eventId, quantity, totalPrice, ticketType, startDate, endDate } = messageContent;
        const newOrder = new Order({ username, eventId, quantity, totalPrice, ticketsType: ticketType, startDate:startDate, endDate:endDate });
        await newOrder.save();
    } catch (error) {
        console.error('Error adding order:', error);
    }
}

export async function getUserNextEvent(req: Request, res: Response) {
    const username = req.params.username;

    if (!username) {
        return res.status(400).json({ error: 'username is required' });
    }
    try {
        const nextEvent = await Order
            .findOne({ username: username, startDate: { $gte: new Date() } })
            .sort({ startDate: 1 });

        if (!nextEvent) {
            return res.status(404).json({ message: 'No upcoming events found for this user' });
        }
        res.status(200).json({ eventId: nextEvent.eventId, startDate: nextEvent.startDate });
    } catch (error) {
        console.error('Error fetching next event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getOrdersByUserId(req: Request, res: Response) {
    const username = req.params.username;
    if (!username) {
        return res.status(400).json({ error: 'username is required' });
    }

    let limit = setLimit(req.query.limit);
    let skip = setSkip(req.query.skip);

    try {
        const orders = await Order.find({ username: username }).skip(skip).limit(limit);
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