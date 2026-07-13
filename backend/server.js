require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");

const connectDB = require("./config/db");
const passport = require("./config/passport");

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
const session = require('express-session');
app.use(session({
    secret: process.env.JWT_SECRET || 'sports_os_secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Static Files
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.static(path.join(__dirname, "../frontend/pages")));

// Route Imports
const authRoutes = require("./routes/authRoutes");
const batchRoutes = require("./routes/batchRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const coachAttendanceRoutes = require("./routes/coachAttendanceRoutes");
const importRoutes = require("./routes/importRoute");
const rosterRoutes = require("./routes/rosterRoutes");
const inviteRoutes = require("./routes/inviteRoutes");
const matchRoutes = require("./routes/matchRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const batchChangeRequestRoutes = require("./routes/batchChangeRequestRoutes");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/coach-attendance", coachAttendanceRoutes);
app.use("/api/import", importRoutes);
app.use("/api/roster", rosterRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/batch-change-requests", batchChangeRequestRoutes);

// Default Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/register.html"));
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});