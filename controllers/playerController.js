const service = require("../services/playerService");

const getPlayers = async (req, res) => {
    try {
        const players = await service.getPlayers();
        res.json(players);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getPlayer = async (req, res) => {
    try {
        const player = await service.getPlayer(req.params.id);

        if (!player) {
            return res.status(404).json({
                message: "Player not found"
            });
        }

        res.json(player);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

const createPlayer = async (req, res) => {
    try {
        const player = await service.addPlayer(req.body);

        res.status(201).json(player);

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
};

const updatePlayer = async (req, res) => {
    try {
        const player = await service.editPlayer(
            req.params.id,
            req.body
        );

        res.json(player);

    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
};

const deletePlayer = async (req, res) => {
    try {
        await service.removePlayer(req.params.id);

        res.json({
            message: "Player deleted"
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

module.exports = {
    getPlayers,
    getPlayer,
    createPlayer,
    updatePlayer,
    deletePlayer
};