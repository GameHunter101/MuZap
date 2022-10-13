import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import errorHandler from "./middleware/errorMiddleware";
import {connectDB} from "./config/db";
import path from "path";
import compression from "compression";
import helmet from "helmet";

dotenv.config();

connectDB();

async function genToken(): Promise<string> {
	const authParameters = {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`
	};
	const spotifyToken = (await (await fetch("https://accounts.spotify.com/api/token", authParameters)).json() as { access_token: string }).access_token;
	// console.log(spotifyToken);
	return spotifyToken;
}

export const spotifyTokenPromise = genToken();

const port = process.env.PORT || 3000
const app = express();

app.use(compression());
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors({
	credentials:true,
	methods: "GET,PUT,POST,DELETE",
}))

app.use("/api/playlist",require("./routes/playlistRoutes"));
app.use("/api/song", require("./routes/songRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

app.use(errorHandler)

app.listen(port, ()=> console.log("Server started"));