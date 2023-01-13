import express from "express";
import * as playlistController from "../controllers/playlistController";
import protect from "../middleware/authMiddleware";
import multer from "multer";
import fs from "fs/promises";

const router = express.Router();
const storage = multer.diskStorage({
	destination: (req, file, callback) => {
		callback(null, process.env.THUMBNAIL_IMAGE_DIR as string);
	},
	filename: async (req, file, callback) => {
		const id = req.originalUrl.split("meta/")[1];
		try {
			const samePlaylist = (await fs.readdir(process.env.THUMBNAIL_IMAGE_DIR as string)).map(e => { if (e.includes(id)) return e }).filter(e => e !== undefined);
			if (samePlaylist[0]) {
				fs.unlink(process.env.THUMBNAIL_IMAGE_DIR + "/"+samePlaylist[0]);
			}
		} catch (error) {
			fs.mkdir(process.env.THUMBNAIL_IMAGE_DIR as string);
		}
		callback(null, `${id}.${file.originalname.split(".")[1]}`);
	}
});
const upload = multer({ storage: storage });

router.route("/:playlist")
	.put(protect.protect, playlistController.playlistRefresh)
	.delete(protect.protect, playlistController.playlistDelete)
	.post(protect.protect, playlistController.playlistCreate);

router.get("/", protect.protect, playlistController.playlistGetUser);
router.post("/convert/users", protect.protect, playlistController.playlistUsers);

router.route("/modify/:playlist")
	.get(protect.protect, playlistController.playlistGet)
	.post(protect.protect, playlistController.playlistAdd)
	.delete(protect.protect, playlistController.playlistRemove);

router.route("/modify/meta/:playlist").post(protect.protect, upload.single("file"), playlistController.playlistUpdate);

router.route("/convert/:spotifyUrl").post(protect.protect, playlistController.playlistConvert);
router.use("/thumbnail/",express.static(process.env.THUMBNAIL_IMAGE_DIR as string));
module.exports = router;