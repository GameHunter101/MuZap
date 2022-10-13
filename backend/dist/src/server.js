"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
dotenv_1.default.config();
(0, db_1.connectDB)();
function genToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const authParameters = {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`
        };
        const spotifyToken = (yield (yield fetch("https://accounts.spotify.com/api/token", authParameters)).json()).access_token;
        // console.log(spotifyToken);
        return spotifyToken;
    });
}
exports.spotifyTokenPromise = genToken();
const port = process.env.PORT || 3000;
const app = (0, express_1.default)();
app.use((0, compression_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)({
    credentials: true,
    methods: "GET,PUT,POST,DELETE",
}));
app.use("/api/playlist", require("./routes/playlistRoutes"));
app.use("/api/song", require("./routes/songRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
/* // Serve frontend
if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/build")));

    app.get("*",(req,res)=>res.sendFile(path.resolve(__dirname,"../","frontend","build","index.html")));
} else {
    app.get("/", (req,res)=>{res.send("Please set to production")});
} */
app.use(errorMiddleware_1.default);
app.listen(port, () => console.log("Server started"));
