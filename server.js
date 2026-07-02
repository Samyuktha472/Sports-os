const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const playerRoutes = require("./routes/playerRoutes");

const app = express();

app.use(cors());
app.use(express.json());

console.log("Mongo URL:", process.env.MONGO_URI);

// Connect to MongoDB (ONLY ONE mongoose.connect)
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log(err);
});

app.use("/api/players", playerRoutes);

app.get("/test", (req, res) => {
    res.json({ message: "API working" });
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
