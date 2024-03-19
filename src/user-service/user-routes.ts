import bcrypt from 'bcrypt';
import * as constants from '../const.js';
import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {PublisherChannel} from './publisher-channel.js';
import { User, IUser, validateUserComment, validateUserCredentials, validatePermissionCredentials } from '../models/user-model.js';
import { isAutherizedClient } from '../utilities.js';


const publisherChannel = new PublisherChannel();

export async function login(req: Request, res: Response) 
{
    const credentials = req.body;
    const { error } = validateUserCredentials(credentials);
    if(error)
    {
        console.error('Error validating user credentials:', error);
        res.status(400).send('Invalid credentials');
        return;
    }
  
    let user;
  
    try {
      user = await User.findOne({ username: credentials.username });
    }
    catch (e) {
      res.status(500).send('Internal server error');
      return;
    }
  
    if (!user || !await bcrypt.compare(credentials.password, user.password)) {
      res.status(401).send('Invalid credentials');
      return;
    }
  
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '2d' })
  
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('token', token, { httpOnly: true, secure: secure, sameSite: 'none' });
    res.status(200).send('Logged in');
}
  
export async function logout(req: Request, res: Response) 
{
    const secure = process.env.NODE_ENV === 'production';
    res.clearCookie('token', { httpOnly: true, secure: secure, sameSite: 'none' });
}
  
export async function signup(req: Request, res: Response) 
{
    // Validate the request body
    const credentials = req.body;
    const { error } = validateUserCredentials(credentials);
    if(error)
    {
        console.error('Error validating user credentials:', error);
        res.status(400).send('Invalid credentials');
        return;
    }
    // Ensure that the user does not exist
    try 
    {
        if (await User.exists({ username: credentials.username })) 
        {
            res.status(400).send('Username already exists');
            return;
        }
    } catch (e) {
        res.status(500).send('Error creating user');
        return;
    }
    
    // Create new user
    const encryptPassword = await bcrypt.hash(credentials.password, 10);
    try {
        const newUser: IUser = new User({ username: credentials.username, password: encryptPassword, permission: "B", num_of_oderes_made: 0, 
                                        next_event: { event_name: '', event_id: 0, event_start_date: '', event_end_date: '' }});
        await newUser.save();
    }
    catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send('Error creating user');
        return;
    }
  
    res.status(201).send('User created');
}
  
export async function getUsername(req: Request, res: Response) 
{
    const token = req.cookies.token;
    if (!token) {
      res.status(401).send('Not logged in');
      return;
    }
  
    let username;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      username = (payload as JwtPayload).username;
    }
    catch (e) {
      res.status(401).send('Invalid token');
      return;
    }
  
    res.status(200).send({username});
}

export async function updatePermissions(req: Request, res: Response)
{
    // check if the user logged in
    const token = req.cookies.token;
    if (!token) {
      res.status(401).send('Not logged in');
      return;
    }
    // check if the user has the permission to update permissions
    let username;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        username = (payload as JwtPayload).username;
        if(!payload)
        {
            res.status(401).send('Invalid token');
            return;
        }
        const isAutherized = await isAutherizedClient(username, "A");
        if (!isAutherized) {
            res.status(403).send('Not authorized');
            return;
        }
    } catch (e) {
        res.status(401).send('Invalid token');
        return;
    }
    // Validate the request body
    const {error} = validatePermissionCredentials(req.body);
    if (error) 
    {
        res.status(400).send('Bad Request - username and permission are required');
        return;
    }
    // Update the user's permissions
    try {
        await User.updateOne({ username: username }, { permission: req.body.permissions });
        res.status(200).send('Permissions updated successfully');
        return;
    } catch (error) {
        console.error('Error updating permissions:', error);
        res.status(500).send('Internal server error');
        return;
    }
}

export async function getUser(req: Request, res: Response)
{
    // check if the user logged in
    const token = req.cookies.token;
    if (!token) {
      res.status(401).send('Not logged in');
      return;
    }
    // check if the user has the permission to update permissions
    let username: string | null;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if(!payload)
        {
            res.status(401).send('Invalid token');
            return;
        }
        username = (payload as JwtPayload).username;
        const isAutherized = await isAutherizedClient(username, constants.ADMIN_LEVEL);
        if (!isAutherized) {
            res.status(403).send('Not authorized');
            return;
        }
    } catch (e) {
        res.status(401).send('Invalid token');
        return;
    }

    // Get the user
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            res.status(404).send('User not found');
            return;
        }
        res.status(200).send(user);
        return;
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send('Internal server error');
        return;
    }
}

export async function addComment(req: Request, res: Response)
{
    // Validate the request body
    const {error} = validateUserComment(req.body);
    if (error) {
        console.error('Error validating user comment:', error);
        res.status(400).send(JSON.stringify({ error: error.details[0].message }));
        return;
    }
    try {
        await publisherChannel.sendEvent(constants.COMMENT_EXCHANGE, constants.COMMENT_QUEUE, JSON.stringify(req.body));
        res.status(201).send('Comment added successfully');
        return;
    }
    catch (error) {
        console.error('Error adding event:', error);
        res.status(500).send('Internal server error');

    }
}

export async function buyTicket(req: Request, res: Response)
{
    //TODO
}

export async function deleteAllUsers(req: Request, res: Response)
{
    try {
        // Delete all comments except the one with the specified ID
        const deleteResult = await User.deleteMany({ username: { $ne: constants.ADMIN_USER } });
        res.status(200).json({ message: 'User DB deleted successfully' });
    } catch (error) {
        console.error('Error deleting userDB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}