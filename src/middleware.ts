import bodyParser from 'body-parser';
import * as constants from './const.js';
import { isAutherizedClient } from './utilities.js';
import jwt, { JwtPayload } from 'jsonwebtoken'; // Import the jsonwebtoken package

// Middleware to check client permissions and proxy API requests
export const checkPermissionProxyMiddleware = (permissionLevel) => {
  return async (req, res, next) => {

    const token = req.cookies.userToken; // Assuming user ID is in the authorization header
    if (!token) {
      return res.status(401).send('No token!'); // Token not provided, send unauthorized status
    }

    let username;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      username = (payload as JwtPayload).username; // Removed type assertion for JavaScript
    } catch (err) {
      return res.status(401).send('Invalid token!'); // Token is invalid, send unauthorized status
    }

    try {
      // Check user validity before proceeding
      const isAutherized = await isAutherizedClient(username, permissionLevel);
      if (isAutherized === false) {
        res.status(403).send('Unauthorized permission level'); // User is not valid, send forbidden status
        return;
      }
    } catch (err) {
      console.log('Error checking user permissions');
      return res.status(500).send('Internal server error');
    }

    // User is valid, add username to the request object
    // Ensure req.body is an object before modifying it
    if (req.body && typeof req.body === 'object') {
      req.body.username = username;
    }

    // User is valid, continue with the route handling
    next();
  };
};