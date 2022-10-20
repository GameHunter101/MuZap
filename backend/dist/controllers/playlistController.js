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
exports.playlistGetUser = exports.playlistConvert = exports.playlistRemove = exports.playlistAdd = exports.playlistDelete = exports.playlistRefresh = exports.playlistCreate = exports.playlistGet = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const playlistModel_1 = __importDefault(require("../models/playlistModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const axios_1 = __importDefault(require("axios"));
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const server_1 = require("../server");
const voronoi_1 = __importDefault(require("../extras/voronoi"));
// @desc	Get user playlists
// @route	GET /api/playlist
// @access	Private
const playlistGetUser = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const allPlaylists = yield playlistModel_1.default.find();
    const ownedPlaylists = [];
    Promise.all(allPlaylists.map((playlist) => __awaiter(void 0, void 0, void 0, function* () {
        if (playlist.user.includes(req.user.id)) {
            const thumbnail = JSON.parse(yield promises_1.default.readFile(process.env.THUMBNAIL_DIR, { encoding: "utf-8" }))[playlist._id].url;
            ownedPlaylists.push({ data: playlist, thumbnail });
        }
    }))).then(() => {
        res.status(200).json(ownedPlaylists);
    });
}));
exports.playlistGetUser = playlistGetUser;
// @desc	Create playlist
// @route	POST /api/playlist/:playlist
// @access	Private
const playlistCreate = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify the name of the playlist you want to create");
    }
    console.log("CREATING PLAYLIST " + req.params.playlist);
    const playlist = yield playlistModel_1.default.create({
        name: decodeURIComponent(req.params.playlist),
        user: [req.user.id]
    });
    const random = Math.floor(Math.random() * 30);
    const thumbnailUrl = yield (0, voronoi_1.default)(process.env.THUMBNAIL_DIR, playlist._id, Math.min(Math.floor(Math.random() * 10), 4), 1024, (random > 10) ? random : undefined);
    promises_1.default.appendFile(`${process.env.PLAYLIST_DIR}${playlist.id}.json`, JSON.stringify({})).then(() => {
        res.status(200).json(Object.assign(Object.assign({}, playlist), { thumbnailUrl }));
    });
}));
exports.playlistCreate = playlistCreate;
// @desc	Refresh playlist
// @route	PUT /api/playlist/:playlist
// @access	Private
const playlistRefresh = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify which playlist you want to retrieve");
    }
    const playlist = yield playlistModel_1.default.findById(req.params.id);
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = yield userModel_1.default.findById(req.user.id);
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
    const rawPlaylistData = yield promises_1.default.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });
    const playlistData = JSON.parse(rawPlaylistData);
    Object.keys(playlistData).map((song, i) => __awaiter(void 0, void 0, void 0, function* () {
        yield axios_1.default.get(`http://141.148.84.127:3000/api/song/${encodeURIComponent(playlistData[song].searchTerm)}`).then((response) => {
            playlistData[song].url = response.data.url;
            console.log(playlistData[song].url);
            if (i === Object.keys.length - 1) {
                // console.log("done");
                promises_1.default.writeFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, JSON.stringify(playlistData)).then(() => {
                    res.status(200).json(playlistData);
                });
            }
        }).catch((error) => {
            res.status(400);
            console.log(error);
            throw new Error("Song unsuccesfully converted");
        });
    }));
}));
exports.playlistRefresh = playlistRefresh;
// @desc	Delete playlist
// @route	DELETE /api/playlist/:playlist
// @access	Private
const playlistDelete = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify which playlist you want to retrieve");
    }
    const playlist = yield playlistModel_1.default.findById(req.params.playlist);
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = yield userModel_1.default.findById(req.user.id);
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
    promises_1.default.unlink(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`).then(() => __awaiter(void 0, void 0, void 0, function* () {
        yield playlist.remove();
        res.status(200).json({ id: playlist.id });
    }));
}));
exports.playlistDelete = playlistDelete;
// @desc	Add to playlist
// @route	POST /api/playlist/modify/:playlist
// @access	Private
const playlistAdd = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const playlist = yield playlistModel_1.default.findById(req.params.playlist);
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = yield userModel_1.default.findById(req.user.id);
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
    const rawPlaylist = yield promises_1.default.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });
    const playlistJson = JSON.parse(rawPlaylist);
    playlistJson[songName] = { song: songName, url: songUrl, thumbnail: thumbnail, searchTerm: searchTerm };
    promises_1.default.writeFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, JSON.stringify(playlistJson)).then(() => {
        res.status(200).json(playlistJson);
    });
}));
exports.playlistAdd = playlistAdd;
// @desc	Remove from playlist
// @route	DELETE /api/playlist/modify/:playlist
// @access	Private
const playlistRemove = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const songName = req.body.song;
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify which playlist you want to retrieve");
    }
    if (songName === undefined) {
        res.status(400);
        throw new Error("Please specify which song you want to remove");
    }
    const playlist = yield playlistModel_1.default.findById(req.params.playlist);
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = yield userModel_1.default.findById(req.user.id);
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
    const rawPlaylist = yield promises_1.default.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });
    const Json = JSON.parse(rawPlaylist);
    delete Json[songName];
    promises_1.default.writeFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, JSON.stringify(Json)).then(() => {
        res.status(200).json(Json);
    });
}));
exports.playlistRemove = playlistRemove;
// @desc	Convert Spotify playlist
// @route	POST /api/playlist/convert/:spotifyUrl
// @access	Private
const playlistConvert = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.params.spotifyUrl) {
        res.status(400);
        throw new Error("Please specify the Spotify playlist you want to convert");
    }
    const spotifyId = decodeURIComponent(req.params.spotifyUrl.split("https://open.spotify.com/playlist/")[1].split("?")[0]);
    const spotifyApi = new spotify_web_api_node_1.default({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET, accessToken: yield server_1.spotifyTokenPromise });
    const rawPlaylistData = (yield spotifyApi.getPlaylist(spotifyId)).body;
    // const playlistName = rawPlaylistData.name;
    const songs = [];
    const artists = [];
    const fullSongData = [];
    const brokenSongs = [];
    for (let i = 0; i < Math.ceil(rawPlaylistData.tracks.total / 100); i++) {
        const rawItemsData = (yield spotifyApi.getPlaylistTracks(spotifyId, { offset: 100 * i, fields: "items" })).body;
        rawItemsData.items.map(e => {
            if (e.track) {
                artists.push(e.track.artists.map(f => { return f.name; }).join(" "));
                songs.push([e.track.name, e.track.album.images[0].url]);
            }
        });
    }
    Promise.all(songs.map((song, i) => __awaiter(void 0, void 0, void 0, function* () {
        const fullSongName = `${song[0]} ${artists[i]}`;
        const rawData = (yield axios_1.default.get(`http://141.148.84.127:3000/api/song/${encodeURIComponent(fullSongName)}`)).data;
        // const rawData = await getUrl(fullSongName, accessToken, song[1]);
        if (rawData.url === undefined) {
            brokenSongs.push([fullSongName]);
        }
        fullSongData[i] = ([song[0], rawData.url, song[1], fullSongName, "" + i]);
    }))).then(() => __awaiter(void 0, void 0, void 0, function* () {
        const playlistData = {};
        fullSongData.map(song => playlistData[song[0]] = { song: song[0], url: song[1], thumbnail: song[2], searchTerm: song[3] });
        const playlist = yield playlistModel_1.default.create({
            name: decodeURIComponent(rawPlaylistData.name),
            user: req.user.id
        });
        promises_1.default.appendFile(`${process.env.PLAYLIST_DIR}${playlist.id}.json`, JSON.stringify(playlistData)).then(() => {
            res.status(200).json({ playlistName: rawPlaylistData.name, playlistId: playlist.id, playlistData: playlistData, brokenSongs: brokenSongs });
        });
    }));
}));
exports.playlistConvert = playlistConvert;
// @desc	Get specific playlist
// @route	GET /api/playlist/modify/:playlist
// @access	Private
const playlistGet = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify which playlist you want to retrieve");
    }
    const playlist = yield playlistModel_1.default.findById(req.params.playlist);
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = yield userModel_1.default.findById(req.user.id);
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
    const rawPlaylistData = yield promises_1.default.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });
    const playlistData = JSON.parse(rawPlaylistData);
    res.status(200).json({
        playlistInfo: playlist,
        playlistContents: playlistData
    });
}));
exports.playlistGet = playlistGet;
