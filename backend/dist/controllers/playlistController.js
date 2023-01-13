"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playlistUpdate = exports.playlistUsers = exports.playlistGetUser = exports.playlistConvert = exports.playlistRemove = exports.playlistAdd = exports.playlistDelete = exports.playlistRefresh = exports.playlistCreate = exports.playlistGet = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const playlistModel_1 = __importDefault(require("../models/playlistModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const axios_1 = __importDefault(require("axios"));
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const server_1 = require("../server");
const voronoi_1 = __importDefault(require("../extras/voronoi"));
const thumbnailUrl = (playlistId) => {
    return new Promise(async (resolve, reject) => {
        const allThumbnails = await promises_1.default.readdir(process.env.THUMBNAIL_IMAGE_DIR);
        allThumbnails.map(e => {
            if (e.includes(playlistId)) {
                // console.log(e.split(process.env.THUMBNAIL_IMAGE_DIR as string));
                resolve("/api/song/thumbnail/" + e.split(process.env.THUMBNAIL_IMAGE_DIR)[0]);
            }
        });
        // const file = (await fs.readdir(process.env.THUMBNAIL_IMAGE_DIR as string)).map(e => { if (e.includes(playlistId)) return e }).filter(e => e !== undefined)[0] as string;
        // const contents = await fs.readFile(process.env.THUMBNAIL_IMAGE_DIR + "/" + file);
        // const b64 = contents.toString("base64");
        // resolve(`data:${mime.contentType(path.extname(file))};base64,${b64}`);
    });
};
// @desc	Get user playlists
// @route	GET /api/playlist
// @access	Private
const playlistGetUser = (0, express_async_handler_1.default)(async (req, res) => {
    const allPlaylists = await playlistModel_1.default.find();
    const ownedPlaylists = [];
    Promise.all(allPlaylists.map(async (playlist) => {
        if (playlist.users.includes(req.user.id)) {
            const usefulData = JSON.parse(JSON.stringify(playlist));
            // const thumbnail = { thumbnail: JSON.parse(await fs.readFile(process.env.THUMBNAIL_DIR as string, { encoding: "utf-8" }))[playlist._id].url };
            ownedPlaylists.push(Object.assign(usefulData, { thumbnail: await thumbnailUrl(playlist._id) }));
        }
    })).then(() => {
        // console.log(ownedPlaylists);
        res.status(200).json(ownedPlaylists);
    });
});
exports.playlistGetUser = playlistGetUser;
// @desc	Create playlist
// @route	POST /api/playlist/:playlist
// @access	Private
const playlistCreate = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify the name of the playlist you want to create");
    }
    console.log("CREATING PLAYLIST " + req.params.playlist);
    const playlist = await playlistModel_1.default.create({
        name: decodeURIComponent(req.params.playlist),
        users: [req.user.id]
    });
    const random = Math.floor(Math.random() * 30);
    const thumbnail = await (0, voronoi_1.default)(process.env.THUMBNAIL_DIR, playlist._id, Math.max(3, Math.floor(Math.random() * 10)), 1024, (random > 10) ? random : undefined);
    const usefulData = JSON.parse(JSON.stringify(playlist));
    promises_1.default.appendFile(`${process.env.PLAYLIST_DIR}${playlist.id}.json`, JSON.stringify({})).then(() => {
        res.status(200).json(Object.assign(usefulData, { thumbnail }));
    });
});
exports.playlistCreate = playlistCreate;
// @desc	Refresh playlist
// @route	PUT /api/playlist/:playlist
// @access	Private
const playlistRefresh = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify which playlist you want to retrieve");
    }
    console.log(req.params.id);
    const playlist = await playlistModel_1.default.findById(req.params.id);
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = await userModel_1.default.findById(req.user.id);
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
    const rawPlaylistData = await promises_1.default.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });
    const playlistData = JSON.parse(rawPlaylistData);
    const test = [];
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
});
exports.playlistRefresh = playlistRefresh;
// @desc	Delete playlist
// @route	DELETE /api/playlist/:playlist
// @access	Private
const playlistDelete = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify which playlist you want to retrieve");
    }
    const playlist = await playlistModel_1.default.findById(req.params.playlist);
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = await userModel_1.default.findById(req.user.id);
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
    await playlistModel_1.default.findByIdAndUpdate(req.params.playlist, { users: playlistUsers.filter(e => e !== req.user.id) }, { new: true }).then(async (updatedPlaylist) => {
        if (updatedPlaylist?.users.length === 0) {
            const deleteEntry = async () => {
                await playlist.remove();
                (await promises_1.default.readdir(process.env.THUMBNAIL_IMAGE_DIR)).map(e => {
                    if (e.includes(req.params.playlist)) {
                        promises_1.default.unlink(process.env.THUMBNAIL_IMAGE_DIR + "/" + e);
                    }
                });
                /* const thumbnails: { [id: string]: { url: string } } = JSON.parse(await fs.readFile(process.env.THUMBNAIL_DIR as string, { encoding: "utf-8" }));
                delete thumbnails[req.params.playlist];
                fs.writeFile(process.env.THUMBNAIL_DIR as string, JSON.stringify(thumbnails)).then(() => {
                    res.status(200).json({ id: playlist.id });
                }); */
            };
            await promises_1.default.unlink(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`);
            deleteEntry();
        }
        res.status(200).json({ id: playlist.id });
    });
});
exports.playlistDelete = playlistDelete;
// @desc	Add to playlist
// @route	POST /api/playlist/modify/:playlist
// @access	Private
const playlistAdd = (0, express_async_handler_1.default)(async (req, res) => {
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
    const playlist = await playlistModel_1.default.findById(req.params.playlist);
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = await userModel_1.default.findById(req.user.id);
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
    const rawPlaylist = await promises_1.default.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });
    const playlistJson = JSON.parse(rawPlaylist);
    playlistJson[songName] = { song: songName, url: songUrl, thumbnail: thumbnail, searchTerm: searchTerm };
    promises_1.default.writeFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, JSON.stringify(playlistJson)).then(() => {
        res.status(200).json(playlistJson);
    });
});
exports.playlistAdd = playlistAdd;
// @desc	Remove from playlist
// @route	DELETE /api/playlist/modify/:playlist
// @access	Private
const playlistRemove = (0, express_async_handler_1.default)(async (req, res) => {
    const songName = req.body.song;
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify which playlist you want to retrieve");
    }
    if (songName === undefined) {
        res.status(400);
        throw new Error("Please specify which song you want to remove");
    }
    const playlist = await playlistModel_1.default.findById(req.params.playlist);
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = await userModel_1.default.findById(req.user.id);
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
    const rawPlaylist = await promises_1.default.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });
    const Json = JSON.parse(rawPlaylist);
    delete Json[songName];
    promises_1.default.writeFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, JSON.stringify(Json)).then(() => {
        res.status(200).json(Json);
    });
});
exports.playlistRemove = playlistRemove;
// @desc	Convert Spotify playlist
// @route	POST /api/playlist/convert/:spotifyUrl
// @access	Private
const playlistConvert = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.params.spotifyUrl) {
        res.status(400);
        throw new Error("Please specify the Spotify playlist you want to convert");
    }
    const spotifyId = decodeURIComponent(req.params.spotifyUrl.split("https://open.spotify.com/playlist/")[1].split("?")[0]);
    const spotifyApi = new spotify_web_api_node_1.default({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET, accessToken: await server_1.spotifyTokenPromise });
    const rawPlaylistData = (await spotifyApi.getPlaylist(spotifyId)).body;
    // const playlistName = rawPlaylistData.name;
    const songs = [];
    const artists = [];
    const fullSongData = [];
    const brokenSongs = [];
    for (let i = 0; i < Math.ceil(rawPlaylistData.tracks.total / 100); i++) {
        const rawItemsData = (await spotifyApi.getPlaylistTracks(spotifyId, { offset: 100 * i, fields: "items" })).body;
        rawItemsData.items.map(e => {
            if (e.track) {
                artists.push(e.track.artists.map(f => { return f.name; }).join(" "));
                songs.push([e.track.name, e.track.album.images[0].url]);
            }
        });
    }
    Promise.all(songs.map(async (song, i) => {
        const fullSongName = `${song[0]} ${artists[i]}`;
        const rawData = (await axios_1.default.get(`http://129.213.46.224:3000/api/song/${encodeURIComponent(fullSongName)}`)).data;
        // const rawData = await getUrl(fullSongName, accessToken, song[1]);
        if (rawData.url === undefined) {
            brokenSongs.push([fullSongName]);
        }
        fullSongData[i] = ([song[0], rawData.url, song[1], rawData.searchTerm, "" + i]);
    })).then(async () => {
        const playlistData = {};
        fullSongData.map(song => playlistData[song[0]] = { song: song[0], url: song[1], thumbnail: song[2], searchTerm: song[3] });
        const playlist = await playlistModel_1.default.create({
            name: decodeURIComponent(rawPlaylistData.name),
            users: [req.user.id],
        });
        promises_1.default.appendFile(`${process.env.PLAYLIST_DIR}${playlist.id}.json`, JSON.stringify(playlistData)).then(() => {
            res.status(200).json({ playlistName: rawPlaylistData.name, playlistId: playlist.id, playlistData: playlistData, brokenSongs: brokenSongs });
        });
    });
});
exports.playlistConvert = playlistConvert;
// @desc	Get specific playlist
// @route	GET /api/playlist/modify/:playlist
// @access	Private
const playlistGet = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify which playlist you want to retrieve");
    }
    const playlist = await playlistModel_1.default.findById(req.params.playlist);
    // console.log(playlist)
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = await userModel_1.default.findById(req.user.id);
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
    const rawPlaylistData = await promises_1.default.readFile(`${process.env.PLAYLIST_DIR}${req.params.playlist}.json`, { encoding: "utf-8" });
    const playlistData = JSON.parse(rawPlaylistData);
    // const thumbnail = JSON.parse(await fs.readFile(process.env.THUMBNAIL_DIR as string, { encoding: "utf-8" }))[playlist._id].url;
    const usefulData = JSON.parse(JSON.stringify(playlist));
    res.status(200).json({
        playlistInfo: Object.assign(usefulData, { thumbnail: await thumbnailUrl(playlist._id) }),
        playlistContents: playlistData
    });
});
exports.playlistGet = playlistGet;
// @desc	Get playlist contributers
// @route	POST /api/playlist/convert/users
// @access	Private
const playlistUsers = (0, express_async_handler_1.default)(async (req, res) => {
    const { users } = req.body;
    Promise.all(JSON.parse(users).map(async (user) => {
        const userFound = await userModel_1.default.findOne({ _id: user });
        return userFound?.name;
    })).then((e) => {
        res.status(200).json(e);
    });
});
exports.playlistUsers = playlistUsers;
// @desc Update playlist meta data
// @route POST /api/playlist/modify/:playlist
// @access Private
const playlistUpdate = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.params.playlist) {
        res.status(400);
        throw new Error("Please specify which playlist you want to update");
    }
    const playlist = await playlistModel_1.default.findById(req.params.playlist);
    // console.log(playlist)
    if (!playlist) {
        res.status(400);
        throw new Error("Playlist not found");
    }
    const user = await userModel_1.default.findById(req.user.id);
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
    await playlistModel_1.default.findByIdAndUpdate(req.params.playlist, Object.assign(req.body, { public: publicStatus }, { users: playlistUsers }), { new: true }).then(async (updatedPlaylist) => {
        const usefulData = JSON.parse(JSON.stringify(updatedPlaylist));
        res.status(200).json({
            playlistInfo: Object.assign(usefulData, { thumbnail: await thumbnailUrl(req.params.playlist) })
        });
    });
});
exports.playlistUpdate = playlistUpdate;
