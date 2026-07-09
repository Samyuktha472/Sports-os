<<<<<<< HEAD
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    createMatch,
    getUpcomingMatch,
    getAllMatches,
} = require('../controllers/matchController');

const router = express.Router();

router.get('/upcoming', protect, getUpcomingMatch);
router.get('/', protect, getAllMatches);
router.post('/', protect, createMatch);
=======
const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    createMatch,
    getMatches,
    deleteMatch
} = require("../controllers/matchController");

router.get("/", protect, getMatches);

router.post("/", protect, createMatch);

router.delete("/:id", protect, deleteMatch);
>>>>>>> fdadcdb (Add match management backend)

module.exports = router;