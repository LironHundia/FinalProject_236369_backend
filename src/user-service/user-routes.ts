import bcrypt from 'bcrypt';
import * as constants from '../const.js';
import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PublisherChannel } from './publisher-channel.js';
import { User, IUser, validateUserComment, validateUserCredentials, validatePermissionCredentials } from '../models/user-model.js';
import { isAutherizedClient } from '../utilities.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { assert } from 'console';


const publisherChannel = new PublisherChannel();

export async function login(req: Request, res: Response) {
    const credentials = req.body;
    const { error } = validateUserCredentials(credentials);
    if (error) {
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
        res.status(constants.STATUS_UNAUTHORIZED).send('Invalid username or password');
        return;
    }

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' })

    //TODO: CHANGE BACK TO: secure: true, sameSite: 'none'
    //res.cookie('userToken', token, { httpOnly: true, secure: false, sameSite: 'lax' });
    res.cookie('userToken', token, { httpOnly: true, secure: true, sameSite: 'none' });
    res.status(constants.STATUS_OK).send('Logged in');
}

export async function logout(req: Request, res: Response) {
    //TODO: CHANGE BACK TO: secure: true, sameSite: 'none'
    //res.clearCookie('userToken', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
    res.clearCookie('userToken', { httpOnly: true, secure: true, sameSite: 'none', path: '/' });
    res.status(200).send('Logged out');
}

export async function signup(req: Request, res: Response) {
    // Validate the request body
    const credentials = req.body;
    const { error } = validateUserCredentials(credentials);
    if (error) {
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
        const newUser: IUser = new User({ username: credentials.username, password: encryptPassword, permission: constants.WORKER_LEVEL });
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
    const token = req.cookies.userToken;
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

export async function getUsernamePermission(req: Request, res: Response) {
    const token = req.cookies.userToken;
    if (!token) {
        res.status(constants.STATUS_UNAUTHORIZED).send('Not logged in');
        return;
    }

    let username;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        username = (payload as JwtPayload).username;
        if (!payload) {
            res.status(constants.STATUS_UNAUTHORIZED).send('Invalid token');
            return;
        }
    } catch (e) {
        res.status(constants.STATUS_UNAUTHORIZED).send('Invalid token');
        return;
    }

    try {
        const user: IUser | null = await User.findOne({ username: username }).exec();
        if (!user) {
            res.status(constants.STATUS_NOT_FOUND).send('User not found');
            return;
        }
        res.status(constants.STATUS_OK).send({ username, permission: user.permission });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error');
        return;
    }
}

export async function updatePermissions(req: Request, res: Response) {
    // check if the user logged in
    const token = req.cookies.userToken;
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
        const isAutherized = await isAutherizedClient(username, constants.ADMIN_LEVEL);
        if (!isAutherized) {
            res.status(constants.STATUS_FORBIDDEN).send('Not authorized - only admin can update permissions');
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
    if (req.body.permission !== constants.MANAGER_LEVEL && req.body.permission !== constants.WORKER_LEVEL) {
        res.status(constants.STATUS_BAD_REQUEST).send('Bad Request - permission can only be changed to "M" or "W"');
        return;
    }
    // Update the user's permissions
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            res.status(constants.STATUS_NOT_FOUND).send('User not found');
            return;
        }
        user.permission = req.body.permission;
        user.save();

        res.status(constants.STATUS_OK).send('Permissions updated successfully');
    } catch (error) {
        console.error('Error updating permissions:', error);
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

    const { username, eventId, ticketType, quantity } = req.body;
    const orderId = uuidv4();
    let secureResponse;
    try {
        // Step 1: Ask the Event Server to secure tickets
        secureResponse = await axios.post(`${constants.EVENT_SERVER_URL}/api/event/secure`, {
            eventId,
            username,
            ticketType,
            quantity,
            orderId
        });

    } catch (error) {
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        }
        else {
            res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error in securing tickets');
        }
        return;
    }

    assert(secureResponse.status === constants.STATUS_OK, 'Error securing tickets');
    const token = jwt.sign({ orderId: orderId }, process.env.JWT_SECRET, { expiresIn: '2m' });
    //set the cookie in the response
    res.cookie('paymentToken', token, {
        httpOnly: true,
        secure: true,//TODO: CHANGE BACK TO: true, 
        sameSite: 'none', //TODO: CHANGE BACK TO: 'none',
        maxAge: 2 * 60 * 1000 // 2 minutes in milliseconds
    });
    res.status(constants.STATUS_OK).json({ message: 'Tickets secured', orderId });
    //add token
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
        res.status(constants.STATUS_UNAUTHORIZED).send('Invalid payment token');
        return;
    }

    const { username, eventId, ticketType, quantity, cc, holder, cvv, exp, charge } = req.body;
    //Note! validation of CC info is done on front end!

    // Step 2: Call the Payment API
    let paymentResponse;
    try {
        paymentResponse = await axios.post(constants.PAYMENT_API_URL, {
            cc,
            holder,
            cvv,
            exp,
            charge
        });
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        }
        else {
            res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error in Payment API');
        }
        return;
    }
    assert(paymentResponse.status === constants.STATUS_OK, 'Error processing payment');

    // Step 3: Confirm the purchase with the Event Server
    let confirmResponse;
    try {
        confirmResponse = await axios.post(`${constants.EVENT_SERVER_URL}/api/event/confirm`, {
            eventId,
            orderId
        });
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        }
        else {
            res.status(constants.STATUS_INTERNAL_SERVER_ERROR).send('Internal server error in Payment API');
        }
        return;
    }

    assert(confirmResponse.status === constants.STATUS_OK, 'Error confirming purchase');
    //Publish new order made!
    const msg = JSON.stringify({
        username, eventId, quantity, totalPrice: charge,
        ticketType, eventName: confirmResponse.data.eventName, description: confirmResponse.data.description, location: confirmResponse.data.location,
        organizer: confirmResponse.data.organizer, startDate: confirmResponse.data.startDate,
        endDate: confirmResponse.data.endDate
    })
    publisherChannel.sendEvent(constants.ORDER_EXCHANGE, constants.ORDER_QUEUE, msg);
    res.clearCookie('paymentToken', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' }); //TODO: CHANGE BACK TO: true, 
    res.status(constants.STATUS_OK).send(paymentResponse.data.paymentToken);
    return;
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