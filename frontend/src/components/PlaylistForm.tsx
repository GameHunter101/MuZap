import { useState } from "react";
import { useAppDispatch } from "../app/hooks";
import { convertPlaylist, createPlaylist } from "../features/playlists/playlistSlice";

function PlaylistForm() {
	const [text, setText] = useState("");

	const dispatch = useAppDispatch();

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if(text.includes("open.spotify.com/playlist/")){
			dispatch(convertPlaylist(text));
		} else {
			dispatch(createPlaylist(text));
		}
		setText("");
	}

	return (
		<section className="form">
			<form onSubmit={onSubmit}>
				<div className="form-group">
					<label htmlFor="text" className="text-lg text-deep-space-sparkle">Name your playlist:</label>
					<input
						type={"text"}
						name="text"
						id="text"
						value={text}
						className="form-control"
						onChange={(e) => setText(e.target.value)}
						autoComplete={"off"}
					/>
				</div>
				<div className="form-group">
					<button className="btn btn-block" type="submit">Add Playlist</button>
				</div>
			</form>
		</section>
	)
}

export default PlaylistForm