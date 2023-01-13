"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playlistSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
;
exports.playlistSchema = new mongoose_1.default.Schema({
    users: {
        type: [String],
        required: true,
        ref: "User"
    },
    name: { type: String, required: true },
    public: { type: Boolean, required: true, default: false },
    likes: { type: Number, required: true, default: 0 }
}, {
    timestamps: true,
});
const Playlist = mongoose_1.default.model("Playlist", exports.playlistSchema);
exports.default = Playlist;
