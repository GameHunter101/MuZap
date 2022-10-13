import { Request, Response } from "express";
import * as VLC from "vlc-client";
import asyncHandler from "express-async-handler";
import * as yt from "youtube-search-without-api-key";
import fs from "fs";
import * as ytdl from "ytdl-core";
import { PlaylistElement } from "./playlistController";
import SpotifyWebApi from "spotify-web-api-node";
import {spotifyTokenPromise} from "../server"


async function newThumbnail(songName: string, accessToken: string, youtubeId: string): Promise<string> {
	
	const spotifyApi = new SpotifyWebApi({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET, accessToken: accessToken });
	try {

		const url = (await spotifyApi.searchTracks(songName, { limit: 1 })).body.tracks?.items[0].album.images[0].url;
		return url as string;
	} catch (error) {
		return "https://img.youtube.com/vi/" + youtubeId + "/hqdefault.jpg";
	}
}


// @desc    Convert songs
// @route   GET /api/songs/:name
// @access  Private
const songSearch = asyncHandler(async (req: Request<{ name: string; }, any, any, qs.ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>) => {

	if (!req.params.name) {
		res.status(400);
		throw new Error("Please specify the name of the song");
	}

	const vlc = new VLC.Client({
		ip: "localhost",
		port: 8080,
		password: process.env.VLC_PASSWORD as string
	});
	await vlc.emptyPlaylist().then(async () => {

		await yt.search(decodeURIComponent(req.params.name)).then(async ytRes => {

			const songData:PlaylistElement = {
				song: "",
				url: "",
				thumbnail: "",
				searchTerm: ""
			}

			const songUrlData = (await ytdl.getInfo(ytRes[0].url)).formats.map((e, i) => {
				if (e.audioQuality === "AUDIO_QUALITY_MEDIUM" && e.audioSampleRate === "48000") {
					// console.log(e.audioSampleRate,e.audioBitrate,e.audioChannels,i);
					return e;
				}
			}).filter(e => e !== undefined)[0] as ytdl.videoFormat;
			
			const thumbnail1 = await newThumbnail(ytRes[0].title, await spotifyTokenPromise, ytRes[0].id.videoId);
			const thumbnail2 = await newThumbnail(req.params.name, await spotifyTokenPromise, ytRes[0].id.videoId);
			let finalThumbnail = "";

			if(thumbnail1.indexOf("https://img.youtube.com/vi/") === -1){
				finalThumbnail = thumbnail1;
			} else{
				if(thumbnail2.indexOf("https://img.youtube.com/vi/") === -1) {
					finalThumbnail = thumbnail2;
				} else {
					finalThumbnail = thumbnail1;
				}
			}

			songData.song =ytRes[0].title;
			songData.url = songUrlData.url;
			songData.thumbnail = finalThumbnail;
			songData.searchTerm = req.params.name;
			
			res.status(200).json(songData);

			/* const id = ytRes[0].id.videoId;
			await vlc.playFile(`https://www.youtube.com/watch?v=${id}`, { wait: true, noaudio: false, novideo: true }).then(async () => {
				const url = (await vlc.getPlaylist())[0].uri;
				
				res.status(200).json({ url: url });
			}) */
		})
	})
})

export {
	songSearch
}