import { Comment, Rate, IRate } from '../models/comment-model.js';
import { Request, Response } from 'express';
import { setLimit, setSkip } from '../utilities.js';


export async function getCommentsArrayByEventId(req: Request, res: Response) {
    const eventId = req.params.eventId;
    if (!eventId) {
        return res.status(400).json({ error: 'EventId is required' });
    }

    let limit = setLimit(req.query.limit);
    let skip = setSkip(req.query.skip);

    try {
        const comments = await Comment.find({ eventId: eventId }).sort({ date: 1 }).skip(skip).limit(limit);
        res.status(200).json({ comments: comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getCommentsCountByEventId(req: Request, res: Response) {
    const eventId = req.params.eventId;
    if (!eventId)
        return res.status(400).json({ error: 'EventId is required' });
    try {
        const count = await Comment.countDocuments({ eventId: eventId });
        res.status(200).json({ count: count });
    } catch (error) {
        console.error('Error fetching count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getRatingCountByUsername(req: Request, res: Response) {
    const username = req.params.username;
    if (!username)
        return res.status(400).json({ error: 'Username is required' });
    try {
        const count = await Rate.countDocuments({ username: username });
        res.status(200).json({ count: count });
    }
    catch (error) {
        console.error('Error fetching count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getRatingAvgByEventId(req: Request, res: Response) {
    const eventId = req.params.eventId;
    if (!eventId)
        return res.status(400).json({ error: 'EventId is required' });
    try {
        const avg = await Rate.aggregate([{ $match: { eventId: eventId } }, { $group: { _id: null, avg: { $avg: "$rate" } } }]);
        res.status(200).json({ avg: avg[0].avg });
    }
    catch (error) {
        console.error('Error fetching avg:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getUserRatingForEvent(req: Request, res: Response) {
    const eventId = req.query.eventId;
    const username = req.query.username;
    if (!eventId || !username)
        return res.status(400).json({ error: 'EventId and username are required' });
    try {
        const rate = await Rate.findOne({ eventId: eventId, username: username });
        if (rate) {
            res.status(200).send(rate.rate);
            return;
        }
        else {
            res.status(200).send(0);
        }
    }
    catch (error) {
        console.error('Error fetching rate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deleteAllComments(req: Request, res: Response) {
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
export async function addComment(req: Request, res: Response) {
    try {
        const comment = new Comment({ eventId: req.body.eventId, author: req.body.author, comment: req.body.comment });
        await comment.save();
        res.status(201).json({ message: 'Comment added successfully', id: comment._id });

    } catch (error) {
        console.error('Error adding:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const AddComment = async (msg) => {
    try {
        const messageContent = JSON.parse(msg);
        const eventId = messageContent.eventId;
        const comment = messageContent.comment;
        const username = messageContent.username;
        const newComment = new Comment({ eventId, author: username, comment });
        await newComment.save();
    } catch (error) {
        console.error('Error adding comment:', error);
    }
};

export const HandleRate = async (msg) => {
    try {
        const messageContent = JSON.parse(msg);
        const eventId = messageContent.eventId;
        const rate = messageContent.rate;
        const username = messageContent.username;

        const existingRate = await Rate.findOne({ eventId: eventId, username: username });
        if (existingRate) {
            if (rate === 0) {
                await Rate.deleteOne({ _id: existingRate._id });
                return;
            }
            else {
                existingRate.rate = rate;
                await existingRate.save();
                return;
            }
        }

        const newRate = new Rate({ eventId, rate, username });
        await newRate.save();
    } catch (error) {
        console.error('Error adding rate:', error);
    }
}
