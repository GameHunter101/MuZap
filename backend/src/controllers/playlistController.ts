import { Request, Response } from "express";
import fs from "fs/promises";
import asyncHandler from "express-async-handler";
import Playlist from "../models/playlistModel";
import User from "../models/userModel";
import axios from "axios";
import SpotifyWebApi from "spotify-web-api-node";
import { spotifyTokenPromise } from "../server"
import qs from "qs";
import { playlistAuth } from "../types/playlistAuth";
import voronoi from "../extras/voronoi";
import mongoose from "mongoose";
import {PlaylistInterface} from "../models/playlistModel"

interface PlaylistElement {
	song: string,
	url: string,
	thumbnail: string,
	searchTerm: string
}

// @desc	Get user playlists
// @route	GET /api/playlist
// @access	Private
const playlistGetUser = asyncHandler(async (req: any, res: Response) => {
	const allPlaylists = await Playlist.find();
	const ownedPlaylists: {data:(PlaylistInterface & {_id: mongoose.Types.ObjectId;}),thumbnail:string}[] = []
	Promise.all(allPlaylists.map(async playlist => {
		if (playlist.user.includes(req.user.id)) {
			const thumbnail:string = JSON.parse(await fs.readFile(process.env.THUMBNAIL_DIR as string,{encoding:"utf-8"}))[playlist._id].url;
			ownedPlaylists.push({data:playlist,thumbnail});
		}
	})).then(()=>{
		res.status(200).json(ownedPlaylists);
	})
})

// @desc	Create playlist
// @route	POST /api/playlist/:playlist
// @access	Private
const playlistCreate = asyncHandler(async (req: any, res: Response) => {
	if (!req.params.playlist) {
		res.status(400);
		throw new Error("Please specify the name of the playlist you want to create");
	}
	console.log("CREATING PLAYLIST " + req.params.playlist);

	const playlist = await Playlist.create({
		name: decodeURIComponent(req.params.playlist),
		user: [req.user.id]
	})

	const random = Math.floor(Math.random()*30);
	const thumbnailUrl = await voronoi(process.env.THUMBNAIL_DIR as string,playlist._id, Math.min(Math.floor(Math.random() * 10), 4), 1024, (random > 10) ? random : undefined);

	fs.appendFile(`${process.env.PLAYLIST_DIR}${playlist.id}.json`, JSON.stringify({})).then(() => {
		res.status(200).json({ ...playlist, thumbnailUrl });
	});
})

// @desc	Refresh playlist
// @route	PUT /api/playlist/:playlist
// @access	Private
const playlistRefresh = asyncHandler(async (req: any, res: Response) => {

	if (!req.params.playlist) {
		res.status(400);
		throw new Error("Please specify which playlist you want to retrieve");
	}

	const playlist = await Playlist.findById(req.params.id);

	if (!playlist) {
		res.status(400);
		throw new Error("Playlist not found");
	}

	const user = await User.findById(req.user.id);

	// Check for user
	if (!user) {
		res.status(401);
		throw new Error("User not found");
	}

	// Make sure the logged in user matchs the playlist user
	if (!(playlist.user.includes(user.id))) {
		res.status(401);
		throw new Error("User not authorized");
	}

	const rawPlaylistData = await fs.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" })

	const playlistData: { [song: string]: PlaylistElement } = JSON.parse(rawPlaylistData);



	Object.keys(playlistData).map(async (song, i) => {
		await axios.get<PlaylistElement>(`http://141.148.84.127:3000/api/song/${encodeURIComponent(playlistData[song].searchTerm)}`).then((response) => {
			playlistData[song].url = response.data.url;
			console.log(playlistData[song].url);
			if (i === Object.keys.length - 1) {
				// console.log("done");
				fs.writeFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, JSON.stringify(playlistData)).then(() => {
					res.status(200).json(playlistData);
				});
			}
		}).catch((error) => {
			res.status(400);
			console.log(error);
			throw new Error("Song unsuccesfully converted");
		});
	});


})

