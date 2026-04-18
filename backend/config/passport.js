const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        return done(null, user);
      } else {
        // Create new user
        const newUser = {
          name: profile.displayName,
          email: profile.emails[0].value,
          password: 'social-login-password-' + Date.now(), // Dummy password
          role: 'jobseeker', // Default role
          isVerified: true,
          profile: {
            avatar: profile.photos[0].value
          }
        };
        user = await User.create(newUser);
        return done(null, user);
      }
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }));

  // LinkedIn Strategy
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID || 'YOUR_LINKEDIN_CLIENT_ID',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'YOUR_LINKEDIN_CLIENT_SECRET',
    callbackURL: "/api/auth/linkedin/callback",
    scope: ['r_emailaddress', 'r_liteprofile'],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        return done(null, user);
      } else {
        const newUser = {
          name: profile.displayName,
          email: profile.emails[0].value,
          password: 'social-login-password-' + Date.now(),
          role: 'jobseeker',
          isVerified: true,
          profile: {
            avatar: profile.photos[0].value
          }
        };
        user = await User.create(newUser);
        return done(null, user);
      }
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }));

  // Facebook Strategy
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'YOUR_FACEBOOK_APP_SECRET',
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
      let user = await User.findOne({ email: email });

      if (user) {
        return done(null, user);
      } else {
        const newUser = {
          name: profile.displayName,
          email: email,
          password: 'social-login-password-' + Date.now(),
          role: 'jobseeker',
          isVerified: true,
          profile: {
            avatar: profile.photos ? profile.photos[0].value : ''
          }
        };
        user = await User.create(newUser);
        return done(null, user);
      }
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }));

  // Twitter Strategy
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY || 'YOUR_TWITTER_CONSUMER_KEY',
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET || 'YOUR_TWITTER_CONSUMER_SECRET',
    callbackURL: "/api/auth/twitter/callback",
    includeEmail: true
  },
  async (token, tokenSecret, profile, done) => {
    try {
      let email = profile.emails ? profile.emails[0].value : `${profile.username}@twitter.com`;
      let user = await User.findOne({ email: email });

      if (user) {
        return done(null, user);
      } else {
        const newUser = {
          name: profile.displayName,
          email: email,
          password: 'social-login-password-' + Date.now(),
          role: 'jobseeker',
          isVerified: true,
          profile: {
            avatar: profile.photos ? profile.photos[0].value : ''
          }
        };
        user = await User.create(newUser);
        return done(null, user);
      }
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }));

  // GitHub Strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'YOUR_GITHUB_CLIENT_SECRET',
    callbackURL: "/api/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let email = profile.emails ? profile.emails[0].value : `${profile.username}@github.com`;
      let user = await User.findOne({ email: email });

      if (user) {
        return done(null, user);
      } else {
        const newUser = {
          name: profile.displayName,
          email: email,
          password: 'social-login-password-' + Date.now(),
          role: 'jobseeker',
          isVerified: true,
          profile: {
            avatar: profile.photos ? profile.photos[0].value : ''
          }
        };
        user = await User.create(newUser);
        return done(null, user);
      }
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }));
};