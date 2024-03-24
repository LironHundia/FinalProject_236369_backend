import bcrypt from 'bcrypt';
import * as constants from '../const.js';
import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PublisherChannel } from './publisher-channel.js';
import { User, IUser, validateUserComment, validateUserCredentials, validatePermissionCredentials } from '../models/user-model.js';
import { isAutherizedClient } from '../utilities.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';


const publisherChannel = new PublisherChannel();

export async function login(req: Request, res: Response) {
    const credentials = req.body;
    const { error } = validateUserCredentials(credentials);
    if (error) {
        console.error('Error validating user credentials:', error);
        res.status(constants.STATUS_BAD_REQUEST).send('Invalid credentials');
        return;
    }

    let user;

    try {
        user = await User.findOne({ username: credentials.username });
    }
    catch (e) {
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }

    if (!user || !await bcrypt.compare(credentials.password, user.password)) {
        res.status(constants.STATUS_UNAUTHORIZED).send('Invalid credentials');
        return;
    }

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '2d' })

    //TODO: CHANGE BACK TO: secure: true, sameSite: 'none'
    res.cookie('userToken', token, { httpOnly: true, secure: false, sameSite: 'lax' });
    res.status(constants.STATUS_OK).send('Logged in');
}

export async function logout(req: Request, res: Response) {
    //TODO: CHANGE BACK TO: secure: true, sameSite: 'none'
    res.clearCookie('userToken', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });  
    res.status(200).send('Logged out');
}

export async function signup(req: Request, res: Response) {
    // Validate the request body
    const credentials = req.body;
    const { error } = validateUserCredentials(credentials);
    if (error) {
        console.error('Error validating user credentials:', error);
        res.status(constants.STATUS_BAD_REQUEST).send('Invalid credentials');
        return;
    }
    // Ensure that the user does not exist
    try {
        if (await User.exists({ username: credentials.username })) {
            res.status(constants.STATUS_BAD_REQUEST).send('Username already exists');
            return;
        }
    } catch (e) {
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Error creating user');
        return;
    }

    // Create new user
    const encryptPassword = await bcrypt.hash(credentials.password, 10);
    try {
        const newUser: IUser = new User({
            username: credentials.username, password: encryptPassword, permission: "B", num_of_oderes_made: 0,
            next_event: { event_name: '', event_id: 0, event_start_date: '', event_end_date: '' }
        });
        await newUser.save();
    }
    catch (error) {
        console.error('Error adding user:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Error creating user');
        return;
    }

    res.status(constants.STATUS_CREATED).send('User created');
}

export async function getUsername(req: Request, res: Response) {
    const token = req.cookies.token;
    if (!token) {
        res.status(constants.STATUS_UNAUTHORIZED).send('Not logged in');
        return;
    }

    let username;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        username = (payload as JwtPayload).username;
    }
    catch (e) {
        res.status(constants.STATUS_UNAUTHORIZED).send('Invalid token');
        return;
    }

    res.status(constants.STATUS_OK).send({ username });
}

export async function updatePermissions(req: Request, res: Response) {
    // check if the user logged in
    const token = req.cookies.token;
    if (!token) {
        res.status(constants.STATUS_UNAUTHORIZED).send('Not logged in');
        return;
    }
    // check if the user has the permission to update permissions
    let username;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        username = (payload as JwtPayload).username;
        if (!payload) {
            res.status(constants.STATUS_UNAUTHORIZED).send('Invalid token');
            return;
        }
        const isAutherized = await isAutherizedClient(username, "A");
        if (!isAutherized) {
            res.status(constants.STATUS_FORBIDDEN).send('Not authorized');
            return;
        }
    } catch (e) {
        res.status(constants.STATUS_UNAUTHORIZED).send('Invalid token');
        return;
    }
    // Validate the request body
    const { error } = validatePermissionCredentials(req.body);
    if (error) {
        res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - username and permission are required');
        return;
    }
    // Update the user's permissions
    try {
        await User.updateOne({ username: username }, { permission: req.body.permissions });
        res.status(constants.STATUS_OK).send('Permissions updated successfully');
        return;
    } catch (error) {
        console.error('Error updating permissions:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }
}

export async function getUser(req: Request, res: Response) {
    // check if the user logged in
    const token = req.cookies.token;
    if (!token) {
        res.status(constants.STATUS_UNAUTHORIZED).send('Not logged in');
        return;
    }
    // check if the user has the permission to update permissions
    let username: string | null;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload) {
            res.status(constants.STATUS_UNAUTHORIZED).send('Invalid token');
            return;
        }
        username = (payload as JwtPayload).username;
        const isAutherized = await isAutherizedClient(username, constants.ADMIN_LEVEL);
        if (!isAutherized) {
            res.status(constants.STATUS_FORBIDDEN).send('Not authorized');
            return;
        }
    } catch (e) {
        res.status(constants.STATUS_UNAUTHORIZED).send('Invalid token');
        return;
    }

    // Get the user
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            res.status(constants.STATUS_NOT_FOUND).send('User not found');
            return;
        }
        res.status(constants.STATUS_OK).send(user);
        return;
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }
}

