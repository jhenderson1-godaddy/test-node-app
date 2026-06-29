/**
 * Central configuration, read entirely from `process.env`.
 */

export const config = {
  /** Injected by the platform; falls back to 3000 for local dev. */
  port: process.env.PORT || 3000,

  /** Cosmetic app name shown in the UI. */
  appName: process.env.APP_NAME || 'Minimal Node App',

  nodeEnv: process.env.NODE_ENV || 'development',
};
