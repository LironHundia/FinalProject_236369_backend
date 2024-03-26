import mongoose, { Schema, Document } from 'mongoose';
import * as constants from '../const.js';
import Joi from 'joi';  

enum Permission {
  Admin = "A",
  Manager = "M",
  Worker = "W",
}

// Define the event schema
const userSchema = new Schema({
  username: String,
  password: String,
  permission: { type: String, enum: Object.values(Permission) },
});

export interface IUser extends Document {
  username: string;
  password: string;
  permission: string;
}

export const User = mongoose.model<IUser>('User', userSchema);


export const validateUserComment = (messageBody: any) => {
  // Define the event schema
  const eventJoiSchema = Joi.object({
      eventId: Joi.string().required(),
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