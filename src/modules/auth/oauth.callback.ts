import { Request, Response } from "express";

import { env } from "@/config/env";
import { IUser } from "@/modules/users/user.model";
import { issueTokensForUser } from "./auth.service";
import passport from "./passport.strategies";

function getFrontendRedirectBase(): string {
  const base = env.FRONTEND_OAUTH_REDIRECT_URI;
  if (!base) return "http://localhost:3000/auth/callback";
  return base.replace(/\/$/, "");
}

export function buildOAuthSuccessRedirect(
  user: IUser,
  tokens: { accessToken: string; refreshToken: string },
): string {
  const base = getFrontendRedirectBase();
  const params = new URLSearchParams({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId: user._id.toString(),
  });
  return `${base}?${params.toString()}`;
}

export function buildOAuthErrorRedirect(message: string): string {
  const base = getFrontendRedirectBase();
  return `${base}?error=${encodeURIComponent(message)}`;
}

export function createOAuthCallback(strategyName: "google" | "facebook") {
  return (req: Request, res: Response, next: () => void) => {
    passport.authenticate(
      strategyName,
      { session: false },
      async (err: Error | null, user: IUser | false) => {
        if (err) {
          return res.redirect(buildOAuthErrorRedirect(err.message));
        }
        if (!user) {
          return res.redirect(buildOAuthErrorRedirect("Authentication failed"));
        }
        try {
          const { tokens } = await issueTokensForUser(user);
          return res.redirect(buildOAuthSuccessRedirect(user, tokens));
        } catch (e) {
          const message = e instanceof Error ? e.message : "Token issue failed";
          return res.redirect(buildOAuthErrorRedirect(message));
        }
      },
    )(req, res, next);
  };
}
