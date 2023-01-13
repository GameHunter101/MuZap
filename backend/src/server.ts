import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import errorHandler from "./middleware/errorMiddleware";
import { connectDB } from "./config/db";
import axios from "axios";
import compression from "compression";
import helmet from "helmet";
import multer from "multer";
import fs from "fs";
import spdy from "spdy";
import path from "path";
import cron from "node-cron";

dotenv.config();

connectDB();

async function genToken(): Promise<string> {
	const authParameters = {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		data: `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`,
		url: "https://accounts.spotify.com/api/token"
	};
	const spotifyToken = (await (await axios(authParameters)).data as { access_token: string }).access_token;
	return spotifyToken;
	// console.log(spotifyToken);
}
export let spotifyTokenPromise = genToken();

cron.schedule("*/5 * * * *",()=>{
	spotifyTokenPromise = genToken();
})

const port = process.env.PORT || 3000
const app = express();

app.use(cors());

const rootDir = __dirname.split("/").filter((e, i) => i !== __dirname.split("/").length - 1).join("/");

const options = {
	key: fs.readFileSync(process.env.SSL_KEY as string),
	cert: fs.readFileSync(process.env.SSL_CERT as string)
}

// const upload = multer({dest: "playlists/"});

app.use(compression());
app.use(helmet({crossOriginResourcePolicy:false}));

// app.use(upload.array("thumbnail"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/playlist", require("./routes/playlistRoutes"));
app.use("/api/song", require("./routes/songRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

app.use(errorHandler)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

spdy.createServer(options, app).listen(port, () => console.log("Server started"));

// app.listen(port, () => console.log("Server started"));