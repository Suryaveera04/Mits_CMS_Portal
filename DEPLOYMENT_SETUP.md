# Deployment Setup for Netlify + InfinityFree

This project is configured for:
- Frontend: Vite + React deployed on Netlify
- Backend: PHP API scripts deployed on InfinityFree at `https://mits-cms.freedev.app/backend`

## 1. Frontend (Netlify)
1. Push this repository to GitHub.
2. Create a Netlify site from the repo.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Set these environment variables:
   - `VITE_API_BASE_URL=https://mits-cms.freedev.app/backend`
   - `VITE_ENABLE_MOCK_LOGIN=false`

## 2. Backend (InfinityFree)
1. Upload the `backend/` folder to your InfinityFree hosting account.
2. Ensure the PHP entry points are served from the `backend` directory.
3. Keep the existing database credentials in `backend/config.php` unchanged.
4. The production backend base URL is `https://mits-cms.freedev.app/backend`.

## 3. Verification
- Open the Netlify URL and confirm login and image loading work.
- Verify the frontend reaches `https://mits-cms.freedev.app/backend`.
- If uploads fail, confirm the InfinityFree PHP hosting path and backend URL are correct.

## 4. Important notes
- The backend now uses a centralized `BASE_URL` value in `backend/config.php`.
- The frontend should rely on `VITE_API_BASE_URL` instead of hard-coded backend URLs.
