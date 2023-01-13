"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.songSearch = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const yt = __importStar(require("youtube-search-without-api-key"));
const ytdl = __importStar(require("ytdl-core"));
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const server_1 = require("../server");
async function newThumbnail(songName, accessToken, youtubeId) {
    const spotifyApi = new spotify_web_api_node_1.default({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET, accessToken: accessToken });
    try {
        const url = (await spotifyApi.searchTracks(songName, { limit: 1 })).body.tracks?.items[0].album.images[0].url;
        return url;
    }
    catch (error) {
        return "https://img.youtube.com/vi/" + youtubeId + "/hqdefault.jpg";
    }
}
// @desc    Convert songs
// @route   GET /api/songs/:name
// @access  Private
const songSearch = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.params.name) {
        res.status(400);
        throw new Error("Please specify the name of the song");
    }
    /* const vlc = new VLC.Client({
        ip: "localhost",
        port: 8080,
        password: process.env.VLC_PASSWORD as string
    }); */
    // await vlc.emptyPlaylist().then(async () => {
    await yt.search(decodeURIComponent(req.params.name)).then(async (ytRes) => {
        const songData = {
            song: "",
            url: "",
            thumbnail: "",
            searchTerm: ""
        };
        const songUrlData = (await ytdl.getInfo(ytRes[0].url)).formats.map((e, i) => {
            if (e.audioQuality === "AUDIO_QUALITY_MEDIUM" && e.audioSampleRate === "48000") {
                // console.log(e.audioSampleRate,e.audioBitrate,e.audioChannels,i);
                return e;
            }
        }).filter(e => e !== undefined)[0];
        const thumbnail1 = await newThumbnail(ytRes[0].title, await server_1.spotifyTokenPromise, ytRes[0].id.videoId);
        const thumbnail2 = await newThumbnail(req.params.name, await server_1.spotifyTokenPromise, ytRes[0].id.videoId);
        let finalThumbnail = "";
        if (thumbnail1.indexOf("https://img.youtube.com/vi/") === -1) {
            finalThumbnail = thumbnail1;
        }
        else {
            if (thumbnail2.indexOf("https://img.youtube.com/vi/") === -1) {
                finalThumbnail = thumbnail2;
            }
            else {
                finalThumbnail = thumbnail1;
            }
        }
        songData.song = ytRes[0].title;
        songData.url = songUrlData.url;
        songData.thumbnail = finalThumbnail;
        songData.searchTerm = ytRes[0].id.videoId;
        res.status(200).json(songData);
        /* const id = ytRes[0].id.videoId;
        await vlc.playFile(`https://www.youtube.com/watch?v=${id}`, { wait: true, noaudio: false, novideo: true }).then(async () => {
            const url = (await vlc.getPlaylist())[0].uri;
            
            res.status(200).json({ url: url });
        }) */
    });
    // })
});
exports.songSearch = songSearch;
