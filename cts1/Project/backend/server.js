const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: __dirname + '/.env' });
console.log("✅ .env loaded:", process.env.MONGO_URI ? "Yes" : "No");
console.log("MONGO_URI =", process.env.MONGO_URI);


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI);



const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


// Schemas
const userSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: false,
    required: function () {
      return this.role === 'student'; // ✅ required only for students
    }
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: String,
  role: {
    type: String,
    enum: ['student', 'admin', 'driver'],
    default: 'student'
  },
  feePaid: { type: Boolean, default: false },
  assignedRoute: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});



const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  route: { type: String, required: true },
  area: { type: String, required: true },
  fromCity: { type: String, required: true },
  toCity: { type: String, required: true },
  driverName: String,
  driverPhone: String,
  capacity: Number,
  currentLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  destination: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  isActive: { type: Boolean, default: true },
  currentSpeed: { type: Number, default: 0 }, // km/h
  lastUpdated: { type: Date, default: Date.now }
});

const routeSchema = new mongoose.Schema({
  routeName: { type: String, required: true },
  area: { type: String, required: true },
  stops: [{
    stopName: String,
    latitude: Number,
    longitude: Number,
    estimatedTime: String
  }]
});


const attendanceSchema = new mongoose.Schema({
  studentId: String,
  routeName: String,
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["Present", "Absent"], default: "Present" }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

const announcementSchema = new mongoose.Schema({
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const Announcement = mongoose.model("Announcement", announcementSchema);

// Models
const User = mongoose.model('User', userSchema);
const Bus = mongoose.model('Bus', busSchema);
const Route = mongoose.model('Route', routeSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ADMIN_CREATION_KEY = process.env.ADMIN_CREATION_KEY;
const BUS_CREATION_KEY = process.env.BUS_CREATION_KEY;


// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ✅ Role-based authorization middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
};


// Helper function to calculate distance using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// Helper function to estimate arrival time
const estimateArrivalTime = (distance, currentSpeed = 30) => {
  const averageSpeed = currentSpeed > 0 ? currentSpeed : 30; // km/h
  const timeInHours = distance / averageSpeed;
  const timeInMinutes = Math.round(timeInHours * 60);
  return timeInMinutes;
};

// Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { studentId, name, email, password, phoneNumber, role, adminKey } = req.body;

    // 🚫 Prevent anyone from creating admin accounts without the secret key
    if (role === 'admin' && adminKey !== process.env.ADMIN_CREATION_KEY) {
      return res.status(403).json({ message: 'Invalid admin creation key' });
    }

    // 🔍 Validate: studentId is required only for students
    if (role === 'student' && !studentId) {
      return res.status(400).json({ message: 'studentId is required for students' });
    }

    // 🔍 Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧾 Create user with role (default student)
    const user = new User({
      studentId,
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role: role || 'student'
    });

    await user.save();

    // 🎟️ Generate JWT with role
    const token = jwt.sign(
      { userId: user._id, studentId: user.studentId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        studentId: user.studentId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, studentId, password } = req.body;

    // 🔍 Check both email (for admin) and studentId (for student)
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (studentId) {
      user = await User.findOne({ studentId });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 🎟 Generate token with role
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // ✅ Send proper response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId || null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login/admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Admin-only route
app.get('/api/admin/dashboard',
  authenticateToken,
  authorizeRoles('admin'),
  (req, res) => res.json({ message: `Welcome Admin ${req.user.studentId || req.user.email}` })
);

// Student-only route
app.get('/api/student/dashboard',
  authenticateToken,
  authorizeRoles('student'),
  (req, res) => res.json({ message: `Welcome Student ${req.user.studentId}` })
);

// ✅ Update user fee payment
app.put("/api/users/:id/fee", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { feePaid: req.body.feePaid }, { new: true });
    res.json({ message: "Fee updated", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating fee", error: error.message });
  }
});
app.post("/api/attendance", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { studentId, routeName, status } = req.body;
    const attendance = new Attendance({ studentId, routeName, status });
    await attendance.save();
    res.json({ message: "Attendance marked", attendance });
  } catch (err) {
    res.status(500).json({ message: "Error marking attendance", error: err.message });
  }
});

// ✅ View attendance summary
app.get("/api/attendance", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const data = await Attendance.find().sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance", error: err.message });
  }
});

