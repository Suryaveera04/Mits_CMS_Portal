# Deployment Setup for Netlify + Render

This project now uses:
- Frontend: Vite + React, deploy to Netlify
- Backend: PHP API scripts, deploy to Render

## 1. Frontend (Netlify)
1. Push this repository to GitHub.
2. In Netlify, create a new site from the GitHub repo.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Set environment variables:
   - `VITE_API_BASE_URL=https://your-render-backend-url.onrender.com`
   - `VITE_ENABLE_MOCK_LOGIN=false`

## 2. Backend (Render)
1. Create a new Web Service on Render using this repo.
2. Set the start command to:
   - `php -S 0.0.0.0:$PORT -t backend`
3. Add these environment variables:
   - `DB_HOST=your-mysql-host`
   - `DB_NAME=mits_cms`
   - `DB_USER=your-mysql-user`
   - `DB_PASSWORD=your-mysql-password`
   - `FRONTEND_ORIGINS=https://your-netlify-app.netlify.app,http://localhost:5173`
4. Make sure your MySQL database is reachable from Render.

## Local development (your current setup)
Use these values for the local PHPMyAdmin / MySQL server running on your machine:
- `DB_HOST=localhost`
- `DB_NAME=mits_cms`
- `DB_USER=root`
- `DB_PASSWORD=`
- `VITE_API_BASE_URL=http://127.0.0.1:8000`
- `VITE_ENABLE_MOCK_LOGIN=false`

## 3. Verify
- Open the Netlify URL.
- Log in and confirm the frontend reaches the Render backend.
- If uploads or login fail, confirm the backend URL and DB env vars are correct.

## 4. Important notes
- The frontend no longer uses hard-coded `localhost/backend` URLs.
- The backend now reads DB and CORS settings from environment variables.
