import mongoose, { Schema, Document } from 'mongoose';
import Joi from 'joi';  

enum Permission {
  Admin = "A",
  Manager = "M",
  Basice = "B",
}

// Define the ticketsCategories schema
const nextEventSchema = new Schema({
  event_name: String,
  event_id: Number,
  event_start_date: String,
  event_end_date: String,
} , {_id: false} );

// Define the event schema
const userSchema = new Schema({
  username: String,
  password: String,
  permission: { type: String, enum: Object.values(Permission) },
  num_of_oderes_made: Number,
  end_date: String,
  description: String,
  next_event: nextEventSchema,
});

export interface IUser extends Document {
  username: string;
  password: string;
  permission: string;
  num_of_oderes_made: number;
  next_event: {
    event_name: string;
    event_id: number;
    event_start_date: string;
    event_end_date: string;
  };
}

export const User = mongoose.model<IUser>('User', userSchema);


export const validateUserComment = (messageBody: any) => {
  // Define the event schema
  const eventJoiSchema = Joi.object({
      event_id: Joi.string().required(),
      username: Joi.string().required(),
      comment: Joi.string().required(),
  });

  // Validate the message body
  return eventJoiSchema.validate(messageBody);
}

export const validateUserCredentials = (messageBody: any) => {
  // Define the event schema
  const userJoiSchema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
  });

  // Validate the message body
  return userJoiSchema.validate(messageBody);
}

export const validatePermissionCredentials = (messageBody: any) => {
  // Define the event schema
  const permitJoiSchema = Joi.object({
      username: Joi.string().required(),
      permission: Joi.string().required(),
  });

  // Validate the message body
  return permitJoiSchema.validate(messageBody);
}