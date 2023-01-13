"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const playlistController = __importStar(require("../controllers/playlistController"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const multer_1 = __importDefault(require("multer"));
const promises_1 = __importDefault(require("fs/promises"));
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, callback) => {
        callback(null, process.env.THUMBNAIL_IMAGE_DIR);
    },
    filename: async (req, file, callback) => {
        const id = req.originalUrl.split("meta/")[1];
        try {
            const samePlaylist = (await promises_1.default.readdir(process.env.THUMBNAIL_IMAGE_DIR)).map(e => { if (e.includes(id))
                return e; }).filter(e => e !== undefined);
            if (samePlaylist[0]) {
                promises_1.default.unlink(process.env.THUMBNAIL_IMAGE_DIR + "/" + samePlaylist[0]);
            }
        }
        catch (error) {
            promises_1.default.mkdir(process.env.THUMBNAIL_IMAGE_DIR);
        }
        callback(null, `${id}.${file.originalname.split(".")[1]}`);
    }
});
const upload = (0, multer_1.default)({ storage: storage });
router.route("/:playlist")
    .put(authMiddleware_1.default.protect, playlistController.playlistRefresh)
    .delete(authMiddleware_1.default.protect, playlistController.playlistDelete)
    .post(authMiddleware_1.default.protect, playlistController.playlistCreate);
router.get("/", authMiddleware_1.default.protect, playlistController.playlistGetUser);
router.post("/convert/users", authMiddleware_1.default.protect, playlistController.playlistUsers);
router.route("/modify/:playlist")
    .get(authMiddleware_1.default.protect, playlistController.playlistGet)
    .post(authMiddleware_1.default.protect, playlistController.playlistAdd)
    .delete(authMiddleware_1.default.protect, playlistController.playlistRemove);
router.route("/modify/meta/:playlist").post(authMiddleware_1.default.protect, upload.single("file"), playlistController.playlistUpdate);
router.route("/convert/:spotifyUrl").post(authMiddleware_1.default.protect, playlistController.playlistConvert);
module.exports = router;
