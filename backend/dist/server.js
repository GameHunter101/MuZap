"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spotifyTokenPromise = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const errorMiddleware_1 = __importDefault(require("./middleware/errorMiddleware"));
const db_1 = require("./config/db");
const axios_1 = __importDefault(require("axios"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
(0, db_1.connectDB)();
async function genToken() {
    const authParameters = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data: `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`,
        url: "https://accounts.spotify.com/api/token"
    };
    const spotifyToken = (await (await (0, axios_1.default)(authParameters)).data).access_token;
    return spotifyToken;
    // console.log(spotifyToken);
}
exports.spotifyTokenPromise = genToken();
const port = process.env.PORT || 3000;
const app = (0, express_1.default)();
const rootDir = __dirname.split("/").filter((e, i) => i !== __dirname.split("/").length - 1).join("/");
const options = {
    key: fs_1.default.readFileSync(process.env.SSL_KEY),
    cert: fs_1.default.readFileSync(process.env.SSL_CERT)
};
// const upload = multer({dest: "playlists/"});
app.use((0, compression_1.default)());
app.use((0, helmet_1.default)());
// app.use(upload.array("thumbnail"));
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((0, cors_1.default)({
    credentials: true,
    methods: "GET,PUT,POST,DELETE",
}));
app.use("/api/playlist", require("./routes/playlistRoutes"));
app.use("/api/song", require("./routes/songRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use(errorMiddleware_1.default);
// spdy.createServer(options, app).listen(port, () => console.log("Server started"));
app.listen(port, () => console.log("Server started"));
