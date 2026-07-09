const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
    createMatch,
    getUpcomingMatch,
    getAllMatches,
    deleteMatch
} = require("../controllers/matchController");

const router = express.Router();

// Upcoming match
router.get("/upcoming", protect, getUpcomingMatch);

// Get all matches
router.get("/", protect, getAllMatches);

// Create match
router.post("/", protect, createMatch);

// Delete match
router.delete("/:id", protect, deleteMatch);

module.exports = router;