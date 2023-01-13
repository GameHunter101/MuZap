import { useAppSelector, useMediaQuery } from "../app/hooks";
import { Carousel } from "flowbite-react";
import { useEffect, useState } from "react";
import { Spinner } from "flowbite-react";
import { useAppDispatch } from "../app/hooks";
import { retrieveSong } from "../features/misc/songSlice";
import React from "react";
import { SearchResult } from "../features/misc/songService";

const SongDisplay = React.forwardRef<HTMLParagraphElement, { source: "youtube" | "spotify" }>((props: { source: "youtube" | "spotify" }, ref) => {
	const dispatch = useAppDispatch();
	const isThin = useMediaQuery("(max-width:1200px)");

	const [currentService, setService] = useState<"youtube" | "spotify">("youtube");

	const { songName, url, thumbnail, searchResults, isLoading, isError, message } = useAppSelector(state => state.song);

	useEffect(() => {
		if (isError) {
			console.log(message)
		}
	}, [isError]);

	if (isLoading) {
		return <Spinner className={`${isThin ? "min-h-[10rem]" : "min-h-[20rem]"}`} size="lg" />
	}

	return (
		<div className={`${isThin ? "w-full h-[10rem]" : "h-[20rem]"} relative bg-[#252C2C20] rounded-md shadow-md shadow-[#00000040]`}>
			{thumbnail && thumbnail.length > 0 && <img src={thumbnail} alt="" className={`h-full ${isThin ? "w-full object-cover current-song-thumbnail absolute" : ""} rounded-md`} />}
			{/* <div className={`${isThin ? `absolute flex flex-col ${(thumbnail.length === 0 && songName.length > 0) ? "" : "justify-center"} h-full` : `${(thumbnail.length === 0 && songName.length > 0) ? "grid grid-rows-[3rem_1fr]" : ""} text-left pt-8 px-4`} ${thumbnail.length > 0 ? "" : "col-span-2 text-center"} w-full min-w-0 text-ellipsis whitespace-nowrap overflow-x-clip`}> */}
			<div className={`h-full grid grid-rows-[auto_0.95fr]`}>
				{!searchResults && <h2 className={`text-deep-space-sparkle font-semibold ${isThin ? "text-[1.4rem]" : `${thumbnail.length === 0 && songName.length > 0 ? "text-5xl" : "text-7xl"}`} text-ellipsis whitespace-nowrap overflow-x-clip`}>{songName.length > 0 ? songName : "Nothing playing"}</h2>}
				{searchResults && (
					thumbnail.length === 0 ? (
						<div className={`grid grid-rows-[3rem_1fr] ${isThin?"h-[10rem]":"h-[20rem]"}`}>
							<div className={`grid grid-cols-2 rounded-md hover:rounded ${isThin ? "w-[75%]" : "w-[50%]"} mx-auto relative bg-charlestown-green z-20 group shadow-md shadow-[#00000040] my-2`}>
								{(["youtube", "spotify"] as ("youtube" | "spotify")[]).map(service => {
									return (
										<button onClick={() => setService(service)} className={`${service === currentService ? "" : ""}`}>{service}</button>
									)
								})}
								<div className={`bg-smoky-black opacity-40 absolute h-full w-[50%] border-charlestown-green border-2 -z-10 ${currentService === "spotify" ? "translate-x-[100%]" : ""} transition-all rounded-md group-hover:rounded`}></div>
							</div>
							<div className={`grid grid-${isThin?"rows":"cols"}-[65%_1fr] h-full`}>
								<div className={`${isThin?"h-[5rem]":"h-[17rem]"} flex flex-col overflow-y-scroll min-h-0 max-h-full`}>
									{searchResults[currentService].map(song => {
										return (
											<button className="grid grid-cols-[5rem_1fr] m-1 btn px-0" key={song[1][0]}>
												<img src={song[1][1]} alt="" className="rounded-l-md group-hover:rounded-l transition-all duration-100" />
												<p className="line-clamp-2">{song[0][0]}</p>
											</button>
										)
									})}
								</div>
								<div className="">
									No song selected
								</div>
								{/* {Object.keys(searchResults).splice(1, 2).map(service => {
									return (<div className="h-[17rem] flex flex-col overflow-y-scroll min-h-0 max-h-full">
										{searchResults[service as typeof props.source].map(song => {
											return (
												<button className="grid grid-cols-[5rem_1fr] m-1 btn px-0" key={song[1][0]}>
													<img src={song[1][1]} alt="" className="rounded-l-md group-hover:rounded-l transition-all duration-100" />
													<p>{song[0][0]}</p>
												</button>
											)
										})}
									</div>);
								})} */}
							</div>
							{/* <Carousel
                                className="h-full"
                                slide={false}
                                indicators={false}
                            // leftControl={<div className="text-red-700 bottom-0 translate-y-[2.5rem]">stuff</div>}
                            >
                                {searchResults[props.source].map(song => {

                                    return (
                                        <div className="h-full" key={song[1]}>
                                            {props.source === "spotify" ?
                                                <iframe key={song[1]} height={`${isThin ? "70%" : "60%"}`} className={`rounded-xl w-[70%] mx-auto`} src={`https://open.spotify.com/embed/track/${song[1]}`} loading="lazy"></iframe>
                                                // : <ReactPlayer url={"https://www.youtube.com/watch?v=8XmAxTtaqk8"} height="10rem" width="100%"/>
                                                : <iframe className="mx-auto" width="70%" height={`${isThin ? "100%" : "60%"}`} src={"https://www.youtube-nocookie.com/embed/" + song[1] + "?controls=0"} title={song[0][1]} loading="lazy" ></iframe>
                                            }
                                            <button
                                                className={`absolute btn left-0 right-0 mx-auto w-16 py-1 ${isThin ? "" : ""}}`}
                                                onClick={() => {
                                                    dispatch(retrieveSong(props.source === "spotify" ? "https://open.spotify.com/track/"+song[1] : "https://www.youtube-nocookie.com/embed/" + song[1]));
                                                }}
                                            >select</button>
                                        </div>
                                    )
                                })}
                            </Carousel> */}
						</div>
					) : <h2 className="text-mint-cream text-3xl">No {props.source} results found!</h2>
				)}
				{thumbnail.length > 0 && <p className={`text-mint-cream ${isThin ? "text-3xl" : "text-4xl"} font-light`} ref={ref}></p>}
			</div>
		</div>
	)
})

export default SongDisplay