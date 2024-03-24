import * as constants from './const.js';
import {isAutherizedClient} from './utilities.js';
import jwt, { JwtPayload } from 'jsonwebtoken'; // Import the jsonwebtoken package

// Middleware to check client permissions and proxy API requests
export const checkPermissionProxyMiddleware = (permissionLevel) => {
    return (req, res, next) => {
        // next();
        // return;
      const token = req.headers.token; // Assuming user ID is in the authorization header
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
  
      // Check user validity before proceeding
      if (!isAutherizedClient(username, permissionLevel)) {
        return res.status(403).send('Forbidden'); // User is not valid, send forbidden status
      }
    
      // User is valid, add username to the request object
      req.body.username = username;

      // User is valid, continue with the route handling
      next();
    };
  };