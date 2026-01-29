# Video Platform - Full-Stack Application

A full-stack video upload, processing, and streaming platform with real-time content sensitivity analysis, role-based access control (RBAC), and multi-tenant user isolation.

## 🎯 Features

### Core Features
- ✅ **Video Upload** - Upload videos with metadata (title, description)
- ✅ **Sensitivity Analysis** - Automatic content classification (safe/flagged)
- ✅ **Real-Time Updates** - Live processing progress via Socket.io
- ✅ **Video Streaming** - Smooth playback using HTTP range requests
- ✅ **Authentication & Security** - JWT-based authentication
- ✅ **Role-Based Access Control** - Viewer, Editor, and Admin roles
- ✅ **Multi-Tenant** - Data isolation per user

### User Roles
- **Viewer** - Watch videos only
- **Editor** - Upload, manage, and watch videos
- **Admin** - Full access including user management

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- JWT Authentication
- Multer (file upload)
- Socket.io (real-time updates)

### Frontend
- React + Vite
- React Router
- Axios
- Socket.io Client
- Tailwind CSS

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update MongoDB URI if needed
- Change JWT_SECRET for production

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🚀 Usage

1. **Register** - Create an account with your preferred role (Viewer/Editor/Admin)
2. **Login** - Sign in with your credentials
3. **Upload Video** (Editor/Admin only) - Upload videos with title and description
4. **Watch Progress** - See real-time processing updates
5. **View Dashboard** - Browse your videos, filter by status
6. **Stream Videos** - Click on any completed video to watch

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Videos
- `POST /api/videos/upload` - Upload video (Editor/Admin)
- `GET /api/videos` - Get all user videos
- `GET /api/videos/:id` - Get single video
- `GET /api/videos/stream/:id` - Stream video
- `DELETE /api/videos/:id` - Delete video (Editor/Admin)

## 🏗️ Architecture

### Video Processing Flow
1. User uploads video via frontend
2. Backend validates and stores video
3. Processing starts automatically
4. Socket.io broadcasts progress updates
5. Sensitivity analysis completes
6. Video marked as safe/flagged
7. User can stream the video

### Multi-Tenant Isolation
- Each user sees only their own videos
- Database queries filtered by user ID
- JWT tokens contain user information

### Role-Based Access Control
- Routes protected by authentication middleware
- Role checks on sensitive operations
- Frontend UI adapts based on user role

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- File type validation
- File size limits (500MB max)
- Multi-tenant data isolation

## 📝 Project Structure

```
video-player/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth & upload middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Video processing
│   ├── uploads/         # Video storage
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Page components
│   │   ├── services/    # API & Socket.io
│   │   ├── App.jsx      # Main app
│   │   └── main.jsx     # Entry point
│   └── index.html
└── README.md
```

## 🎨 UI Features

- Modern, responsive design
- Real-time progress bars
- Video grid with filtering
- Sensitivity status badges
- Smooth animations
- Mobile-friendly

## 🧪 Testing

### Manual Testing Steps

1. **Authentication Flow**
   - Register with different roles
   - Login and verify token storage
   - Test protected routes

2. **Video Upload**
   - Upload video as Editor
   - Verify progress bar updates
   - Check sensitivity analysis

3. **Video Streaming**
   - Click on completed video
   - Test seek functionality
   - Verify smooth playback

4. **RBAC**
   - Login as Viewer (cannot upload)
   - Login as Editor (can upload)
   - Login as Admin (full access)

5. **Multi-Tenant**
   - Create multiple users
   - Upload videos from each
   - Verify isolation

## 🚢 Deployment

### Backend Deployment
1. Set environment variables
2. Use production MongoDB URI
3. Change JWT_SECRET
4. Deploy to Heroku/Railway/Render

### Frontend Deployment
1. Update API URL in `.env`
2. Build production bundle: `npm run build`
3. Deploy to Vercel/Netlify

### Storage Considerations
For production, replace local file storage with:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

## 📄 License

ISC

## 👨‍💻 Author

Created for video platform assignment

---

**In One Line**: "It's a full-stack video upload and streaming platform with real-time content sensitivity analysis, role-based access control, and multi-tenant user isolation."
