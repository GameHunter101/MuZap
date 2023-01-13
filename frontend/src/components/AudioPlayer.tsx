import React, { useEffect, useRef } from "react"


const AudioPlayer = React.forwardRef<HTMLAudioElement, {source:string,updateTime:(time:[number,number])=>void}>((props: { source: string,updateTime:(time:[number,number])=>void },ref) => {
    return (
        <audio src={props.source} controls className="absolute" onTimeUpdate={e=>props.updateTime([e.target["currentTime" as never],e.target["duration" as never]])} ref={ref}></audio>
    )
})

export default AudioPlayer