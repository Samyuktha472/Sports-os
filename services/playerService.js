const repository = require("../repositories/playerRepository");

const getPlayers = async () => {
    return await repository.getAllPlayers();
};

const getPlayer = async (id) => {
    return await repository.getPlayerById(id);
};

const addPlayer = async (playerData) => {

    if (!playerData.name) {
        throw new Error("Player name is required");
    }

    if (!playerData.age) {
        throw new Error("Player age is required");
    }

    return await repository.createPlayer(playerData);
};

const editPlayer = async (id, playerData) => {
    return await repository.updatePlayer(id, playerData);
};

const removePlayer = async (id) => {
    return await repository.deletePlayer(id);
};

module.exports = {
    getPlayers,
    getPlayer,
    addPlayer,
    editPlayer,
    removePlayer
};