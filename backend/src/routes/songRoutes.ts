import express, { NextFunction } from "express";
import * as songController from "../controllers/songController";
import ytdl from "ytdl-core";
import youtubedl from "youtube-dl-exec";
import { Client } from "youtubei";
import fs from "fs";

const router = express.Router();

router.get("/:name", songController.songSearch);
router.use("/retrieve/", express.static(process.env.SONGS_DIR as string));
router.use("/download/:id",async (req,res)=>{
	const id = req.params.id;
	const vidInfo = await ytdl.getInfo(id);
	const format = vidInfo.formats.map(e => {
		if (e.audioQuality === "AUDIO_QUALITY_MEDIUM" && e.audioSampleRate === "48000")
			return e;
	}).filter(e => e !== undefined)[0] as ytdl.videoFormat;
	const out = fs.createWriteStream(`${process.env.SONGS_DIR}${id}.webm`);
	ytdl.downloadFromInfo(vidInfo, { format }).pipe(out);
	res.status(200).json({url:`/api/song/retrieve/${id}.webm`,id});
});

router.get("/search/:query", songController.ytSearch);

module.exports = router;