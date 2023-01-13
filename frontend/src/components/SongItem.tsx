import { PlaylistElement } from "../features/playlists/playlistService";
import { useAppDispatch, useMediaQuery } from "../app/hooks";
import { searchYtSp, setPlayingSong } from "../features/misc/songSlice";

function SongItem(props: { song: PlaylistElement, updateSearch: (search: string) => void, playSong: () => void, key: React.Key }) {
	// const isThin = useMediaQuery("(max-width:1200px)");
	const dispatch = useAppDispatch();
	const conflict = props.song.searchTerm.includes("conflict");
	return (
		<button
			className={`song-wrapper group ${conflict ? "bg-[#7c252520] hover:bg-[#7c2525A0]" : ""}`}
			key={props.song.searchTerm}
			onClick={() => {
				const promise = new Promise((res,rej)=>{
					if (conflict) {
						const songName = props.song.searchTerm.split(" conflict ")[1];
						props.updateSearch(songName);
						Promise.all([
							dispatch(setPlayingSong({ songName: "RESOLVE SONG CONFLICT", url: props.song.url, thumbnail: "" })),
							dispatch(searchYtSp(songName))
						]).then(()=>res(undefined));
					} else {
						Promise.all([dispatch(setPlayingSong({ songName: props.song.song, url: props.song.url, thumbnail: props.song.thumbnail }))]).then(()=>res(undefined))
					}
				});
				promise.then(()=>props.playSong());
			}}
		>
			<div className="song-thumbnail-wrapper">
				<img src={props.song.thumbnail} alt={`${props.song.song} thumbnail`} className={`song-thumbnail`} />
			</div>
			<h2 className={`song-text col-start-2`}>{props.song.song}</h2>
		</button>
	)
}

export default SongItem