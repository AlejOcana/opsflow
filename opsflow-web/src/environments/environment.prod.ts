/**
 * Production environment configuration.
 * This file replaces environment.ts during production builds via fileReplacements
 * in angular.json.
 *
 * apiUrl points to the deployed Render API.
 * Default: https://opsflow-api.onrender.com/api — replace with your actual Render URL after deploy,
 * e.g. https://opsflow-api-xxxx.onrender.com/api (see docs/DEPLOY.md and render.yaml).
 * Alternatively inject via Vercel env var API_URL and regenerate this file at build time.
 * TODO: Replace the placeholder below with your real Render service URL after `render.yaml` deploy.
 */
export const environment = {
  production: true,
  apiUrl: 'https://opsflow-api.onrender.com/api' // <-- replace with actual Render URL after deploy
};
