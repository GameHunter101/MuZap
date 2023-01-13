import mongoose from "mongoose";

export interface PlaylistInterface extends mongoose.Document {
    users: string[],
    name: string,
    public: boolean,
    likes: number
};

export const playlistSchema = new mongoose.Schema<PlaylistInterface>({
    users: {
        type: [String],
        required: true,
        ref: "User"
    },
    name: { type: String, required: true },
    public: {type: Boolean, required: true, default: false},
    likes: {type: Number, required: true, default: 0}
}, {
    timestamps: true,
});

const Playlist = mongoose.model<PlaylistInterface>("Playlist", playlistSchema);

export default Playlist;