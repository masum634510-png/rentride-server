require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri || uri.includes("<username>")) {
  console.error("❌ Error: Please set a valid MONGODB_URI in your server/.env file before seeding.");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const cars = [
  {
    carName: "Tesla Model S Plaid",
    dailyRentPrice: 120,
    carType: "Electric",
    imageUrl: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800",
    seatCapacity: 5,
    pickupLocation: "Dhaka Airport, Terminal 1",
    description: "Experience the ultimate electric performance. 1020 horsepower, tri-motor AWD, and full autopilot capabilities. Perfect for a futuristic, luxurious ride.",
    availability: "Available",
    ownerEmail: "admin@drivefleet.com",
    bookingCount: 0,
    createdAt: new Date(),
  },
  {
    carName: "BMW M4 Competition",
    dailyRentPrice: 150,
    carType: "Luxury",
    imageUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800",
    seatCapacity: 4,
    pickupLocation: "Gulshan-2, Dhaka",
    description: "Pure driving pleasure and aggressive styling. Twin-turbo inline-6 engine producing 503 HP. Premium leather interior and high-performance package.",
    availability: "Available",
    ownerEmail: "admin@drivefleet.com",
    bookingCount: 0,
    createdAt: new Date(),
  },
  {
    carName: "Ford Mustang GT Convertible",
    dailyRentPrice: 95,
    carType: "Convertible",
    imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800",
    seatCapacity: 4,
    pickupLocation: "Banani, Dhaka",
    description: "Classic American muscle with an open-top experience. V8 engine with active valve exhaust. Iconic style meets modern technology and comfort.",
    availability: "Available",
    ownerEmail: "admin@drivefleet.com",
    bookingCount: 0,
    createdAt: new Date(),
  },
  {
    carName: "Jeep Wrangler Rubicon 4xe",
    dailyRentPrice: 85,
    carType: "SUV",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    seatCapacity: 5,
    pickupLocation: "Uttara Sector 4, Dhaka",
    description: "Go anywhere, do anything. Plug-in hybrid performance with iconic Jeep off-road capabilities. High ground clearance and open-air freedom.",
    availability: "Available",
    ownerEmail: "admin@drivefleet.com",
    bookingCount: 0,
    createdAt: new Date(),
  },
  {
    carName: "Toyota Camry Hybrid 2023",
    dailyRentPrice: 50,
    carType: "Sedan",
    imageUrl: "https://images.unsplash.com/photo-1621007947382-cc34a6211231?auto=format&fit=crop&q=80&w=800",
    seatCapacity: 5,
    pickupLocation: "Dhanmondi 27, Dhaka",
    description: "Sleek design, quiet ride, and exceptional fuel economy. Equipped with Toyota Safety Sense, premium audio, and spacious legroom.",
    availability: "Available",
    ownerEmail: "admin@drivefleet.com",
    bookingCount: 0,
    createdAt: new Date(),
  },
  {
    carName: "Honda Civic Type R",
    dailyRentPrice: 60,
    carType: "Hatchback",
    imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=800",
    seatCapacity: 5,
    pickupLocation: "Mirpur 10, Dhaka",
    description: "The ultimate hot hatch. Race-bred aerodynamics, turbocharged VTEC engine, and precision manual transmission. Unmatched handling and style.",
    availability: "Available",
    ownerEmail: "admin@drivefleet.com",
    bookingCount: 0,
    createdAt: new Date(),
  },
];

async function seed() {
  try {
    await client.connect();
    console.log("⚡ Connected to MongoDB for seeding...");
    const db = client.db("drivefleet");
    const carsCollection = db.collection("cars");

    // Clear existing cars
    console.log("🧹 Clearing existing cars from database...");
    await carsCollection.deleteMany({});

    // Insert 6 cars
    console.log(`🌱 Inserting ${cars.length} premium cars...`);
    const result = await carsCollection.insertMany(cars);
    console.log(`✅ Successfully seeded database with ${result.insertedCount} cars!`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seed();
