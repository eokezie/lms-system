import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";

import {
  findOrCreateUserFromGoogle,
  findOrCreateUserFromFacebook,
} from "./auth.service";
import { env } from "@/config/env";
import { FacebookProfile, GoogleProfile } from "../users/user.types";

const backendBase = env.BACKEND_BASE_URL ?? "http://localhost:3000";
const authBase = `${backendBase}/api/v1/auth`;

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${authBase}/google/callback`,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUserFromGoogle(
            profile as GoogleProfile,
          );
          done(null, user);
        } catch (err) {
          done(err as Error, undefined);
        }
      },
    ),
  );
}

if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: env.FACEBOOK_APP_ID,
        clientSecret: env.FACEBOOK_APP_SECRET,
        callbackURL: `${authBase}/facebook/callback`,
        profileFields: ["id", "displayName", "emails", "name", "photos"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUserFromFacebook(
            profile as unknown as FacebookProfile,
          );
          done(null, user);
        } catch (err) {
          done(err as Error, undefined);
        }
      },
    ),
  );
}

export default passport;