// ✅ Send announcement
app.post("/api/alerts", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { message } = req.body;
    const alert = new Announcement({ message });
    await alert.save();
    res.json({ message: "Alert sent", alert });
  } catch (err) {
    res.status(500).json({ message: "Error sending alert", error: err.message });
  }
});

// ✅ Get all announcements
app.get("/api/alerts", authenticateToken, async (req, res) => {
  try {
    const alerts = await Announcement.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching alerts", error: err.message });
  }
});




// Bus Routes
app.get('/api/buses', authenticateToken, async (req, res) => {
  try {
    const buses = await Bus.find({ isActive: true });
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/buses/area/:area', authenticateToken, async (req, res) => {
  try {
    const { area } = req.params;
    const buses = await Bus.find({ area, isActive: true });
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/buses/:busNumber', authenticateToken, async (req, res) => {
  try {
    const { busNumber } = req.params;
    const bus = await Bus.findOne({ busNumber });
    
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/buses/track', authenticateToken, async (req, res) => {
  try {
    const { busNumber, userLatitude, userLongitude } = req.body;

    const bus = await Bus.findOne({ busNumber, isActive: true });
    
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    const distanceFromUser = calculateDistance(
      userLatitude,
      userLongitude,
      bus.currentLocation.latitude,
      bus.currentLocation.longitude
    );

    const distanceToDestination = calculateDistance(
      bus.currentLocation.latitude,
      bus.currentLocation.longitude,
      bus.destination.latitude,
      bus.destination.longitude
    );

    const estimatedTimeToUser = estimateArrivalTime(distanceFromUser, bus.currentSpeed);
    const estimatedTimeToDestination = estimateArrivalTime(distanceToDestination, bus.currentSpeed);

    res.json({
      bus: {
        busNumber: bus.busNumber,
        route: bus.route,
        area: bus.area,
        fromCity: bus.fromCity,
        toCity: bus.toCity,
        driverName: bus.driverName,
        driverPhone: bus.driverPhone,
        currentLocation: bus.currentLocation,
        destination: bus.destination,
        currentSpeed: bus.currentSpeed,
        lastUpdated: bus.lastUpdated
      },
      distanceFromUser: distanceFromUser.toFixed(2),
      distanceToDestination: distanceToDestination.toFixed(2),
      estimatedArrivalToUser: estimatedTimeToUser,
      estimatedArrivalToDestination: estimatedTimeToDestination,
      userLocation: {
        latitude: userLatitude,
        longitude: userLongitude
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unique areas
app.get('/api/areas', authenticateToken, async (req, res) => {
  try {
    const areas = await Bus.distinct('area');
    res.json(areas);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unique cities
app.get('/api/cities', authenticateToken, async (req, res) => {
  try {
    const fromCities = await Bus.distinct('fromCity');
    res.json(fromCities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route information
app.get('/api/routes', authenticateToken, async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/routes/area/:area', authenticateToken, async (req, res) => {
  try {
    const { area } = req.params;
    const routes = await Route.find({ area });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin route to update bus location (for testing/demo)
app.put('/api/buses/:busNumber/location', async (req, res) => {
  try {
    const { busNumber } = req.params;
    const { latitude, longitude, speed } = req.body;

    const updateData = {
      currentLocation: { latitude, longitude },
      lastUpdated: new Date()
    };

    if (speed !== undefined) {
      updateData.currentSpeed = speed;
    }

    const bus = await Bus.findOneAndUpdate(
      { busNumber },
      updateData,
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json({ message: 'Bus location updated', bus });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seed data route (for testing)
app.get('/api/seed', async (req, res) => {
  try {
    await Bus.deleteMany({});
    await Route.deleteMany({});

    // University campus location (Vignan University, Guntur)
    const universityLocation = { latitude: 16.4419, longitude: 80.5189 };

    // Sample buses from different cities
    const buses = [
      // From Guntur
      {
        busNumber: 'VU-GT-101',
        route: 'A1',
        area: 'Guntur',
        fromCity: 'Guntur',
        toCity: 'Vignan University',
        driverName: 'Rajesh Kumar',
        driverPhone: '+91-9876543210',
        capacity: 50,
        currentLocation: { latitude: 16.3067, longitude: 80.4365 }, // Guntur city
        destination: universityLocation,
        currentSpeed: 35,
        isActive: true
      },
      {
        busNumber: 'VU-GT-102',
        route: 'A2',
        area: 'Guntur',
        fromCity: 'Guntur',
        toCity: 'Vignan University',
        driverName: 'Suresh Reddy',
        driverPhone: '+91-9876543211',
        capacity: 45,
        currentLocation: { latitude: 16.3500, longitude: 80.4600 },
        destination: universityLocation,
        currentSpeed: 40,
        isActive: true
      },
      // From Vijayawada
      {
        busNumber: 'VU-VJ-201',
        route: 'B1',
        area: 'Vijayawada',
        fromCity: 'Vijayawada',
        toCity: 'Vignan University',
        driverName: 'Venkat Rao',
        driverPhone: '+91-9876543212',
        capacity: 50,
        currentLocation: { latitude: 16.5062, longitude: 80.6480 }, // Vijayawada
        destination: universityLocation,
        currentSpeed: 45,
        isActive: true
      },
      {
        busNumber: 'VU-VJ-202',
        route: 'B2',
        area: 'Vijayawada',
        fromCity: 'Vijayawada',
        toCity: 'Vignan University',
        driverName: 'Prakash Singh',
        driverPhone: '+91-9876543213',
        capacity: 48,
        currentLocation: { latitude: 16.5100, longitude: 80.6300 },
        destination: universityLocation,
        currentSpeed: 42,
        isActive: true
      },
      // From Tenali
      {
        busNumber: 'VU-TN-301',
        route: 'C1',
        area: 'Tenali',
        fromCity: 'Tenali',
        toCity: 'Vignan University',
        driverName: 'Ramesh Babu',
        driverPhone: '+91-9876543214',
        capacity: 45,
        currentLocation: { latitude: 16.2428, longitude: 80.6474 }, // Tenali
        destination: universityLocation,
        currentSpeed: 38,
        isActive: true
      },
      {
        busNumber: 'VU-TN-302',
        route: 'C2',
        area: 'Tenali',
        fromCity: 'Tenali',
        toCity: 'Vignan University',
        driverName: 'Krishna Murthy',
        driverPhone: '+91-9876543215',
        capacity: 50,
        currentLocation: { latitude: 16.2600, longitude: 80.6300 },
        destination: universityLocation,
        currentSpeed: 40,
        isActive: true
      },
      // From Mangalagiri
      {
        busNumber: 'VU-MG-401',
        route: 'D1',
        area: 'Mangalagiri',
        fromCity: 'Mangalagiri',
        toCity: 'Vignan University',
        driverName: 'Srinivas Rao',
        driverPhone: '+91-9876543216',
        capacity: 48,
        currentLocation: { latitude: 16.4305, longitude: 80.5527 },
        destination: universityLocation,
        currentSpeed: 36,
        isActive: true
      },
      // From Chilakaluripet
      {
        busNumber: 'VU-CL-501',
        route: 'E1',
        area: 'Chilakaluripet',
        fromCity: 'Chilakaluripet',
        toCity: 'Vignan University',
        driverName: 'Nagarjuna Reddy',
        driverPhone: '+91-9876543217',
        capacity: 50,
        currentLocation: { latitude: 16.0892, longitude: 80.1672 },
        destination: universityLocation,
        currentSpeed: 44,
        isActive: true
      },
      // From Bapatla
      {
        busNumber: 'VU-BP-601',
        route: 'F1',
        area: 'Bapatla',
        fromCity: 'Bapatla',
        toCity: 'Vignan University',
        driverName: 'Mahesh Kumar',
        driverPhone: '+91-9876543218',
        capacity: 45,
        currentLocation: { latitude: 15.9041, longitude: 80.4673 },
        destination: universityLocation,
        currentSpeed: 39,
        isActive: true
      },
      // From Sattenapalle
      {
        busNumber: 'VU-ST-701',
        route: 'G1',
        area: 'Sattenapalle',
        fromCity: 'Sattenapalle',
        toCity: 'Vignan University',
        driverName: 'Ravi Teja',
        driverPhone: '+91-9876543219',
        capacity: 48,
        currentLocation: { latitude: 16.3950, longitude: 80.1488 },
        destination: universityLocation,
        currentSpeed: 41,
        isActive: true
      }
    ];

    await Bus.insertMany(buses);

    res.json({ 
      message: 'Database seeded successfully',
      busesCount: buses.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// 🚀 One-time route to create an admin user manually (browser-friendly)
// 🚀 One-time route to create an admin user manually (browser-friendly)
app.get('/api/seed-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@vignan.ac.in' });
    if (existingAdmin) {
      return res.json({ message: '✅ Admin already exists', email: existingAdmin.email });
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const admin = new User({
      name: 'Transport Admin',
      email: 'admin@vignan.ac.in',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    res.json({
      message: '✅ Admin created successfully',
      email: admin.email,
      password: 'Admin@123'
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Error creating admin', error: error.message });
  }
});

// ✅ NEW ADMIN MANAGEMENT ENDPOINTS (Added safely without removing your code)

// Get all users (admin only)
app.get("/api/users", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
});

// Assign a student to a specific route (optional)
app.put("/api/users/:id/assign-route", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { routeName } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { assignedRoute: routeName }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Assigned route updated", user });
  } catch (err) {
    res.status(500).json({ message: "Error assigning route", error: err.message });
  }
});

// ✅ Add a new route
app.post("/api/routes/add", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { routeName, area, stops } = req.body;
    if (!routeName || !area) {
      return res.status(400).json({ message: "Route name and area are required" });
    }

    const existing = await Route.findOne({ routeName });
    if (existing) {
      return res.status(400).json({ message: "Route already exists" });
    }

    const newRoute = new Route({ routeName, area, stops });
    await newRoute.save();
    res.status(201).json({ message: "New route added successfully", route: newRoute });
  } catch (err) {
    res.status(500).json({ message: "Error adding route", error: err.message });
  }
});

// ✅ Update an existing route
app.put("/api/routes/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { routeName, area, stops } = req.body;
    const route = await Route.findByIdAndUpdate(req.params.id, { routeName, area, stops }, { new: true });
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json({ message: "Route updated", route });
  } catch (err) {
    res.status(500).json({ message: "Error updating route", error: err.message });
  }
});

// ✅ Delete a route
app.delete("/api/routes/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json({ message: "Route deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting route", error: err.message });
  }
});

// ✅ Assign driver to a bus
app.put("/api/buses/:busNumber/assign-driver", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { driverName, driverPhone } = req.body;
    const bus = await Bus.findOneAndUpdate(
      { busNumber: req.params.busNumber },
      { driverName, driverPhone },
      { new: true }
    );

    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json({ message: "Driver assigned successfully", bus });
  } catch (err) {
    res.status(500).json({ message: "Error assigning driver", error: err.message });
  }
});

// ✅ Generate route-wise report (total buses + students)
app.get("/api/routes/report/:routeName", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { routeName } = req.params;

    const buses = await Bus.find({ route: routeName });
    const studentCount = await User.countDocuments({ role: "student", assignedRoute: routeName });

    res.json({
      routeName,
      totalBuses: buses.length,
      totalStudents: studentCount,
      buses
    });
  } catch (err) {
    res.status(500).json({ message: "Error generating report", error: err.message });
  }
});




// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



