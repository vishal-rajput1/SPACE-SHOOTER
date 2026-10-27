
import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  const databaseStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbState = mongoose.connection.readyState;

  res.status(200).json({
    success: true,
    game: process.env.GAME_NAME || "SPACE SHOOTER ODYSSEY",
    server: "running",
    database: databaseStates[dbState] || "unknown",
    timestamp: new Date().toISOString(),
  });
});

export default router;
