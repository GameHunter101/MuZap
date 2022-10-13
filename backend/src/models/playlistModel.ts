import mongoose from "mongoose";

export interface PlaylistInterface extends mongoose.Document {
    user: string[],
    name: string
};

export const playlistSchema = new mongoose.Schema<PlaylistInterface>({
    user: {
        type: [String],
        required: true,
        ref: "User"
    },
    name: { type: String, required: true }
}, {
    timestamps: true,
});

const Playlist = mongoose.model<PlaylistInterface>("Playlist", playlistSchema);

export default Playlist;