export async function addComment(req: Request, res: Response) {
    // Validate the request body
    const { error } = validateUserComment(req.body);
    if (error) {
        console.error('Error validating user comment:', error);
        res.status(constants.STATUS_BAD_REQUEST).send(JSON.stringify({ error: error.details[0].message }));
        return;
    }
    try {
        await publisherChannel.sendEvent(constants.COMMENT_EXCHANGE, constants.COMMENT_QUEUE, JSON.stringify(req.body));
        res.status(constants.STATUS_CREATED).send('Comment added successfully');
        return;
    }
    catch (error) {
        console.error('Error adding event:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');

    }
}

export async function secureTicket(req: Request, res: Response) {

    const { userId, eventId, ticketType, quantity } = req.body;
    const orderId = uuidv4();

    // Step 1: Ask the Event Server to secure tickets
    const secureResponse = await axios.post(`${constants.EVENT_SERVER_URL}/api/event/secure`, {
        eventId,
        userId,
        ticketType,
        quantity,
        orderId
    });

    if (secureResponse.status === constants.STATUS_OK) {
        const token = jwt.sign({ orderId: orderId }, process.env.JWT_SECRET, { expiresIn: '2m' });
        //set the cookie in the response
        res.cookie('paymentToken', token, {
            httpOnly: true,
            secure: false,//TODO: CHANGE BACK TO: true, 
            sameSite: 'lax', //TODO: CHANGE BACK TO: 'none',
            maxAge: 2 * 60 * 1000 // 2 minutes in milliseconds
        });
        res.status(constants.STATUS_OK).json({ message: 'Tickets secured', orderId });
        //add token
        return;
    }
    else {
        res.status(constants.STATUS_BAD_REQUEST).json({ message: secureResponse.data.message });
    }
    return;
}

export async function buyTicket(req: Request, res: Response) {
    const sessionToken = req.cookies.paymentToken;
    if (!sessionToken) {
        res.status(constants.STATUS_UNAUTHORIZED).send('No session order found. Please try again.');
        return;
    }

    let orderId;
    try {
        const payload = jwt.verify(sessionToken, process.env.JWT_SECRET);
        orderId = (payload as JwtPayload).orderId;
    }
    catch (e) {
        res.status(constants.STATUS_UNAUTHORIZED).send('Invalid token');
        return;
    }

    const { userId, eventId, ticketType, quantity } = req.body;
    try {
        // Step 2: Call the Payment API
        const { cc, holder, cvv, exp, charge } = req.body.payment; //Note! validation of CC info is done on front end!
        const paymentResponse = await axios.post(constants.PAYMENT_API_URL, {
            cc,
            holder,
            cvv,
            exp,
            charge
        });

        if (paymentResponse.status === constants.STATUS_OK) {
            // Step 3: Confirm the purchase with the Event Server
            const confirmResponse = await axios.post(`${constants.EVENT_SERVER_URL}/api/event/confirm`, {
                eventId,
                orderId
            });

            if (confirmResponse.status === constants.STATUS_OK) {
                //Publish new order made!
                const msg = JSON.stringify({ userId, eventId, quantity, totalPrice: charge, ticketType, start_date: confirmResponse.data.start_date, end_date: confirmResponse.data.end_date })
                publisherChannel.sendEvent(constants.ORDER_EXCHANGE, constants.ORDER_QUEUE, msg);
                res.status(constants.STATUS_OK).json({ message: 'Ticket purchase successful', orderId });
            }
            else { //confirmation failed
                res.status(constants.STATUS_BAD_REQUEST).json({ message: 'Tickets final purchase failed.', orderId });
            }
        }
        else { //payment failed
            // Handle payment failure
            res.status(constants.STATUS_BAD_REQUEST).json({ message: 'Payment failed. Please try again.', orderId });
        }
    } catch (error) {
    res.status(constants.STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Error processing ticket purchase', error: error.message });
}
}

export async function deleteAllUsers(req: Request, res: Response) {
    try {
        // Delete all comments except the one with the specified ID
        const deleteResult = await User.deleteMany({ username: { $ne: constants.ADMIN_USER } });
        res.status(constants.STATUS_OK).json({ message: 'User DB deleted successfully' });
    } catch (error) {
        console.error('Error deleting userDB:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
}