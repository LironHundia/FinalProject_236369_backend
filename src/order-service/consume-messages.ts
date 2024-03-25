import * as amqp from 'amqplib';
import * as constants from '../const.js';
import { addNewOrderFromListener, updateOrder } from './order-routes.js'; // Import the updateOrder function

export const consumeMessages = async () => {
  try {
    const conn = await amqp.connect(constants.RABBITMQ_URL);
    const channel = await conn.createChannel();

    // Declare the order exchange and queue (similar to your existing code)
    const newOrderExchange = constants.ORDER_EXCHANGE;
    const newOrderQueue = constants.ORDER_QUEUE;
    await channel.assertExchange(newOrderExchange, 'direct', { durable: false });
    const orderQueueAssert = await channel.assertQueue(newOrderQueue, { durable: false });
    await channel.bindQueue(orderQueueAssert.queue, newOrderExchange, '');

    // Declare the update exchange and queue
    const updateExchange = constants.EVENT_UPDATE_EXCHANGE; // Define your update exchange name
    const updateQueue = constants.EVENT_UPDATE_QUEUE; // Define your update queue name
    await channel.assertExchange(updateExchange, 'direct', { durable: false });
    const updateQueueAssert = await channel.assertQueue(updateQueue, { durable: false });
    await channel.bindQueue(updateQueueAssert.queue, updateExchange, '');

    // Consume messages from the order queue
    await channel.consume(newOrderQueue, (msg) => {
      if (msg) {
        console.log(`Consumer (Order) >>> received message: ${msg.content.toString()}`);
        addNewOrderFromListener(msg.content.toString());
        channel.ack(msg);
      }
    });

    // Consume messages from the update queue
    await channel.consume(updateQueue, (msg) => {
      if (msg) {
        console.log(`Consumer (Update) >>> received message: ${msg.content.toString()}`);
        updateOrder(msg.content.toString()); // Call the updateOrder function
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error(error);
  }
};
