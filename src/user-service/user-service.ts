import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import * as constants from '../const.js';
import * as userRoute from './user-routes.js';
import { createProxyMiddleware } from 'http-proxy-middleware';
import {checkPermissionProxyMiddleware} from '../middleware.js';

const app = express();
app.use(cookieParser());

// Connect to MongoDB
dotenv.config();

const port = process.env.PORT || 3002;

const dbURI = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@finalproject.szjndb6.mongodb.net/EventsBooking?retryWrites=true&w=majority&appName=FinalProject`;
await mongoose.connect(dbURI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

//Routing
// Proxy middleware for /api/event/* routes
const eventProxy = createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true
});

// Proxy middleware for /api/comment/* routes
const commentProxy = createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true
});

// Proxy middleware for /api/order/* routes
const orderProxy = createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true
});

// Apply proxy middleware for specific routes
app.put('/api/event/:eventId',checkPermissionProxyMiddleware(constants.MANAGER_LEVEL), eventProxy);
app.get('/api/event/:eventId',checkPermissionProxyMiddleware(constants.BASIC_LEVEL), eventProxy);
app.get('/api/event',checkPermissionProxyMiddleware(constants.BASIC_LEVEL), eventProxy);
app.get('/api/event/all',checkPermissionProxyMiddleware(constants.MANAGER_LEVEL), eventProxy);
app.post('/api/event',checkPermissionProxyMiddleware(constants.MANAGER_LEVEL),  eventProxy);
app.get('/api/comment/backoffice/:eventId?', checkPermissionProxyMiddleware(constants.MANAGER_LEVEL), commentProxy);
app.get('/api/comment/:eventId?', checkPermissionProxyMiddleware(constants.BASIC_LEVEL), commentProxy);
app.get('/api/order/nextEvent/:userId?',checkPermissionProxyMiddleware(constants.BASIC_LEVEL), orderProxy);
app.get('/api/order/:userId?',checkPermissionProxyMiddleware(constants.BASIC_LEVEL), orderProxy);

/////////////////////////////////////////////////////
app.use(bodyParser.json());
/////////////////////////////////////////////////////

// Signup
app.post('/api/signup', userRoute.signup);

// Login
app.post('/api/login', userRoute.login);

// Logout
app.post('/api/logout', userRoute.logout);

// Get Username (by username in the token)
app.get('/api/username', userRoute.getUsername);

// Update permissions (by username in the body)
app.put('/api/permission',checkPermissionProxyMiddleware(constants.ADMIN_LEVEL), userRoute.updatePermissions);

// Get User (by username in the token) 
app.get('/api/user', userRoute.getUser);

// Buy Ticket
app.post('/api/user/buy', userRoute.buyTicket);

// Retry Buy Ticket
app.post('/api/user/secure', userRoute.secureTicket);

// Add new comment
app.post('/api/comment', userRoute.addComment);

// Delete all Users - for debugging
app.delete('/api/user/empty', userRoute.deleteAllUsers);


app.listen(port, () => {
  console.log(`User Server running on port ${port}`);
});
