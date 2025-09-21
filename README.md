# Mentis911 - Smart Attendance System

A comprehensive attendance management system with AI-powered features for educational institutions.

## Project Structure

- `mentis-backend/` - Node.js/Express backend API
- `mentis-fr-js/` - Frontend application (HTML/CSS/JavaScript)

## Features

- Student and Teacher management
- Smart attendance tracking
- QR code generation for attendance
- Time table management
- Real-time attendance monitoring
- Cloudinary integration for image uploads

## Environment Variables

Create a `.env` file in the `mentis-backend` directory with the following variables:

```env
# Database Configuration
MONGODB_URL=mongodb://localhost:27017/SmartAttendence

# Server Configuration
PORT=8080
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Local Development

1. Install dependencies:
```bash
cd mentis-backend
npm install
```

2. Set up environment variables (create `.env` file)

3. Start the development server:
```bash
npm run dev
```

## Docker Deployment

### Build and run locally:
```bash
docker build -t mentis-backend .
docker run -p 8080:8080 --env-file mentis-backend/.env mentis-backend
```

### Deploy to Render:

1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Render will automatically detect the `render.yaml` configuration
4. Set up your environment variables in Render dashboard
5. Deploy!

## API Endpoints

- `GET /api/v1/users/health` - Health check endpoint
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `GET /api/v1/attendance/` - Get attendance records
- `POST /api/v1/attendance/mark` - Mark attendance

## Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT, bcrypt
- **File Upload**: Multer, Cloudinary
- **Scheduling**: node-cron
- **QR Code**: qrcode
- **Frontend**: HTML, CSS, JavaScript

## License

ISC
