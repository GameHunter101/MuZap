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
exports.songSearch = void 0;
const VLC = __importStar(require("vlc-client"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const yt = __importStar(require("youtube-search-without-api-key"));
const ytdl = __importStar(require("ytdl-core"));
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const server_1 = require("../server");
function newThumbnail(songName, accessToken, youtubeId) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const spotifyApi = new spotify_web_api_node_1.default({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET, accessToken: accessToken });
        try {
            const url = (_a = (yield spotifyApi.searchTracks(songName, { limit: 1 })).body.tracks) === null || _a === void 0 ? void 0 : _a.items[0].album.images[0].url;
            return url;
        }
        catch (error) {
            return "https://img.youtube.com/vi/" + youtubeId + "/hqdefault.jpg";
        }
    });
}
// @desc    Convert songs
// @route   GET /api/songs/:name
// @access  Private
const songSearch = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.params.name) {
        res.status(400);
        throw new Error("Please specify the name of the song");
    }
    const vlc = new VLC.Client({
        ip: "localhost",
        port: 8080,
        password: process.env.VLC_PASSWORD
    });
    yield vlc.emptyPlaylist().then(() => __awaiter(void 0, void 0, void 0, function* () {
        yield yt.search(decodeURIComponent(req.params.name)).then((ytRes) => __awaiter(void 0, void 0, void 0, function* () {
            const songData = {
                song: "",
                url: "",
                thumbnail: "",
                searchTerm: ""
            };
            const songUrlData = (yield ytdl.getInfo(ytRes[0].url)).formats.map((e, i) => {
                if (e.audioQuality === "AUDIO_QUALITY_MEDIUM" && e.audioSampleRate === "48000") {
                    // console.log(e.audioSampleRate,e.audioBitrate,e.audioChannels,i);
                    return e;
                }
            }).filter(e => e !== undefined)[0];
            const thumbnail1 = yield newThumbnail(ytRes[0].title, yield server_1.spotifyTokenPromise, ytRes[0].id.videoId);
            const thumbnail2 = yield newThumbnail(req.params.name, yield server_1.spotifyTokenPromise, ytRes[0].id.videoId);
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
            songData.searchTerm = req.params.name;
            res.status(200).json(songData);
            /* const id = ytRes[0].id.videoId;
            await vlc.playFile(`https://www.youtube.com/watch?v=${id}`, { wait: true, noaudio: false, novideo: true }).then(async () => {
                const url = (await vlc.getPlaylist())[0].uri;
                
                res.status(200).json({ url: url });
            }) */
        }));
    }));
}));
exports.songSearch = songSearch;
