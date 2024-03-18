import * as amqp from 'amqplib';
import * as constants from '../const.js';
import {AddComment} from './comment-service.js';

export const consumeMessages = async () => {
  try {
    // connect to RabbitMQ -  establish a connection to the RabbitMQ broker.
    const conn = await amqp.connect(constants.RABBITMQ_URL);
    //creates a communication channel over the connection.
    const channel = await conn.createChannel();

    // Declare an exchange with the specified name and type ('direct' in this case).
    // If the exchange doesn't exist, it will be created.
    const exchange = constants.COMMENT_EXCHANGE;
    const queue = constants.COMMENT_QUEUE; // Declare the variable 'queue'
    await channel.assertExchange(exchange, 'direct', { durable: false });

    // Declare a queue with the specified name. If it doesn't exist, it will be created.
    // `{ durable: false }` here means messages in the queue are stored in memory only, not on disk.
    const queueAssert = await channel.assertQueue(constants.COMMENT_QUEUE, { durable: false });

    // Bind the queue to the exchange with a routing key
    await channel.bindQueue(queueAssert.queue, constants.COMMENT_EXCHANGE, '');

    // Consume messages from the MessageBroker queue
    await channel.consume(queue, (msg) => {
      if (msg) {
        console.log(`Comsumer >>> received message: ${msg.content.toString()}`);
        AddComment(msg.content.toString());
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error(error);
  }
};
