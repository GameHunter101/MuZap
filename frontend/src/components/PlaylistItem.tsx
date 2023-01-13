import { Playlist } from "../features/playlists/playlistService";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { deletePlaylist } from "../features/playlists/playlistSlice";
import { Link } from "react-router-dom";

function PlaylistItem(props: { playlist: Playlist, key: React.Key }) {
	const { deleting } = useAppSelector(state => state.deleting);
	const dispatch = useAppDispatch();

	const onClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (deleting) {
			e.stopPropagation();
			console.log("delete:", await dispatch(deletePlaylist(props.playlist._id)));
		} else {
			console.log("LOADING PLAYLIST");
		}
	}
	return (
		<div className="playlist group relative mx-2">
			<Link to={"/playlist/"+props.playlist._id}>
				<h2 className="playlist-info">
					{props.playlist.name}
				</h2>
				<img className="thumbnail" src={props.playlist.thumbnail} alt={"Playlist Thumbnail"}></img>
			</Link>
			<button className={`overlay ${deleting ? "" : "bg-transparent scale-0"} transition-colors`} onClick={(e) => onClick(e)}>
				<h1 className="text-mint-cream">DELETE</h1>
			</button>
		</div>
	)
}

export default PlaylistItem