const Player = require("../models/playerModel");

// Get all players
const getAllPlayers = async () => {
    return await Player.find();
};

// Get player by ID
const getPlayerById = async (id) => {
    return await Player.findById(id);
};

// Create player
const createPlayer = async (playerData) => {
    return await Player.create(playerData);
};

// Update player
const updatePlayer = async (id, playerData) => {
    return await Player.findByIdAndUpdate(
        id,
        playerData,
        { new: true }
    );
};

// Delete player
const deletePlayer = async (id) => {
    return await Player.findByIdAndDelete(id);
};

module.exports = {
    getAllPlayers,
    getPlayerById,
    createPlayer,
    updatePlayer,
    deletePlayer
};