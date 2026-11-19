# Connectly — Full-Stack Social Networking Platform

Connectly is a robust MERN (MongoDB, Express, React, Node.js) application designed for real-time social interaction. It features a modern, responsive UI with smooth animations, real-time messaging via Socket.io, and a comprehensive set of social features including post sharing, likes, comments, and profile management.

---

## 🚀 Key Features

### 👤 User Management & Profiles
- **JWT Authentication**: Secure registration and login with bcrypt password hashing.
- **Dynamic Profiles**: Customizable user bios and profile pictures.
- **Image Uploads**: Integrated with **ImageKit CDN** for high-performance image hosting and transformations.
- **Follow System**: Real-time follow/unfollow functionality with follower/following counts.

### 📱 Social Feed
- **Rich Post Creation**: Support for multi-image posts (up to 10 images) with captions.
- **Infinite Scrolling**: High-performance feed with automated pagination via Intersection Observer API.
- **Interactions**: Real-time Like/Unlike system and threaded comments.
- **Post Sharing**: Directly share posts into private 1-on-1 chats.
- **Discovery**: Dedicated endpoints for trending posts and recommended users based on popularity.

### 💬 Real-time Messaging
- **Instant Chat**: Low-latency 1-on-1 messaging powered by **Socket.io**.
- **Message Status**: Visual indicators for message status: Sent (✓), Delivered (✓✓), and Seen (✓✓ blue).
- **Media Sharing**: Send images directly in chat conversations.
- **Message Controls**: Ability to edit or "unsend" (delete) messages for both parties.
- **Optimistic UI**: Instant local updates for a seamless user experience.

### 🔔 Notifications & Search
- **Live Notifications**: Real-time alerts for likes, comments, and new followers.
- **Unread Tracking**: Persistent unread message and notification badges in the navigation bar.
- **Advanced Search**: Debounced, real-time user search to find friends and community members.

---

## 🛠 Technical Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, React Router 7, Axios, Socket.io-client |
| **Backend** | Node.js, Express 5, MongoDB (Mongoose), Socket.io |
| **Storage/CDN** | ImageKit.io |
| **Styling** | Modular CSS3 with CSS Variables & smooth Transitions |
| **Feedback** | `react-hot-toast` for professional non-blocking notifications |
| **UX** | Skeleton screens for fast perceived loading performance |

---

## 📁 Project Architecture

```text
Connectly/
├── backend/
│   ├── config/           # Database, Socket.io, and ImageKit configurations
│   ├── Controllers/      # Business logic (REST API handlers)
│   ├── middleware/       # Authentication guards and Multer upload config
│   ├── models/           # Mongoose Data Models (User, Post, Message, etc.)
│   ├── routes/           # Express API route definitions
│   └── index.js          # Main entry point
└── frontend/
    ├── src/
    │   ├── components/   # Reusable UI components (Modals, Gallery, Input, etc.)
    │   ├── context/      # Global Authentication State
    │   ├── pages/        # Main route views (Home, Chat, Profile)
    │   ├── hooks/        # Custom utility hooks (Toasts)
    │   └── styles/       # Component-specific CSS modules
    └── package.json
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- ImageKit.io account

### Environment Configuration

Create a `.env` file in the `backend/` directory:
```env
PORT = 3000
MONGO_URI = your_mongodb_uri
JWT_SECRET = your_jwt_secret
IMAGEKIT_PUBLIC_KEY = your_public_key
IMAGEKIT_PRIVATE_KEY = your_private_key
IMAGEKIT_URL_ENDPOINT = your_url_endpoint
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL = http://localhost:3000/api
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Connectly.git

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### Running the App

```bash
# Start Backend (Development mode with Nodemon)
cd backend
npm run dev

# Start Frontend (Vite)
cd ../frontend
npm run dev
```

---

## 🎨 UI & UX Highlights

- **Smooth Animations**: 0.2s ease transitions on all interactive elements for a premium feel.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop views.
- **Skeleton Screens**: Custom shimmer loaders that keep users engaged while data fetches.
- **Modern Color Palette**: Professional dark-mode-ready colors using CSS variables.

---

## 📄 License
This project is licensed under the MIT License.

## 🙌 Acknowledgements
- **ImageKit** for the reliable image CDN.
- **Socket.io** for enabling real-time capabilities.
- **React Community** for the continued innovation in UI development.