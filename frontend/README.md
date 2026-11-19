# Connectly Frontend

React 19 + Vite frontend for the Connectly social platform.

## Tech Stack
- **React 19** with Hooks
- **Vite** for fast dev/build
- **React Router 7** for SPA routing
- **Axios** for API requests (with JWT interceptor)
- **Socket.io-client** for real-time chat
- **Plain CSS** (no framework) — modular per-page/component files

## Project Structure
```
src/
├── components/     # Reusable UI components
│   ├── ChatSidebar.jsx
│   ├── ChatWindow.jsx
│   ├── CommentSection.jsx
│   ├── CreatePost.jsx
│   ├── CreatePostModal.jsx
│   ├── EditPostModal.jsx
│   ├── MessageInput.jsx
│   ├── Navbar.jsx
│   ├── PostGallery.jsx
│   └── ShareButton.jsx
├── context/
│   └── AuthContext.jsx   # Global auth state (user, token, login/logout)
├── pages/          # Route-level views
│   ├── Chat.jsx
│   ├── EditProfile.jsx
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Notfound.jsx
│   ├── Notifications.jsx
│   ├── Profile.jsx
│   └── Register.jsx
├── services/
│   └── api.js      # Axios instance with auth interceptor
├── styles/         # CSS files (one per page/component)
│   ├── auth.css
│   ├── chat.css
│   ├── global.css
│   ├── home.css
│   ├── navbar.css
│   ├── notifications.css
│   ├── profile.css
│   └── register.css
├── App.jsx         # Routes + Navbar wrapper
└── main.jsx        # React 18+ createRoot entry
```

## Environment Variables
Create `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

## Scripts
```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Production build to ./dist
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Key Features Implemented
- **Authentication flow** (register, login, JWT storage in localStorage)
- **Protected routes** via `AuthContext`
- **Real-time chat** with optimistic UI, edit/unsend, image sharing
- **Post feed** with create/edit/delete, like, comments, share
- **Profile management** — edit name/bio, upload/remove profile picture
- **Notifications** with real-time badges
- **User search** with debounced API calls
- **Responsive design** — mobile-first, works down to 360px