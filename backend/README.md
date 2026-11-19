# Connectly Backend

Node.js + Express 5 API server with Socket.io for real-time features.

## Tech Stack
- **Express 5** (latest)
- **MongoDB** with **Mongoose** ODM
- **Socket.io** for real-time messaging
- **JWT** authentication (jsonwebtoken)
- **bcryptjs** for password hashing
- **ImageKit** for image uploads/CDN
- **Multer** for multipart file handling
- **Nodemon** for development

## Project Structure
```
backend/
├── config/
│   ├── chatSocket.js      # Socket.io setup with JWT auth middleware
│   ├── db.js              # MongoDB connection
│   └── imagekit.js        # ImageKit client initialization
├── controllers/
│   ├── authController.js  # Register, login
│   ├── chatController.js  # Chat & message CRUD + real-time emitters
│   ├── commentController.js
│   ├── notificationController.js
│   ├── postController.js  # Posts, likes, sharing
│   └── userController.js  # Profiles, follow, profile picture upload/remove
├── middleware/
│   ├── authMiddleware.js  # protect, optionalAuth
│   └── uploadMiddleware.js # Multer config (5MB, images only)
├── models/
│   ├── Chat.js
│   ├── Comment.js
│   ├── Message.js
│   ├── Notification.js
│   ├── Post.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── commentRoutes.js
│   ├── notificationRoutes.js
│   ├── postRoutes.js
│   └── userRoutes.js
├── index.js               # Express + HTTP server + Socket.io
└── package.json
```

## Environment Variables
Create `.env`:
```env
PORT=3000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/connectly
JWT_SECRET=your-super-secret-key
IMAGEKIT_PUBLIC_KEY=public_xxx
IMAGEKIT_PRIVATE_KEY=private_xxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
```

## Scripts
```bash
npm run dev      # Nodemon (auto-reload)
npm start        # Production
```

## Socket.io Authentication
Clients connect with JWT in auth handshake:
```js
const socket = io(url, { auth: { token: jwtToken } });
```
Server validates token and attaches `socket.data.userId`.

## Real-time Events Emitted
| Event | When |
|-------|------|
| `chat:message` | New message sent |
| `chat:message_updated` | Message edited |
| `chat:message_deleted` | Message unsent |

All events include `chatId` and relevant payload. Clients join room `user:${userId}` on connect.

## Key API Endpoints (prefixed with `/api`)

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Users
- `GET /users/me` — current user profile
- `PUT /users/me` — update name/bio
- `POST /users/me/profile-picture` — upload (multipart)
- `DELETE /users/me/profile-picture` — remove
- `GET /users/:username` — public profile
- `POST /users/:id/follow` / `unfollow`
- `GET /users/search?q=...`

### Posts
- `GET /posts` — paginated feed
- `GET /posts/user/:userId` — user's posts
- `POST /posts` — create (multipart, up to 10 images)
- `PUT /posts/:id` — edit caption
- `DELETE /posts/:id` — delete
- `PUT /posts/:id/like` — toggle like
- `POST /posts/share` — share to chat

### Chat
- `GET /chats` — conversation list with unread counts
- `POST /chats/start/:otherUserId` — get/create 1-on-1
- `GET /chats/:chatId/messages` — messages (marks read)
- `POST /chats/:chatId/messages` — send (multipart)
- `PUT /chats/:chatId/messages/:messageId` — edit
- `DELETE /chats/:chatId/messages/:messageId` — unsend

### Notifications
- `GET /notifications` — list with unread count
- `PUT /notifications/:id/read` — mark read

## Deployment
- Set all env vars in hosting dashboard (Render, Railway, Fly.io, etc.)
- Ensure `PORT` matches hosting provider
- For production, restrict Socket.io CORS: `origin: "https://your-frontend.com"`