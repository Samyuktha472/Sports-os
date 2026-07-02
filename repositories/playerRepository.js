const Player = require("../models/playerModel");

const getAllPlayers = async () => {
    return await Player.find();
};

const getPlayerById = async (id) => {
    return await Player.findById(id);
};


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