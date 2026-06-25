const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// ===================== CORS =====================
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://rentride-client.vercel.app",
  "https://client-ivory-xi.vercel.app",
];

// Add any extra CLIENT_URL from env
if (process.env.CLIENT_URL) {
  const urls = process.env.CLIENT_URL.split(",").map((u) => u.trim());
  urls.forEach((u) => {
    if (!allowedOrigins.includes(u)) allowedOrigins.push(u);
  });
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// JWT Middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const db = client.db("drivefleet");
    const carsCollection = db.collection("cars");
    const bookingsCollection = db.collection("bookings");
    const usersCollection = db.collection("users");

    // ===================== HEALTH CHECK =====================
    app.get("/", (req, res) => {
      res.send({ message: "🚗 RentRide API is running!", status: "ok" });
    });

    // ===================== AUTH ROUTES =====================

    // Generate JWT Token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      if (!user || !user.email) {
        return res.status(400).send({ message: "Email is required" });
      }
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .send({ success: true });
    });

    // Logout - Clear Cookie
    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // ===================== USERS ROUTES =====================

    // Save User (upsert - no duplicate)
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        if (!user.email) {
          return res.status(400).send({ message: "Email is required" });
        }
        const exists = await usersCollection.findOne({ email: user.email });
        if (exists) {
          return res.send({ message: "User already exists", inserted: false });
        }
        const result = await usersCollection.insertOne({
          ...user,
          createdAt: new Date(),
        });
        res.send({ ...result, inserted: true });
      } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).send({ message: "Error saving user" });
      }
    });

    // ===================== CARS ROUTES =====================

    // Get All Cars (with search & filter)
    app.get("/cars", async (req, res) => {
      try {
        const { search, type, sort } = req.query;
        let query = {};

        if (search) {
          query.carName = { $regex: search, $options: "i" };
        }

        if (type && type !== "all") {
          query.carType = { $in: [type] };
        }

        let sortOption = { createdAt: -1 };
        if (sort === "price_asc") sortOption = { dailyRentPrice: 1 };
        if (sort === "price_desc") sortOption = { dailyRentPrice: -1 };
        if (sort === "newest") sortOption = { createdAt: -1 };

        const cars = await carsCollection.find(query).sort(sortOption).toArray();
        res.send(cars);
      } catch (error) {
        console.error("Error fetching cars:", error);
        res.status(500).send({ message: "Error fetching cars" });
      }
    });

    // Get Single Car
    app.get("/cars/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid car ID" });
        }
        const car = await carsCollection.findOne({ _id: new ObjectId(id) });
        if (!car) return res.status(404).send({ message: "Car not found" });
        res.send(car);
      } catch (error) {
        console.error("Error fetching car:", error);
        res.status(500).send({ message: "Error fetching car" });
      }
    });

    // Add Car (Protected)
    app.post("/cars", verifyToken, async (req, res) => {
      try {
        const car = {
          ...req.body,
          ownerEmail: req.user.email,
          bookingCount: 0,
          createdAt: new Date(),
        };
        const result = await carsCollection.insertOne(car);
        res.send(result);
      } catch (error) {
        console.error("Error adding car:", error);
        res.status(500).send({ message: "Error adding car" });
      }
    });

    // Update Car (Protected)
    app.put("/cars/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid car ID" });
        }
        const car = await carsCollection.findOne({ _id: new ObjectId(id) });
        if (!car) return res.status(404).send({ message: "Car not found" });
        if (car.ownerEmail !== req.user.email) {
          return res.status(403).send({ message: "Forbidden: Not your car" });
        }
        const updated = {
          $set: {
            carName: req.body.carName,
            dailyRentPrice: req.body.dailyRentPrice,
            carType: req.body.carType,
            imageUrl: req.body.imageUrl,
            seatCapacity: req.body.seatCapacity,
            pickupLocation: req.body.pickupLocation,
            description: req.body.description,
            availability: req.body.availability,
            updatedAt: new Date(),
          },
        };
        const result = await carsCollection.updateOne(
          { _id: new ObjectId(id) },
          updated
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating car:", error);
        res.status(500).send({ message: "Error updating car" });
      }
    });

    // Delete Car (Protected)
    app.delete("/cars/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid car ID" });
        }
        const car = await carsCollection.findOne({ _id: new ObjectId(id) });
        if (!car) return res.status(404).send({ message: "Car not found" });
        if (car.ownerEmail !== req.user.email) {
          return res.status(403).send({ message: "Forbidden: Not your car" });
        }
        const result = await carsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        console.error("Error deleting car:", error);
        res.status(500).send({ message: "Error deleting car" });
      }
    });

    // Get Cars by Owner (Protected)
    app.get("/my-cars", verifyToken, async (req, res) => {
      try {
        const email = req.user.email;
        const cars = await carsCollection
          .find({ ownerEmail: email })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(cars);
      } catch (error) {
        console.error("Error fetching my cars:", error);
        res.status(500).send({ message: "Error fetching your cars" });
      }
    });

    // ===================== BOOKINGS ROUTES =====================

    // Add Booking (Protected)
    app.post("/bookings", verifyToken, async (req, res) => {
      try {
        const { carId } = req.body;
        if (!carId) {
          return res.status(400).send({ message: "Car ID is required" });
        }
        if (!ObjectId.isValid(carId)) {
          return res.status(400).send({ message: "Invalid car ID" });
        }

        const car = await carsCollection.findOne({ _id: new ObjectId(carId) });
        if (!car) {
          return res.status(404).send({ message: "Car not found" });
        }

        if (car.availability === "Unavailable") {
          return res.status(400).send({ message: "Car is already booked and unavailable" });
        }

        const booking = {
          ...req.body,
          userEmail: req.user.email,
          bookingDate: new Date(),
          status: "Confirmed",
        };
        const result = await bookingsCollection.insertOne(booking);

        // Increment booking count using $inc and set availability
        await carsCollection.updateOne(
          { _id: new ObjectId(carId) },
          {
            $inc: { bookingCount: 1 },
            $set: { availability: "Unavailable" },
          }
        );

        res.send(result);
      } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).send({ message: "Error creating booking" });
      }
    });

    // Get User Bookings (Protected)
    app.get("/bookings", verifyToken, async (req, res) => {
      try {
        const email = req.user.email;
        const bookings = await bookingsCollection
          .find({ userEmail: email })
          .sort({ bookingDate: -1 })
          .toArray();
        res.send(bookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).send({ message: "Error fetching bookings" });
      }
    });

    // Cancel Booking (Protected)
    app.delete("/bookings/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid booking ID" });
        }
        const booking = await bookingsCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!booking) {
          return res.status(404).send({ message: "Booking not found" });
        }
        if (booking.userEmail !== req.user.email) {
          return res.status(403).send({ message: "Forbidden" });
        }

        // Restore car availability and decrement bookingCount
        if (booking.carId && ObjectId.isValid(booking.carId)) {
          await carsCollection.updateOne(
            { _id: new ObjectId(booking.carId) },
            {
              $inc: { bookingCount: -1 },
              $set: { availability: "Available" },
            }
          );
        }

        const result = await bookingsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).send({ message: "Error cancelling booking" });
      }
    });

    // ===================== GLOBAL ERROR HANDLER =====================
    app.use((err, req, res, next) => {
      console.error("Unhandled Error:", err.stack);
      res.status(500).send({
        success: false,
        message: err.message || "Internal Server Error",
      });
    });

    console.log("🚀 All routes registered successfully!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`🚗 RentRide server running on port ${port}`);
});
