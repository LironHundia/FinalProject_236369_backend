import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Comment Schema
const commentSchema = new Schema({
  eventId: String,
  author: String,
  comment: String,
  date: { type: Date, default: Date.now },
});

export const Comment = mongoose.model('Comment', commentSchema);

//Rating Schema
const RateSchema = new Schema({
  eventId: String,
  username: String,
  rate: { type: Number, min: 0, max: 5 }
});

export interface IRate extends Document {
  eventId: string;
  username: string;
  rate: number;
}

export const Rate = mongoose.model('Rate', RateSchema);

