import { Comment } from '../models/comment-model.js';
import { Request, Response } from 'express';
import * as constants from '../const.js';


export async function getCommentsArrayByEventId(req: Request, res: Response)
{
    //TODO - including skip and limit (see event for reference)
}

export async function getCommentsCountByEventId(req: Request, res: Response)
{
    //TODO
}

export async function deleteAllComments(req: Request, res: Response)
{
    try {
        // Delete all orders using deleteMany method
        const deleteResult = await Comment.deleteMany({});
        res.status(200).json({ message: 'comment DB deleted successfully' });
    } catch (error) {
        console.error('Error deleting commentDB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const AddComment = async (msg) => {
    try {
      const messageContent = JSON.parse(msg);
      const { eventId, text } = messageContent;
      const newComment = new Comment({ eventId, text });
      await newComment.save();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
};
  