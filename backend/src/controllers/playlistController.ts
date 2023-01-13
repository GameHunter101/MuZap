import { Request, Response } from "express";
import fs from "fs/promises";
import * as fsSync from "fs";
import asyncHandler from "express-async-handler";
import Playlist from "../models/playlistModel";
import User from "../models/userModel";
import axios from "axios";
import SpotifyWebApi from "spotify-web-api-node";
import { spotifyTokenPromise } from "../server";
import qs from "qs";
import { playlistAuth } from "../types/playlistAuth";
import voronoi from "../extras/voronoi";
import mongoose from "mongoose";
import { PlaylistInterface } from "../models/playlistModel";
import * as ytdl from "ytdl-core";
import https from "https";
import * as yt from "youtube-search-without-api-key";
import {Client} from "youtubei";
import youtubedl from "youtube-dl-exec";

interface PlaylistElement {
	song: string,
	url: string,
	thumbnail: string,
	searchTerm: string
}

interface PlaylistDbElement {
	user: string[],
	name: string,
	public: boolean,
	likes: number,
	_id: string,
	createdAt: string,
	updatedAt: string,
	__v: number,
}

const thumbnailUrl = (playlistId: string) => {
	return new Promise<string>(async (resolve, reject) => {
		const allThumbnails = await fs.readdir(process.env.THUMBNAIL_IMAGE_DIR as string);
		allThumbnails.map(e => {
			if (e.includes(playlistId)) {
				// console.log(e.split(process.env.THUMBNAIL_IMAGE_DIR as string));
				resolve("/api/playlist/thumbnail/" + e.split(process.env.THUMBNAIL_IMAGE_DIR as string)[0]);
			}
		})
		// const file = (await fs.readdir(process.env.THUMBNAIL_IMAGE_DIR as string)).map(e => { if (e.includes(playlistId)) return e }).filter(e => e !== undefined)[0] as string;
		// const contents = await fs.readFile(process.env.THUMBNAIL_IMAGE_DIR + "/" + file);
		// const b64 = contents.toString("base64");
		// resolve(`data:${mime.contentType(path.extname(file))};base64,${b64}`);
	})
};

const httpsAgent = new https.Agent({
	key:fsSync.readFileSync(process.env.SSL_KEY as string),
	cert:fsSync.readFileSync(process.env.SSL_CERT as string)
})

const youtube = new Client();

