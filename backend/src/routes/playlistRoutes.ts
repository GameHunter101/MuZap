import express from "express";
import * as dotenv from "dotenv";
import * as playlistController from "../controllers/playlistController";
import protect from "../middleware/authMiddleware";

const router = express.Router();

router.route("/:playlist")
	.put(protect.protect, playlistController.playlistRefresh)
	.delete(protect.protect, playlistController.playlistDelete)
	.post(protect.protect, playlistController.playlistCreate);

router.get("/", protect.protect, playlistController.playlistGetUser);

router.route("/modify/:playlist")
	.get(protect.protect, playlistController.playlistGet)
	.post(protect.protect, playlistController.playlistAdd)
	.delete(protect.protect, playlistController.playlistRemove);

router.route("/convert/:spotifyUrl").post(protect.protect, playlistController.playlistConvert);
module.exports = router;