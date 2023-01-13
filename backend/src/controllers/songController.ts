import express, { Request, Response } from "express";
import * as VLC from "vlc-client";
import asyncHandler from "express-async-handler";
import * as yt from "youtube-search-without-api-key";
import fsSync from "fs";
import fs from "fs/promises";
import * as ytdl from "ytdl-core";
import { PlaylistElement } from "./playlistController";
import SpotifyWebApi from "spotify-web-api-node";
import { spotifyTokenPromise } from "../server";
import youtubeDl from "youtube-mp3-downloader";
import { Client } from "youtubei";
import { exec } from "child_process";

const youtube = new Client();

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
const songSearch = asyncHandler(async (req: any, res: Response) => {
	if (!req.params.name) {
		res.status(400);
		throw new Error("Please specify the name of the song");
	}
	const spotifyToken = await spotifyTokenPromise;
	let search = decodeURIComponent(req.params.name);
	console.log(search);
	if (search.includes("open.spotify.com")) {
		const spotifyApi = new SpotifyWebApi({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET, accessToken: spotifyToken });
		const spotId = search.split("open.spotify.com/track/")[1];
		console.log(spotId);
		const track = (await spotifyApi.getTrack(spotId, { market: "ES" })).body;
		const thumbnail = track.album.images[0].url;
		let artists = "";
		track.artists.map(e => artists += " " + e.name);
		const searchTerm = track.name + " " + artists;
		const id = (await yt.search(searchTerm))[0].id.videoId;
		const vidInfo = await ytdl.getInfo(id);
		const format = vidInfo.formats.map(e => { if (e.audioQuality === "AUDIO_QUALITY_MEDIUM" && e.audioSampleRate === "48000") return e }).filter(e => e !== undefined)[0] as ytdl.videoFormat;
		const url = format.url;
		const songData: PlaylistElement = { song: track.name, url, thumbnail, searchTerm: id };
		/* const out = fs.createWriteStream(`${process.env.SONGS_DIR}${id}.${format.container}`);
		ytdl.downloadFromInfo(vidInfo,{format}).pipe(out)
		out.on("finish",()=>{
			res.status(200).json(songData);
		}); */
		res.status(200).json(songData);

	} else {
		await yt.search(search).then(async ytRes => {
			const songData: PlaylistElement = {
				song: "",
				url: "",
				thumbnail: "",
				searchTerm: ""
			}
			const info = await ytdl.getInfo(ytRes[0].url);
			const songUrlData = info.formats.map((e, i) => {
				if (e.audioQuality === "AUDIO_QUALITY_MEDIUM" && e.audioSampleRate === "48000") {
					// console.log(e.audioSampleRate,e.audioBitrate,e.audioChannels,i);
					return e;
				}
			}).filter(e => e !== undefined)[0] as ytdl.videoFormat;

			const thumbnail1 = await newThumbnail(ytRes[0].title, spotifyToken, ytRes[0].id.videoId);
			const thumbnail2 = await newThumbnail(search, spotifyToken, ytRes[0].id.videoId);
			let finalThumbnail = "";

			if (thumbnail1.indexOf("https://img.youtube.com/vi/") === -1) {
				finalThumbnail = thumbnail1;
			} else {
				if (thumbnail2.indexOf("https://img.youtube.com/vi/") === -1) {
					finalThumbnail = thumbnail2;
				} else {
					finalThumbnail = thumbnail1;
				}
			}

			/* const downloader = new youtubeDl({
				ffmpegPath: "/usr/bin/ffmpeg",
				outputPath: process.env.PLAYLIST_DIR as string,
				allowWebm: true,
				queueParallelism: 3,
				progressTimeout: 1000
			});
			
			downloader.download(ytRes[0].id.videoId);
			
			downloader.on("finished",(err,data)=>{
				console.log(data);
			}); */
			// const format = info.formats.map(e => { if (e.audioQuality === "AUDIO_QUALITY_MEDIUM" && e.audioSampleRate === "48000") return e }).filter((e: any) => e !== undefined)[0] as ytdl.videoFormat;
			// const out = fs.createWriteStream(`${process.env.PLAYLIST_DIR}${ytRes[0].id.videoId}.webm`);
			// ytdl.downloadFromInfo(info, { format }).pipe(out);
			songData.song = ytRes[0].title;
			songData.url = songUrlData.url;
			songData.thumbnail = finalThumbnail;
			songData.searchTerm = ytRes[0].id.videoId;
			res.status(200).json(songData);

		})
	}
});

const ytSearch = asyncHandler(async (req, res) => {
	if (!req.params.query) {
		res.status(400);
		throw new Error("Please specify the name of the song");
	}
	const searchQuery = decodeURIComponent(req.params.query);

	const ytRes: [[string, string], [string,string]][] = []
	const spRes: [[string, string[]], [string,string]][] = []
	try {
		// console.log(searchQuery,req.params.query,(await yt.search(searchQuery)));
		const ytSearch = await youtube.search(searchQuery, { type: "video", sortBy: "relevance" });
		ytSearch.items.map(video => {
			ytRes.push([[video.title, video.channel?.name || ""], [video.id,`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`]]);
		});

	} catch (error) {
		/* res.status(400);
		throw new Error("Something went wrong when searching YouTube!"); */
	}

	try {
		const spotifyToken = await spotifyTokenPromise;
		const spotifyApi = new SpotifyWebApi({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET, accessToken: spotifyToken });
		const sp = (await spotifyApi.searchTracks(searchQuery, { limit: 10, market: "ES" })).body.tracks;
		sp?.items.map(e => {
			spRes.push([[e.name, e.artists.map(a => { return a.name })], [e.id,e.album.images[1].url]]);
		});
	} catch (error) {
		/* res.status(400);
		throw new Error("Something went wrong when searching Spotify!"); */
	}

	/* exec(`cd ${process.env.PLAYLIST_DIR} && python -m spotdl https://open.spotify.com/track/3PDuPLArSTzKH2W2hKYjh0?si=af27f914ce38419f`,(err,stdout,stderr)=>{
		if (err) {
			console.log(`error: ${err.message}`);
		}
		if (stderr) {
			console.log(`stderr: ${stderr}`);
		}
		fs.rename(process.env.PLAYLIST_DIR+stdout.split('"')[1]+".mp3",process.env.PLAYLIST_DIR+"3PDuPLArSTzKH2W2hKYjh0.mp3");
	}); */
	res.status(200).json({ searchQuery, youtube: ytRes, spotify: spRes });
})

export {
	songSearch,
	ytSearch
}