// @desc	Get user playlists
// @route	GET /api/playlist
// @access	Private
const playlistGetUser = asyncHandler(async (req: any, res: Response) => {
	const allPlaylists = await Playlist.find();
	const ownedPlaylists: (PlaylistDbElement & { thumbnail: string })[] = []
	Promise.all(allPlaylists.map(async playlist => {
		if (playlist.users.includes(req.user.id)) {
			const usefulData: PlaylistDbElement = JSON.parse(JSON.stringify(playlist));
			// const thumbnail = { thumbnail: JSON.parse(await fs.readFile(process.env.THUMBNAIL_DIR as string, { encoding: "utf-8" }))[playlist._id].url };
			ownedPlaylists.push(Object.assign(usefulData, { thumbnail: await thumbnailUrl(playlist._id) }));
		}
	})).then(() => {
		// console.log(ownedPlaylists);
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
		users: [req.user.id]
	});

	const random = Math.floor(Math.random() * 30);
	const thumbnail = await voronoi(process.env.THUMBNAIL_DIR as string, playlist._id, Math.max(3, Math.floor(Math.random() * 10)), 1024, (random > 10) ? random : undefined);
	const usefulData: PlaylistDbElement = JSON.parse(JSON.stringify(playlist));

	fs.appendFile(`${process.env.PLAYLIST_DIR}${playlist.id}.json`, JSON.stringify({})).then(() => {
		res.status(200).json(Object.assign(usefulData, { thumbnail }));
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
	console.log(req.params.id);
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
	if (!(playlist.users.includes(user.id))) {
		res.status(401);
		throw new Error("User not authorized");
	}

	const rawPlaylistData = await fs.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" })

	const playlistData: { [song: string]: PlaylistElement } = JSON.parse(rawPlaylistData);

	const test: string[] = []

	Object.keys(playlistData).map(async (song, i) => {
		test.push(playlistData[song].searchTerm);
		/* await axios.get<PlaylistElement>(`http://129.213.46.224:3000/api/song/${encodeURIComponent(playlistData[song].searchTerm)}`).then((response) => {
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
		}); */
	});
	res.status(200).json(test);

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
	if (!(playlist.users.includes(user.id))) {
		res.status(401);
		throw new Error("User not authorized");
	}
	const playlistUsers = playlist.users;
	await Playlist.findByIdAndUpdate(req.params.playlist, { users: playlistUsers.filter(e => e !== req.user.id) }, { new: true }).then(async updatedPlaylist => {
		if (updatedPlaylist?.users.length === 0) {
			const deleteEntry = async () => {
				await playlist.remove();
				(await fs.readdir(process.env.THUMBNAIL_IMAGE_DIR as string)).map(e => {
					if (e.includes(req.params.playlist)) {
						fs.unlink(process.env.THUMBNAIL_IMAGE_DIR + "/" + e);
					}
				});
				/* const thumbnails: { [id: string]: { url: string } } = JSON.parse(await fs.readFile(process.env.THUMBNAIL_DIR as string, { encoding: "utf-8" }));
				delete thumbnails[req.params.playlist];
				fs.writeFile(process.env.THUMBNAIL_DIR as string, JSON.stringify(thumbnails)).then(() => {
					res.status(200).json({ id: playlist.id });
				}); */
			}
			await fs.unlink(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`);
			deleteEntry();
		}
		res.status(200).json({ id: playlist.id });
	});
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
	if (!(playlist.users.includes(user.id))) {
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
	if (!(playlist.users.includes(user.id))) {
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
	for (let i = 0; i < songs.length; i++) {
		const song = songs[i]
		// const next = songs[i+1]
		// return rawData;
		
		const fullSongName = `${song[0]} ${artists[i]}`;
		let rawData: string[] = [song[0], "", song[1], ""];
		// const rawData = (await axios.get<PlaylistElement>(`http://129.213.46.224:3000/api/song/${encodeURIComponent(fullSongName)}`)).data
		// const rawData = await getUrl(fullSongName, accessToken, song[1]);
		// const id = (await youtube.findOne(fullSongName,{type:"video",sortBy:"relevance"}))?.id || "BROKEN";
		try {
			const id = (await yt.search(fullSongName))[0].id.videoId;
			rawData[3] = id;
			if (!fsSync.existsSync(`${process.env.SONGS_DIR}${id}.webm`)) {
				axios.get<PlaylistElement>(`https://129.213.46.224:3000/api/song/download/${id}`,{httpsAgent});
			} else {
				console.log(fullSongName, " already exists");
			}
			// await youtubedl("https://www.youtube.com/watch?v="+id,{keepVideo:false, output:`/home/ubuntu/MuZap/backend/playlists/songs/${id}.webm`}).then(()=>console.log(fullSongName));
			console.log(fullSongName);
			rawData[1] = `/api/song/retrieve/${id}.webm`;
			// const url = format.url;
		} catch (error) {
			// brokenSongs.push([fullSongName]);
			rawData[1] = "BROKEN";
			rawData[3] = "BROKEN";
		}
		fullSongData[i] = rawData;
		// await getData(next,i+1);
	}
	
		const playlistData: { [song: string]: PlaylistElement } = {};
	
		fullSongData.map(song => playlistData[song[0]] = { song: song[0], url: song[1], thumbnail: song[2], searchTerm: song[3] });
	
		const playlist = await Playlist.create({
			name: decodeURIComponent(rawPlaylistData.name),
			users: [req.user.id],
		});
	
		const random = Math.floor(Math.random() * 30);
		const thumbnail = await voronoi(process.env.THUMBNAIL_DIR as string, playlist._id, Math.max(3, Math.floor(Math.random() * 10)), 1024, (random > 10) ? random : undefined);
		const usefulData: PlaylistDbElement = JSON.parse(JSON.stringify(playlist));
	
		fs.appendFile(`${process.env.PLAYLIST_DIR}${playlist.id}.json`, JSON.stringify(playlistData)).then(() => {
			res.status(200).json(Object.assign(usefulData, { thumbnail }));
			// res.status(200).json({ playlistName: rawPlaylistData.name, playlistId: playlist.id, playlistData: playlistData, brokenSongs: brokenSongs });
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

	const playlist = await Playlist.findById(req.params.playlist);
	// console.log(playlist)

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
	if (!(playlist.users.includes(user.id)) && playlist.public === false) {
		res.status(401);
		throw new Error("User not authorized");
	}

	const rawPlaylistData = await fs.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });
	const playlistData: { [song: string]: PlaylistElement } = JSON.parse(rawPlaylistData);

	// const thumbnail = JSON.parse(await fs.readFile(process.env.THUMBNAIL_DIR as string, { encoding: "utf-8" }))[playlist._id].url;
	const usefulData: PlaylistDbElement = JSON.parse(JSON.stringify(playlist));
	res.status(200).json({
		playlistInfo: Object.assign(usefulData, { thumbnail: await thumbnailUrl(playlist._id) }),
		playlistContents: playlistData
	});
});

// @desc	Get playlist contributers
// @route	POST /api/playlist/convert/users
// @access	Private
const playlistUsers = asyncHandler(async (req: Request, res: Response<any, Record<string, any>>) => {
	const { users } = req.body as { users: string };
	Promise.all(
		JSON.parse(users).map(async (user: string) => {
			const userFound = await User.findOne({ _id: user });
			return userFound?.name;
		})
	).then((e) => {
		res.status(200).json(e);
	})
})

// @desc Update playlist meta data
// @route POST /api/playlist/modify/:playlist
// @access Private
const playlistUpdate = asyncHandler(async (req: any, res: Response) => {
	if (!req.params.playlist) {
		res.status(400);
		throw new Error("Please specify which playlist you want to update");
	}

	const playlist = await Playlist.findById(req.params.playlist);
	// console.log(playlist)

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
	if (!(playlist.users.includes(user.id)) && playlist.public === false) {
		res.status(401);
		throw new Error("User not authorized");
	}
	let publicStatus = playlist.public;
	const playlistUsers = playlist.users;
	if (req.body.data) {
		publicStatus = !publicStatus;
	}
	if (req.body.newUser) {
		if (!playlistUsers.includes(req.body.newUser)) {
			playlistUsers.push(req.body.newUser);
		}
	}

	await Playlist.findByIdAndUpdate(req.params.playlist, Object.assign(req.body, { public: publicStatus }, { users: playlistUsers }), { new: true }).then(async (updatedPlaylist) => {
		const usefulData = JSON.parse(JSON.stringify(updatedPlaylist));
		res.status(200).json({
			playlistInfo: Object.assign(usefulData, { thumbnail: await thumbnailUrl(req.params.playlist) })
		});
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
	playlistUsers,
	playlistUpdate,
	PlaylistElement
}