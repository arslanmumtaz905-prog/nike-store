# Nike Store

A simple Nike store web app with a frontend and a backend.

## Files

- `index.html` — frontend page
- `file.css` — frontend styles
- `first.js` — frontend behavior
- `backend/server.js` — Express backend
- `backend/package.json` — backend dependencies

## Setup

1. Install backend dependencies:

```powershell
cd backend
npm.cmd install
```

2. Start the backend:

```powershell
node server.js
```

3. Serve the frontend from the project root:

```powershell
npx.cmd http-server -c-1 -p 8080
```

4. Open `http://127.0.0.1:8080` in your browser.

## Notes

- If MongoDB is available at `mongodb://localhost:27017/nikeStore`, the backend will use it.
- If MongoDB is unavailable, the backend falls back to built-in products.
- The checkout form sends order data to the backend when it is reachable.
