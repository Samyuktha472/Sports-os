const express = require("express");
const router = express.Router();

const controller = require("../controllers/playerController");

// Get all players
router.get("/", controller.getPlayers);

// Get single player
router.get("/:id", controller.getPlayer);

// Create player
router.post("/", controller.createPlayer);

// Update player
router.put("/:id", controller.updatePlayer);

// Delete player
router.delete("/:id", controller.deletePlayer);

module.exports = router;