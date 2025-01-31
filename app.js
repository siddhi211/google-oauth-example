const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');
const session = require('express-session');
const dotenv = require('dotenv');

dotenv.config();
const port = 3000
console.log(process.env.CLIENT_ID)
const app = express()
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

// Set up session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  }));
app.get('/',(req,res)=>{
    res.send('<a href="/auth/google">Login with Google</a>');
})


// Step 1: Redirect the user to Google's OAuth 2.0 authorization endpoint
app.get('/auth/google', (req, res) => {
    const scopes = ['profile', 'email'];
  
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    });
  
    res.redirect(url);
  });
// Step 2: Google redirects the user to the callback route with a code
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
  
    try {
      // Step 3: Exchange the authorization code for an access token
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
  
      // Save the token in the session
      req.session.tokens = tokens;
  
      // Fetch user's Google profile info using the token
      const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
      const userInfo = await oauth2.userinfo.v2.me.get();
  
      // Display user's profile info
      res.send(`
        <h1>Hello, ${userInfo.data.name}!</h1>
        <p>Email: ${userInfo.data.email}</p>
        <img src="${userInfo.data.picture}" alt="Profile Picture">
        <br />
        <a href="/logout">Logout</a>
      `);
    } catch (error) {
      console.error('Error getting tokens:', error);
      res.status(500).send('Authentication failed');
    }
  });
  
  // Logout route
  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send('Error logging out');
      }
      res.redirect('/');
    });
  });  
app.listen(port,()=>{
    console.log(`server listening on port ${port}`)
})