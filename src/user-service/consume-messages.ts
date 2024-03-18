import * as amqp from 'amqplib';
import * as constants from '../const.js';

export const consumeMessages = async () => {
  try {
    // connect to RabbitMQ
    const conn = await amqp.connect(constants.RABBITMQ_URL);
    const channel = await conn.createChannel();

    // Declare an exchange with a name 'order_exchange' and type 'fanout'.
    // 'fanout' type broadcasts all the messages it receives to all the queues it knows.
    // `{ durable: false }` means the exchange will not survive a broker restart.
    const exchange = 'order_exchange';
    const queue = 'order_queue'; // Declare the variable 'queue'
    await channel.assertExchange(exchange, 'fanout', { durable: false });

    // Declare a queue with a name 'order_queue'. If it doesn't exist, it will be created.
    // `{ durable: false }` here means messages in the queue are stored in memory only, not on disk.
    await channel.consume(queue, (msg) => {
      if (msg) {
        console.log(`Comsumer >>> received message: ${msg.content.toString()}`);
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error(error);
  }
};
