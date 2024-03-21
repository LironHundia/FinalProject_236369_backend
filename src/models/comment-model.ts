import * as mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

// Comment Schema
const commentSchema = new mongoose.Schema({
    eventId: String,
    userName: String,
    text: String,
  });
  
  export const Comment = mongoose.model('Comment', commentSchema);