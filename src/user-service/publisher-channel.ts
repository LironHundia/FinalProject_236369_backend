import * as amqp from 'amqplib';
import * as constants from '../const.js';

export class PublisherChannel {
  channel: amqp.Channel;

  // Method to create a channel on the RabbitMQ connection
  async createChannel() {
    const connection = await amqp.connect(constants.RABBITMQ_URL);
    // Create a channel on this connection
    this.channel = await connection.createChannel();
  }

  // Method to send an event/message to a specified exchange
  async sendEvent(exchange: string, queue: string, msg: string) {
    if (!this.channel) {
      await this.createChannel();
    }

    // Declare the exchange with the specified name and type ('fanout')
    await this.channel.assertExchange(exchange, 'direct', { durable: false });

    // Declare the queue with the specified name
    await this.channel.assertQueue(queue, { durable: false });

    // Bind the queue to the exchange so that messages sent to the exchange are routed to this queue
    await this.channel.bindQueue(queue, exchange, '');

    // Publish the message to the exchange
    await this.channel.publish(exchange, '', Buffer.from(msg));

    console.log(
      `Publisher >>> | message "${msg}" published to exchange "${exchange}" and queue "${queue}"`
    );
  }
}
