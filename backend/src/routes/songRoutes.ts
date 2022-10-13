import express from "express";
import * as songController from "../controllers/songController";

const router = express.Router();


router.get("/:name", songController.songSearch);

module.exports = router;