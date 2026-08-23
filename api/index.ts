/**
 * Vercel serverless entry — runs the whole hardened Express API as one
 * function. vercel.json rewrites /api/* here; Express receives the original
 * URL, so the same app serves Replit and Vercel unchanged.
 */
import app from '../artifacts/api-server/src/app';

export default app;
