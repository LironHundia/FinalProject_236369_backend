import * as mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, default: uuidv4() },
  username: String,
  permission: String,
});

export const User = mongoose.model('User', userSchema);