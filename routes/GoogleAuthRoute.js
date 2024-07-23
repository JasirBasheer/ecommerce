require('dotenv').config(); 
const express = require('express');
const authRoute = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const User = require('../models/userModel');

let userProfile;

authRoute.use(passport.initialize());
authRoute.use(passport.session());

authRoute.get('/success', (req, res) => res.send(userProfile));
authRoute.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});


passport.use(
    new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
  },

  async (accessToken, refreshToken, profile, done) => {
    try {
        console.log("Google profile", profile);
        let user = await User.findOne({
            email: profile.emails[0].value,
        });

        if (!user) {
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                is_blocked: 0,
            });
            await user.save();
            done(null, user);
        } else if (user.is_blocked === 0) {
            done(null, user);
        } else {
            user.isBanned = true;
            done(null, user);
        }
    } catch (error) {
        done(error, null);
    }
  }
));

authRoute.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })
);

authRoute.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    if (req.user.isBanned) {
      res.redirect('/login?message=Your account is banned.');
    } else {
      req.session.user_id=req.user;
      res.redirect('/');
    }
}
);

module.exports = authRoute;