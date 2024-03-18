import * as amqp from 'amqplib';

export class PublisherChannel {
  channel: amqp.Channel;

  // Method to create a channel on the RabbitMQ connection
  async createChannel() {
    const connection = await amqp.connect(
      'amqps://uehgqbnf:S0nOmuKQDSCxr7BwOhS3XvAfx6_tu1Yi@sparrow.rmq.cloudamqp.com/uehgqbnf'
    );
    // Create a channel on this connection
    this.channel = await connection.createChannel();
  }

  // Method to send an event/message to a specified exchange
  async sendEvent(msg: string) {
    if (!this.channel) {
      await this.createChannel();
    }

    const exchange = 'order_exchange';

    // Declare an exchange with the specified name and type ('fanout').
    // If the exchange doesn't exist, it will be created.
    // `durable: false` means the exchange does not survive broker restarts
    await this.channel.assertExchange(exchange, 'fanout', { durable: false });

    // Publish the message to the exchange
    // The empty string as the second argument represents the routing key, which is not used by fanout exchanges
    // `Buffer.from(msg)` converts the message string into a buffer for transmission
    await this.channel.publish(exchange, '', Buffer.from(msg));
    console.log(
      `Publisher >>> | message "${msg}" published to exchange "${exchange}"`
    );
  }
}
