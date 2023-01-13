import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch, useMediaQuery } from "../app/hooks";
import { useNavigate } from "react-router-dom";
import { FaShare, FaPlus, FaSearch, FaClipboardCheck, FaEye, FaEyeSlash, FaPenSquare, FaCheckSquare, FaMinusSquare, FaCog, FaPlay, FaPause, FaForward, FaBackward, FaYoutube, FaSpotify } from "react-icons/fa";
import { BsArrowRepeat, BsShuffle, BsX } from "react-icons/bs"
import Spinner from "../components/Spinner";
import { getData, updatePlaylist } from "../features/playlists/playlistSlice";
import { toggle } from "../features/misc/deleteSlice";
import { setPlayingSong, setNextSong, searchYtSp } from "../features/misc/songSlice";
// import SongItem from "./SongItem";
const SongItem = lazy(() => import("./SongItem"));
import { Playlist as PlaylistType } from "../features/playlists/playlistService";
import ProgressBar from "./ProgressBar";
import { Carousel } from "flowbite-react";
import SongDisplay from "./SongDisplay";
import AudioPlayer from "./AudioPlayer";

function Playlist() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const isThin = useMediaQuery("(max-width:1200px)");
	const { playlistId } = useParams();
	const fileInput = useRef<HTMLInputElement>(null);
	const searchInput = useRef<HTMLInputElement>(null);
	const audioRef = useRef<HTMLAudioElement>(null);
	const timeRef = useRef<HTMLParagraphElement>(null);

	const [songSearch, setSongSearch] = useState("");
	const [playlistSearch, setPlaylistSearch] = useState("");
	const [newName, setNewName] = useState("");
	const [showCopyDialogue, setCopyDialogue] = useState(false);
	const [editing, setEditing] = useState(false);
	// const [scrollPercent, setScrollPercent] = useState(1);
	const [image, setImage] = useState<File | null>(null);
	const [showDetails, setShowDetails] = useState(false);
	const [songSource, setSongSource] = useState<"youtube" | "spotify">("youtube");
	const [time, setTime] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [shuffle, setShuffle] = useState(false);
	const [repeat, setRepeat] = useState(false);

	const { user } = useAppSelector(state => state.auth);
	const { playlistData, currentPlaylist } = useAppSelector(state => state.playlists);
	const { deleting } = useAppSelector(state => state.deleting)
	const { isLoading, isError, message } = useAppSelector(state => state.playlists);
	const { songName, url, searchResults } = useAppSelector(state => state.song);

	const searchSong = async (e: React.FormEvent) => {
		e.preventDefault();
		// const videos = dispatch(searchYtSp(songSearch));
		if (searchResults?.searchQuery === searchInput.current?.value) {
			console.log("CHANGING SOURCE: ", songSource);
		} else {
			setSongSearch("");
		}
	};

	const closeModalEscape = (e: KeyboardEvent) => {
		if ((e.code) === "Escape") {
			setShowDetails(false);
		}
	};

	/* const listenToScroll = () => {
		const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
		const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
		const scrolled = winScroll / height;
		const percent = 1 - Math.min(scrolled / .7, 1);
		setScrollPercent(percent);
	}; */

	useEffect(() => {
		if (isError) {
			console.log(message);
		}

		if (!user) {
			navigate("/login");
			console.log("not user");
		}


		// window.addEventListener("scroll", listenToScroll);

		const fetchData = async () => {
			const data: PlaylistType = (await (await dispatch(getData(playlistId as string))).payload as any).playlistInfo;
			const own = data.users.includes(user?.name as string);
			if (!own) {
				const form = new FormData();
				form.append("newUser", user?._id as string);
				dispatch(updatePlaylist({ id: data._id as string, data: form }));
			}
		}

		fetchData().catch((e) => console.log(e));

		document.body.addEventListener("keydown", closeModalEscape);

		return () => {
			document.body.removeEventListener("keydown", closeModalEscape);
		}


	}, [user, navigate, isError, message, dispatch, playlistId]);


	if (isLoading) {
		return <Spinner />
	}

	if (isError) {
		let text = "Something went wrong!"
		if (message.includes("Cast to ObjectId")) {
			text = "Invalid playlist ID";
		} else {
			text = message;
		}
		return (
			<div className="heading">
				<h1>{text}</h1>
				<Link to={"/"}><p className="hover:text-paradise-pink transition-all duration-150">Back to dashboard</p></Link>
			</div>)
	}
	return (
		<Suspense fallback={Spinner()}>
			<>
				<div className="playlist-screen-wrapper">
					{/* Playlist thumbnail */}
					{isThin && <div
						className={`playlist-banner-image absolute top-0 left-0 mt-[-3.5rem] h-full w-full -z-10`}
						// onLoad={e => setThumbnailHeight(e.target["height" as never])}
						style={{
							backgroundImage: `url(${currentPlaylist?.thumbnail})`
						}}
					>
					</div>}
					<div className="left-pane relative">
						{/* Playlist banner */}
						<div className={`playlist-banner grid-rows-[auto_1fr] gap-2 w-full text-mint-cream`}>
							<div className={`${isThin ? "col-span-2" : "grid grid-cols-[1fr_15rem]"} min-w-0`}>

								{/* Playlist title */}
								<div className="playlist-banner-text-wrapper overflow-x-clip relative min-w-0">
									{!isThin && <>
										<div className="absolute w-[76%] h-5 bottom-0 left-0 shadow-md shadow-[#00000040]"></div>
										<div
											className={`playlist-banner-image absolute h-full rounded-md shadow-md shadow-[#00000040]`}
											// onLoad={e => setThumbnailHeight(e.target["height" as never])}
											style={{
												backgroundImage: `url(${currentPlaylist?.thumbnail})`
											}}
										>
										</div>
									</>
									}
									<h1 className="playlist-banner-text min-w-full">{currentPlaylist?.name}</h1>
								</div>
								{/* Edit playlist */}
								<div className={`stats ${isThin ? "col-span-2" : ""} text-lg`}>
									<div className={`${isThin ? "border-r-[1px]" : "border-b-[1px]"} border-deep-space-sparkle `}>
										<h3>
											Length:
										</h3>
										<p>
											{playlistData.length}
										</p>
									</div>
									<div className={`${isThin ? "border-r-[1px]" : "border-b-[1px]"} border-deep-space-sparkle`}>
										<h3>
											Access:
										</h3>
										<p>
											{currentPlaylist?.public ? "Public" : "Private"}
										</p>
									</div>
									<div className="">
										<h3>
											Likes:
										</h3>
										<p>
											{currentPlaylist?.likes}
										</p>
									</div>
								</div>
							</div>

							<div className={`grid grid-cols-3 gap-2 h-[4.5rem] ${isThin ? "col-span-2" : "mt-4"}`}>
								{/* <button className={`btn h-full ${showCopyDialogue && "bg-deep-space-sparkle hover:bg-charlestown-green"} group`} onClick={() => {
									navigator.clipboard.writeText(window.location.href);
									setCopyDialogue(true);
									setTimeout(() => setCopyDialogue(false), 2000);
								}}>
									<div className="items-center justify-center">
										<FaShare size={"40"} className={`${showCopyDialogue ? "scale-0 absolute" : "scale-100"} transition-all mx-auto`} />
										<FaClipboardCheck size={"40"} className={`${showCopyDialogue ? "scale-100" : "scale-0 absolute"} transition-all mx-auto`} />
									</div>
								</button> */}
								<button className={`btn h-full ${showCopyDialogue && "bg-deep-space-sparkle hover:bg-charlestown-green"} group`} onClick={() => {
									navigator.clipboard.writeText(window.location.href);
									setCopyDialogue(true);
									setTimeout(() => setCopyDialogue(false), 2000);
								}}>
									<div className="items-center justify-center">
										<FaShare size={"40"} className={`${showCopyDialogue ? "scale-0 absolute" : "scale-100"} transition-transform`} />
										<FaClipboardCheck size={"40"} className={`${showCopyDialogue ? "scale-100" : "scale-0 absolute"} transition-transform mx-auto`} />
									</div>
								</button>
								<button className={`btn h-full ${deleting && "bg-deep-space-sparkle hover:bg-charlestown-green"} group`} onClick={() => {
									dispatch(toggle());
									setShowDetails(false);
								}}>
									<div className="items-center justify-center">
										<FaMinusSquare className="mx-auto" size={"40"} />
									</div>
								</button>
								<button className="btn h-full" onClick={() => setShowDetails(true)}><FaCog size={"40"} /></button>
								<div className={`modal ${showDetails && "show"}`} onClick={() => setShowDetails(false)}>
									<div className="modal-content" onClick={e => e.stopPropagation()}>
										<div className="modal-header">
											Playlist Properties
										</div>
										<div className={`modal-body ${editing ? "grid-rows-[auto_auto]" : ""}`}>
											<>

												<div className={`grid grid-rows-[auto_1fr] bg-charlestown-green rounded-md border-deep-space-sparkle max-h-[10rem] ${isThin ? "" : "w-[10rem] border-r-[1px]"} overflow-y-scroll`}>
													<h3 className="top-0 font-semibold border-b-[1px] border-b-deep-space-sparkle">Users:</h3>
													<div className="grid grid-rows-[repeat(auto-fill_1rem)]">
														{["currentPlaylist?.users", "sahdjsda", "asdjhasksahdlk", "asjhsakd", "asjkdasd", "asdhkasd", "akjshdk"].map(user => {
															return <p key={user} className="text-ellipsis whitespace-nowrap overflow-x-hidden">{user}</p>
														})}
													</div>
												</div>
												<div className="">
													<button className="group" onClick={() => {
														const data = new FormData();
														data.append("data", JSON.stringify({ public: !currentPlaylist?.public }));
														dispatch(updatePlaylist({ id: currentPlaylist?._id as string, data }));
													}}>
														<div className="grid grid-rows-2 items-center justify-center">
															<p className="font-semibold group-hover:text-charlestown-green">Privacy<br /><br /></p>
															<FaEyeSlash size={"40"} className={`${currentPlaylist?.public ? "scale-0 absolute" : "scale-100"} transition-all mx-auto`} />
															<FaEye size={"40"} className={`${currentPlaylist?.public ? "scale-100" : "scale-0 absolute"} transition-all mx-auto`} />
														</div>

													</button>
													<button className={` ${editing && "bg-deep-space-sparkle hover:bg-charlestown-green"} group`} onClick={async () => {
														if (editing) {
															const data = new FormData();
															if (image) {
																data.append("file", image);
															}
															if (newName.length > 0) {
																data.append("name", newName);
															}
															setNewName("");
															if (Array.from(data).length !== 0) {
																dispatch(updatePlaylist({ id: currentPlaylist?._id as string, data })).then(() => {
																	data.delete("file");
																	data.delete("name");
																	setImage(null);
																	setNewName("");
																});
															}
														}
														setEditing(!editing);
													}}>
														<div className="grid grid-rows-2 items-center justify-center">
															<p className="font-semibold group-hover:text-charlestown-green">Edit<br /><br /></p>
															<FaPenSquare size={"40"} className={`${editing ? "scale-0 absolute" : "scale-100"} transition-all mx-auto`} />
															<FaCheckSquare size={"40"} className={`${editing ? "scale-100" : "scale-0 absolute"} transition-all mx-auto`} />
														</div>
													</button>
												</div>
											</>
											{editing && <div className="col-span-2 grid-rows-2">
												<div className="w-full">
													<input type="text" className="form-control" placeholder="New playlist name..." onChange={e => setNewName(e.target.value)} />
												</div>
												<div className="w-full">
													<button onClick={() => fileInput.current?.click()} className="btn !w-full">
														New playlist thumbnail...
													</button>
													<input type="file" className="hidden absolute" ref={fileInput} multiple={false} accept={".gif,.png,.jpg"} onChange={(e) => {
														if (e.target.files) {
															setImage(e.target.files.item(0))
														}
													}} />
												</div>
											</div>}
										</div>
										<div className="modal-footer">
											<button onClick={() => setShowDetails(false)}><BsX size={"30"} /></button>
										</div>
									</div>
								</div>
							</div>
						</div>
						{/* Song player */}
						<div className="song-player-banner w-full h-full">
							<form onSubmit={searchSong} className="h-[4.5rem] grid grid-cols-[60%_1fr_1fr] gap-2">
								<input
									placeholder="Find a Song..."
									type={"text"}
									value={songSearch}
									className="form-control h-full"
									onChange={(e) => setSongSearch(e.target.value)}
									autoComplete={"off"}
									ref={searchInput}
								/>
								<button
									className="btn h-full"
									type="submit"
									onClick={() => {
										setSongSource("youtube");
										dispatch(searchYtSp(songSearch));
									}}
								>
									<FaYoutube size={`${isThin ? "" : "30"}`} />
								</button>
								<button
									className="btn h-full"
									type="submit"
									onClick={() => {
										setSongSource("spotify");
										dispatch(searchYtSp(songSearch));
									}}
								>
									<FaSpotify size={`${isThin ? "" : "30"}`} />
								</button>
							</form>
							<div className={`grid grid-rows-[${isThin ? "10rem" : "20rem"}_1fr] gap-2`}>
								<SongDisplay source={songSource} ref={timeRef} />
								<div className={`grid grid-rows-2 rounded-md shadow-md shadow-[#00000040] bg-[#252C2C20] ${isThin ? "py-4" : ""} relative`}>
									<div className={`grid ${isThin ? "grid-cols-[5rem_1fr_5rem]" : "grid-cols-3 mt-2"} items-center text-mint-cream`}>

										<button
											className={`max-w-fit ml-auto ${isThin ? "mr-[0.7rem]" : "mr-10"} transition-all ${shuffle ? "-scale-y-100 hover:text-mint-cream text-deep-space-sparkle" : "hover:text-deep-space-sparkle text-mint-cream"}`}
											onClick={() => setShuffle(!shuffle)}
										>
											<BsShuffle className={""} size={`${isThin ? "30" : "40"}`} />
										</button>

										<div className={`grid grid-cols-3 justify-center items-center`}>
											<button className="w-fit ml-auto hover:text-deep-space-sparkle transition-all">
												<FaBackward size={`${isThin ? "30" : "40"}`} />
											</button>
											<div className="grid grid-cols-1 mx-auto relative hover:text-deep-space-sparkle transition-all">
												<button className="max-w-fit" onClick={() => setPlaying(!playing)}>
													<FaPause className={`${playing ? "" : "scale-0 opacity-100 absolute"} inset-0 transition-all cursor-pointer`} size={`${isThin ? "30" : "40"}`} />
													<FaPlay className={`${playing ? "scale-0 opacity-100 absolute" : ""} inset-0 transition-all cursor-pointer`} size={`${isThin ? "30" : "40"}`} />
												</button>
											</div>
											<button className="max-w-fit mr-auto hover:text-deep-space-sparkle transition-all">
												<FaForward size={`${isThin ? "30" : "40"}`} />
											</button>
										</div>

										<button
											className={`max-w-fit mr-auto ${isThin ? "ml-[0.7rem]" : "ml-10"} hover:text-deep-space-sparkle transition-all ${repeat ? "rotate-180 hover:text-mint-cream text-deep-space-sparkle" : "hover:text-deep-space-sparkle text-mint-cream"}`}
											onClick={() => setRepeat(!repeat)}
										>
											<BsArrowRepeat className="" size={`${isThin ? "30" : "40"}`} />
										</button>

									</div>
									<div className={`w-full ${isThin ? "pt-6" : "pt-4 px-10"} flex`}>
										<ProgressBar leftColor="#476566" rightColor="#000" thumbColor="#E34A6F" thumbHoverColor="#FAFFF4" progress={time} />
									</div>
									{/* <audio src={url} controls className="absolute" ref={audioPlayer}></audio> */}
									<AudioPlayer source={url} ref={audioRef} updateTime={time => {
										// if (timeRef.current) {
										// console.log(time);
										const currentSeconds = ("0" + Math.floor(time[0]) % 60);
										const durationSeconds = ("0" + Math.floor(time[1]) % 60);
										const currentTime = (Math.floor(time[0] / 60) || 0) + ":" + (currentSeconds.substring(currentSeconds.length - 2, currentSeconds.length));
										const totalDuration = (Math.floor(time[1] / 60) || 0) + ":" + (durationSeconds.substring(durationSeconds.length - 2, durationSeconds.length));
										timeRef.current!.innerText = currentTime + " / " + totalDuration;
										setTime(time[0] / time[1] * 100);
										// }
									}} />
								</div>
							</div>
						</div>

					</div>
					<div className="right-pane">
						<input
							placeholder="Search..."
							type={"text"}
							value={playlistSearch}
							className="form-control"
							onChange={(e) => setPlaylistSearch(e.target.value)}
							autoComplete={"off"}
						/>
						<div className="song-section-wrapper">
							{playlistData.filter(e => e.song.toLowerCase().includes(playlistSearch.toLowerCase())).map(song => {
								const conflicts = []
								// if (ids.includes(song.searchTerm)) {
								for (const songCheck of playlistData) {
									if (songCheck.searchTerm === song.searchTerm && songCheck.song !== song.song) {
										conflicts.push(songCheck.song);
									}
								}
								// }
								const newSong = { ...song };
								if (conflicts.length > 0) {
									newSong.song = `${song.song} / ${conflicts.join(" / ")} conflict`;
									newSong.searchTerm = `${song.searchTerm} conflict ${song.song}`
								}
								return (
									<SongItem
										song={newSong}
										updateSearch={search => setSongSearch(search)}
										playSong={() => {
											if (audioRef.current) {
												audioRef.current?.play();
											}
										}}
										key={song.searchTerm === "BROKEN" ? newSong.song : newSong.searchTerm}
									/>
								)
							})}
						</div>
					</div>

				</div>
			</>
		</Suspense >
	)
}

export default Playlist