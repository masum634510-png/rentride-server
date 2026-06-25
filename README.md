# RentRide - Server

Backend API for the RentRide Car Rental Platform.

## Tech Stack

- Node.js + Express.js
- MongoDB (Atlas)
- JWT Authentication (HTTPOnly Cookies)
- CORS

## Environment Variables

Create a `.env` file with:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
CLIENT_URL=https://your-client-domain.vercel.app
```

## Run Locally

```bash
npm install
npm start
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /jwt | No | Generate JWT token |
| POST | /logout | No | Clear cookie |
| POST | /users | No | Save user to DB |
| GET | /cars | No | Get all cars |
| GET | /cars/:id | No | Get single car |
| POST | /cars | Yes | Add a car |
| PUT | /cars/:id | Yes | Update a car |
| DELETE | /cars/:id | Yes | Delete a car |
| GET | /my-cars | Yes | Get owner's cars |
| GET | /bookings | Yes | Get user bookings |
| POST | /bookings | Yes | Book a car |
| DELETE | /bookings/:id | Yes | Cancel booking |
