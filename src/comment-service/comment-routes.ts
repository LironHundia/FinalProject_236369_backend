import { Comment } from '../models/comment-model.js';
import { Request, Response } from 'express';
import * as constants from '../const.js';


export async function getCommentsArrayByEventId(req: Request, res: Response)
{
    const eventId = req.params.eventId;
    if (!eventId) {
        return res.status(400).json({ error: 'EventId is required' });
    }

    let limit = constants.DEFAULT_LIMIT;
    let skip = constants.DEFAULT_SKIP;
    if (typeof req.query.limit === 'string') {
        const parsedLimit = parseInt(req.query.limit, 10);
        limit = parsedLimit >= 0 ? parsedLimit : limit;
    }
    if (typeof req.query.skip === 'string') {
        const parsedSkip = parseInt(req.query.skip, 10);
        skip = parsedSkip >= 0 ? parsedSkip : skip;
    }
    try {
        const comments = await Comment.find({ eventId: eventId })
            .skip(skip)
            .limit(limit);

        res.status(200).json({ message: 'Comments fetched successfully', comments: comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getCommentsCountByEventId(req: Request, res: Response)
{
    const eventId = req.params.eventId;
    if (!eventId)
        return res.status(400).json({ error: 'EventId is required' });
    try {
        const count = await Comment.countDocuments({ eventId: eventId });
        res.status(200).json({ message: 'Count fetched successfully', count: count });
    } catch (error) {
        console.error('Error fetching count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
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


// for debugging
export async function add(req: Request, res: Response)
{
    try {
        const comment = new Comment({ eventId: req.body.eventId, author: req.body.author, comment: req.body.comment }); 
        await comment.save();
        res.status(200).json({ message: 'Comment added successfully', id: comment._id });
     
    } catch (error) {
        console.error('Error adding:', error);
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
  