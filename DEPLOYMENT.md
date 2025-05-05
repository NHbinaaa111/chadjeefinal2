# ChadJEE - Render Deployment Guide

This guide provides instructions for deploying the ChadJEE application on Render with separate frontend and backend services.

## Overview

ChadJEE requires two services on Render:
1. **Backend Service (Web Service)** - Express API with PostgreSQL database
2. **Frontend Service (Static Site)** - React application

## Prerequisites

1. A Render account
2. A PostgreSQL database on Render (or another provider)

## Database Setup

1. Create a PostgreSQL database on Render
   - Go to the Render Dashboard → New → PostgreSQL
   - Name: `chadjee-db` (or your preferred name)
   - Database: `chadjee`
   - User: Keep the default
   - Region: Choose the closest to your users
   - Create Database

2. Note the connection details:
   - Internal Database URL
   - External Database URL
   - Username
   - Password

## Backend Deployment

1. Create a Web Service on Render
   - Go to the Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Name: `chadjee-backend` (or your preferred name)
   - Environment: Node
   - Region: Same as your database
   - Branch: main (or your preferred branch)
   - Build Command: `npm install && npm run db:push`
   - Start Command: `node server/index.js`
   - Instance Type: Free (or paid for production)

2. Set Environment Variables
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Use the **Internal** Database URL from your PostgreSQL database
   - `SESSION_SECRET`: Generate a random string (e.g., `openssl rand -base64 32`)
   - `ALLOWED_ORIGINS`: The URL of your frontend service, once created (comma-separated list if multiple)

3. Advanced Options
   - Set Auto-Deploy to Yes
   - Health Check Path: `/api/debug/auth`

## Frontend Deployment

1. Create a Static Site on Render
   - Go to the Render Dashboard → New → Static Site
   - Connect your GitHub repository
   - Name: `chadjee-frontend` (or your preferred name)
   - Branch: main (or your preferred branch)
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Region: Same as your backend service
   - Environment Variables: (see below)

2. Set Environment Variables
   - `VITE_API_URL`: The URL of your backend service (e.g., `https://chadjee-backend.onrender.com`)

## Post-Deployment Configuration

After both services are deployed:

1. Update the `ALLOWED_ORIGINS` environment variable in the backend service with your frontend URL
   - Example: `https://chadjee-frontend.onrender.com`

2. Trigger a manual deploy of the backend service to apply the updated environment variables

3. Verify the connection by:
   - Visiting the frontend URL
   - Accessing `/api/debug/auth` on the backend service

## Troubleshooting

If you encounter authentication issues:

1. Check the browser console for CORS errors
   - Make sure the frontend URL is listed in `ALLOWED_ORIGINS`

2. Verify cookies are being set
   - Check the Application tab in Chrome DevTools → Storage → Cookies
   - You should see cookies with the domain of your backend service

3. Test the `/api/debug/auth` endpoint
   - If you see `{"authenticated":false,"sessionID":"...","user":null,"cookies":false}`, session cookies are not being set correctly
   - Make sure your backend has `sameSite: 'none'` and `secure: true` for cookies in production

4. Verify proper API configuration
   - Frontend should use `VITE_API_URL` environment variable
   - All fetch calls should include `credentials: 'include'`

## Environment Variables Reference

### Backend

| Variable          | Description                              | Example                               |
|-------------------|------------------------------------------|---------------------------------------|
| NODE_ENV          | Environment (always 'production')        | `production`                          |
| DATABASE_URL      | PostgreSQL connection string             | `postgres://user:pass@host:port/db`   |
| SESSION_SECRET    | Secret for session encryption            | `random-string-here`                  |
| ALLOWED_ORIGINS   | Frontend URL(s), comma-separated         | `https://chadjee-frontend.onrender.com` |

### Frontend

| Variable       | Description                    | Example                               |
|----------------|--------------------------------|---------------------------------------|
| VITE_API_URL   | URL of the backend service     | `https://chadjee-backend.onrender.com` |

## Important Files

The following files contain critical configuration for cross-domain authentication:

- `server/auth.ts` - Session and cookie configuration
- `server/index.ts` - CORS settings
- `client/src/lib/api-config.ts` - API URL configuration
- `client/src/lib/queryClient.ts` - Centralized fetch utilities
- `client/src/hooks/use-auth.tsx` - Authentication hooks