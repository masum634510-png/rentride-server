# DriveFleet Server

Backend API for the DriveFleet Car Rental Platform.

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file:

```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/drivefleet
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /jwt | ❌ | Generate JWT token |
| POST | /logout | ❌ | Clear JWT cookie |
| GET | /cars | ❌ | Get all cars (search, filter, sort) |
| GET | /cars/:id | ❌ | Get single car |
| POST | /cars | ✅ | Add new car |
| PUT | /cars/:id | ✅ | Update car |
| DELETE | /cars/:id | ✅ | Delete car |
| GET | /my-cars | ✅ | Get owner's cars |
| POST | /bookings | ✅ | Create booking |
| GET | /bookings | ✅ | Get user bookings |
| DELETE | /bookings/:id | ✅ | Cancel booking |
| POST | /users | ❌ | Save user to DB |
