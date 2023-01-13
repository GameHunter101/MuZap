import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import PlaylistForm from "../components/PlaylistForm";
import PlaylistItem from "../components/PlaylistItem";
import Spinner from "../components/Spinner";
import { toggle } from "../features/misc/deleteSlice";
import { Playlist } from "../features/playlists/playlistService";
import { getPlaylists, reset } from "../features/playlists/playlistSlice";


function Dashboard() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { user } = useAppSelector(state => state.auth);
	const { deleting } = useAppSelector(state => state.deleting);
	const { playlists, isLoading, isError, message } = useAppSelector(state => state.playlists);

	useEffect(() => {
		if (isError) {
			console.log(message);
		}

		if (!user) {
			navigate("/login");
			console.log("not user");
		}
		
		dispatch(getPlaylists());

		return () => {
			dispatch(reset());
		}
	}, [user, navigate, isError, message, dispatch]);

	if (isLoading) {
		return <Spinner />
	}

	return (
		<>
			<section className="heading">
				<h1>Welcome {user && user.name}</h1>
				<p>MuZap Dashboard</p>
			</section>
			<PlaylistForm />
			<section className="content">
				{playlists.length > 0 ?
					<>
						<div className="playlists">
							{playlists.map((playlist: Playlist) => {
								// console.log(playlists.length);
								return <PlaylistItem key={playlist._id} playlist={playlist} />
							})}
						</div>
						<div className="form">
							<button className={`btn btn-block ${deleting ? "bg-deep-space-sparkle hover:bg-charlestown-green" : ""}`} type="submit" onClick={() => dispatch(toggle())}>Delete Playlist</button>
						</div>
					</>
					: <h3>You have not made any playlists</h3>}
			</section>
		</>
	)
}

export default Dashboard