import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import * as dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import * as constants from '../const.js';
import * as userRoute from './user-routes.js';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import {checkPermissionProxyMiddleware} from '../middleware.js';
import {signupAdmin} from '../utilities.js';

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
  origin: ['https://lironhundia.github.io', 'https://lironhundia.github.io/FinalProject_236369_frontend/', 'http://localhost:5173'],
  credentials: true, 
}));
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
  //target: 'http://localhost:3001',
  target: 'https://finalproject-backend-eventserver.onrender.com',
  changeOrigin: true,
  onProxyReq: fixRequestBody
});

// Proxy middleware for /api/comment/* routes
const commentProxy = createProxyMiddleware({
  //target: 'http://localhost:3004',
  target: 'https://finalproject-backend-commentserver.onrender.com',
  changeOrigin: true,
  onProxyReq: fixRequestBody
});

// Proxy middleware for /api/order/* routes
const orderProxy = createProxyMiddleware({
  //target: 'http://localhost:3003',
  target: 'https://finalproject-backend-orderserver.onrender.com',
  changeOrigin: true,
  onProxyReq: fixRequestBody
});

// Apply proxy middleware for specific routes
app.put('/api/event/:eventId',checkPermissionProxyMiddleware(constants.MANAGER_LEVEL), eventProxy);
app.get('/api/event/maxPrice',checkPermissionProxyMiddleware(constants.WORKER_LEVEL), eventProxy);
app.get('/api/event',checkPermissionProxyMiddleware(constants.WORKER_LEVEL), eventProxy);
app.get('/api/event/all',checkPermissionProxyMiddleware(constants.MANAGER_LEVEL), eventProxy);
app.get('/api/event/:eventId?',checkPermissionProxyMiddleware(constants.WORKER_LEVEL), eventProxy);
app.post('/api/event',checkPermissionProxyMiddleware(constants.MANAGER_LEVEL),  eventProxy);
app.get('/api/comment/eventRate/:eventId', checkPermissionProxyMiddleware(constants.WORKER_LEVEL), commentProxy);
app.get('/api/comment/userRate/:username', checkPermissionProxyMiddleware(constants.WORKER_LEVEL), commentProxy);
app.get('/api/comment/rate', checkPermissionProxyMiddleware(constants.WORKER_LEVEL), commentProxy);
app.get('/api/comment/count/:eventId', checkPermissionProxyMiddleware(constants.WORKER_LEVEL), commentProxy);
app.get('/api/comment/:eventId', checkPermissionProxyMiddleware(constants.WORKER_LEVEL), commentProxy);
app.get('/api/order/nextEvent/:userId?',checkPermissionProxyMiddleware(constants.WORKER_LEVEL), orderProxy);
app.get('/api/order/:userId?',checkPermissionProxyMiddleware(constants.WORKER_LEVEL), orderProxy);

// Signup
app.post('/api/signup', userRoute.signup);

// Get User Security Question
app.get(`/api/security/:username`, userRoute.getSecurityQuestion);

// Change Password
app.put('/api/changePassword', userRoute.changePassword);

// Login
app.post('/api/login', userRoute.login);

// Logout
app.post('/api/logout', userRoute.logout);

// Get Username (by username in the token)
app.get('/api/username', userRoute.getUsername);

// Get Username (by username in the token)
app.get('/api/permission', userRoute.getUsernamePermission);

// Update permissions (by username in the body)
app.put('/api/permission', userRoute.updatePermissions);

// Buy Ticket
app.post('/api/user/buy', checkPermissionProxyMiddleware(constants.WORKER_LEVEL), userRoute.buyTicket);

// Retry Buy Ticket
app.post('/api/user/secure', checkPermissionProxyMiddleware(constants.WORKER_LEVEL), userRoute.secureTicket);

// Add new comment
app.post('/api/comment', checkPermissionProxyMiddleware(constants.WORKER_LEVEL), userRoute.addComment);

// Add new Rate
app.post('/api/rate', checkPermissionProxyMiddleware(constants.WORKER_LEVEL), userRoute.handleRate);

// Delete all Users - for debugging
app.delete('/api/user/empty', userRoute.deleteAllUsers);

signupAdmin();

app.listen(port, () => {
  console.log(`User Server running on port ${port}`);
});

