import mongoose from "mongoose";

export interface userInterface extends mongoose.Document {
    name: string,
    email: string,
    password: string
};

export const userSchema = new mongoose.Schema<userInterface>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, {
    timestamps: true,
});

const Playlist = mongoose.model<userInterface>("User", userSchema);

export default Playlist;