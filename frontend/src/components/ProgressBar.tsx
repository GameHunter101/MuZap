import { useRef, useEffect, useState } from "react";

function ProgressBar(props: { leftColor: string, rightColor: string, thumbColor: string, thumbHoverColor: string, progress:number }) {
	
	const [progress, setProgress] = useState(0);

	const thumb = useRef<HTMLInputElement>(null);
	const track = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isNaN(props.progress)){
			setProgress(props.progress);
		}
	}, [props.progress])
	

	return (
		<div className="w-full flex relative">
			<style dangerouslySetInnerHTML={{
				__html: [
					`input[type="range"] {
						-webkit-appearance: none;
						width: 100%;
						height: 0.3rem;
						background: ${props.leftColor};
						border-radius: 5000px;
						background-repeat: no-repeat; 
						position:absolute;
					}
						
					#track {
						-webkit-transform: rotateY(180deg);
						transform: rotateY(180deg);
						background-image: linear-gradient(${props.rightColor}, ${props.rightColor});
						z-index: -1;
						background-size: 100%
					}

					#track::-webkit-slider-thumb {
						display:none;
					}
					
					#thumb{
						-webkit-appearance: none;
						background: transparent;
					}
					
					input[type="range"]::-webkit-slider-thumb {
						-webkit-appearance: none;
						height: .35rem;
						width: 20px;
						border-radius: 5000px;
						background: ${props.thumbColor};
						cursor: ew-resize;
						box-shadow: 0 0 2px 0 #555;
						transition: background .3s ease-in-out;
					}
					
					input[type="range"]::-webkit-slider-thumb:hover {
						background: ${props.thumbHoverColor};
					}
					
					input[type=range]::-webkit-slider-runnable-track  {
						-webkit-appearance: none;
						box-shadow: none;
						border: none;
						background: transparent;
					}`
				].join('\n')
			}}>
			</style>
			<input type="range" style={{ backgroundSize: `${props.progress}%]` }} value={progress} min="0" max="100" id="thumb" ref={thumb} onChange={(e) => {
				setProgress(parseInt(e.target.value));
				if (track.current) {
					track.current.style.backgroundSize = 100 - parseInt(e.target.value) + "%";
				}
			}} />
			<input type="range" style={{ backgroundSize: `${100 - props.progress}%]` }} readOnly value={progress} min="0" max="100" id="track" ref={track} />
		</div>
	)
}

export default ProgressBar