// @desc	Delete playlist
// @route	DELETE /api/playlist/:playlist
// @access	Private
const playlistDelete = asyncHandler(async (req: any, res: Response<any, Record<string, any>>) => {

	if (!req.params.playlist) {
		res.status(400);
		throw new Error("Please specify which playlist you want to retrieve");
	}

	const playlist = await Playlist.findById(req.params.playlist);

	if (!playlist) {
		res.status(400);
		throw new Error("Playlist not found");
	}

	const user = await User.findById(req.user.id);

	// Check for user
	if (!user) {
		res.status(401);
		throw new Error("User not found");
	}

	// Make sure the logged in user matchs the playlist user
	if (!(playlist.user.includes(user.id))) {
		res.status(401);
		throw new Error("User not authorized");
	}

	fs.unlink(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`).then(async () => {
		await playlist.remove();
		res.status(200).json({ id: playlist.id });
	})
})

// @desc	Add to playlist
// @route	POST /api/playlist/modify/:playlist
// @access	Private
const playlistAdd = asyncHandler(async (req: any, res: Response<any, Record<string, any>>) => {

	const songName = req.body.song;
	const songUrl = req.body.url;
	const thumbnail = req.body.thumbnail;
	const searchTerm = req.body.searchTerm;

	if (!req.params.playlist) {
		res.status(400);
		throw new Error("Please specify which playlist you want to retrieve");
	}

	if (songName === undefined || songUrl === undefined || thumbnail === undefined || searchTerm == undefined) {
		res.status(400);
		throw new Error("Please specify all of the parameters of the song");
	}

	const playlist = await Playlist.findById(req.params.playlist);

	if (!playlist) {
		res.status(400);
		throw new Error("Playlist not found");
	}

	const user = await User.findById(req.user.id);

	// Check for user
	if (!user) {
		res.status(401);
		throw new Error("User not found");
	}
	// Make sure the logged in user matchs the playlist user
	if (!(playlist.user.includes(user.id))) {
		res.status(401);
		throw new Error("User not authorized");
	}

	const rawPlaylist = await fs.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });

	const playlistJson: { [song: string]: PlaylistElement } = JSON.parse(rawPlaylist);

	playlistJson[songName] = { song: songName, url: songUrl, thumbnail: thumbnail, searchTerm: searchTerm }
	fs.writeFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, JSON.stringify(playlistJson)).then(() => {
		res.status(200).json(playlistJson);
	});
})

// @desc	Remove from playlist
// @route	DELETE /api/playlist/modify/:playlist
// @access	Private
const playlistRemove = asyncHandler(async (req: any, res: Response<any, Record<string, any>>) => {

	const songName = req.body.song;

	if (!req.params.playlist) {
		res.status(400);
		throw new Error("Please specify which playlist you want to retrieve");
	}

	if (songName === undefined) {
		res.status(400);
		throw new Error("Please specify which song you want to remove");
	}

	const playlist = await Playlist.findById(req.params.playlist);

	if (!playlist) {
		res.status(400);
		throw new Error("Playlist not found");
	}

	const user = await User.findById(req.user.id);

	// Check for user
	if (!user) {
		res.status(401);
		throw new Error("User not found");
	}

	// Make sure the logged in user matchs the playlist user
	if (!(playlist.user.includes(user.id))) {
		res.status(401);
		throw new Error("User not authorized");
	}

	const rawPlaylist = await fs.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });

	const Json: { [song: string]: PlaylistElement } = JSON.parse(rawPlaylist);

	delete Json[songName];
	fs.writeFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, JSON.stringify(Json)).then(() => {
		res.status(200).json(Json);
	});
})

// @desc	Convert Spotify playlist
// @route	POST /api/playlist/convert/:spotifyUrl
// @access	Private
const playlistConvert = asyncHandler(async (req: any, res: Response<any, Record<string, any>>) => {

	if (!req.params.spotifyUrl) {
		res.status(400);
		throw new Error("Please specify the Spotify playlist you want to convert");
	}

	const spotifyId = decodeURIComponent(req.params.spotifyUrl.split("https://open.spotify.com/playlist/")[1].split("?")[0]);
	const spotifyApi = new SpotifyWebApi({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET, accessToken: await spotifyTokenPromise });
	const rawPlaylistData = (await spotifyApi.getPlaylist(spotifyId)).body;
	// const playlistName = rawPlaylistData.name;
	const songs: string[][] = [];
	const artists: string[] = [];
	const fullSongData: string[][] = [];
	const brokenSongs: string[][] = [];
	for (let i = 0; i < Math.ceil(rawPlaylistData.tracks.total / 100); i++) {
		const rawItemsData = (await spotifyApi.getPlaylistTracks(spotifyId, { offset: 100 * i, fields: "items" })).body;
		rawItemsData.items.map(e => {
			if (e.track) {
				artists.push(e.track.artists.map(f => { return f.name; }).join(" "));
				songs.push([e.track.name, e.track.album.images[0].url]);
			}
		});
	}

	Promise.all(
		songs.map(async (song, i) => {
			const fullSongName = `${song[0]} ${artists[i]}`;
			const rawData = (await axios.get<PlaylistElement>(`http://141.148.84.127:3000/api/song/${encodeURIComponent(fullSongName)}`)).data
			// const rawData = await getUrl(fullSongName, accessToken, song[1]);
			if (rawData.url === undefined) {
				brokenSongs.push([fullSongName]);
			}
			fullSongData[i] = ([song[0], rawData.url, song[1], fullSongName, "" + i]);
		})
	).then(async () => {

		const playlistData: { [song: string]: PlaylistElement } = {};

		fullSongData.map(song => playlistData[song[0]] = { song: song[0], url: song[1], thumbnail: song[2], searchTerm: song[3] });

		const playlist = await Playlist.create({
			name: decodeURIComponent(rawPlaylistData.name),
			user: req.user.id
		})

		fs.appendFile(`${process.env.PLAYLIST_DIR}${playlist.id}.json`, JSON.stringify(playlistData)).then(() => {
			res.status(200).json({ playlistName: rawPlaylistData.name, playlistId: playlist.id, playlistData: playlistData, brokenSongs: brokenSongs });
		})
	});
});

// @desc	Get specific playlist
// @route	GET /api/playlist/modify/:playlist
// @access	Private
const playlistGet = asyncHandler(async (req: any, res: Response<any, Record<string, any>>) => {

	if (!req.params.playlist) {
		res.status(400);
		throw new Error("Please specify which playlist you want to retrieve");
	}

	const playlist = await Playlist.findById(req.params.playlist)

	if (!playlist) {
		res.status(400);
		throw new Error("Playlist not found");
	}

	const user = await User.findById(req.user.id);

	// Check for user
	if (!user) {
		res.status(401);
		throw new Error("User not found");
	}

	// Make sure the logged in user matchs the playlist user
	if (!(playlist.user.includes(user.id))) {
		res.status(401);
		throw new Error("User not authorized");
	}

	const rawPlaylistData = await fs.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });

	const playlistData: { [song: string]: PlaylistElement } = JSON.parse(rawPlaylistData);

	res.status(200).json({
		playlistInfo: playlist,
		playlistContents: playlistData
	});
});


export {
	playlistGet,
	playlistCreate,
	playlistRefresh,
	playlistDelete,
	playlistAdd,
	playlistRemove,
	playlistConvert,
	playlistGetUser,
	PlaylistElement
}