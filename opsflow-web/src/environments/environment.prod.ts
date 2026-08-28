/**
 * Production environment configuration.
 * This file replaces environment.ts during production builds via fileReplacements
 * in angular.json.
 *
 * apiUrl points to the deployed Render API. Override after deploy by updating
 * this file or by injecting via Vercel env var (e.g. VITE_API_URL / API_URL)
 * and regenerating this file at build time.
 */
export const environment = {
  production: true,
  apiUrl: 'https://opsflow-api.onrender.com/api'
};
