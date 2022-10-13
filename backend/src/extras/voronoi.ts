import Canvas from "canvas";
import fs from "fs/promises";

export default async function voronoi(path:string,id: string, pointsCount: number, canvasSize: number, step?: number) {
	const preTime = Date.now();

	const canvas = Canvas.createCanvas(canvasSize, canvasSize);
	const ctx = canvas.getContext('2d');

	ctx.imageSmoothingEnabled = false;

	const centers: { x: number, y: number }[][] = [];

	const image = ctx.createImageData(canvasSize, canvasSize);

	for (let i = 0; i < pointsCount; i++) {
		centers.push([]);
		for (let j = 0; j < pointsCount; j++) {
			centers[i].push({ x: Math.floor(Math.random() * (canvasSize / pointsCount)) + i * (canvasSize / pointsCount), y: Math.floor(Math.random() * (canvasSize / pointsCount)) + j * (canvasSize / pointsCount) })
		}
	}
	const colors = [[248, 255, 244], [37, 44, 44], [71, 101, 102], [227, 74, 111]];
	const color = colors[Math.floor(Math.random() * colors.length)]
	const r = color[0];
	const g = color[1];
	const b = color[2];

	for (let xPos = 0; xPos < canvasSize; xPos++) {
		for (let yPos = 0; yPos < canvasSize; yPos++) {

			const x = (Math.floor((xPos / (canvasSize / pointsCount))));
			const y = (Math.floor((yPos / (canvasSize / pointsCount))));


			let closestCenters: { x: number, y: number }[] = []
			for (let i = -1; i < 2; i++) {
				for (let j = -1; j < 2; j++) {
					if (x + i >= 0 && x + i < pointsCount && y + j >= 0 && y + j < pointsCount) {
						closestCenters.push(centers[x + i][y + j]);
					}
				}
			}

			const lerp = (a: number, b: number, k: number) => {
				return a + (b - a) * k;
			}
			const invlerp = (a: number, b: number, v: number) => {
				return (v - a) / (b - a);
			}
			const mapRange = (inMin: number, inMax: number, outMin: number, outMax: number, v: number) => {
				return lerp(outMin, outMax, invlerp(inMin, inMax, v));
			}

			const distances = closestCenters.map(e => {
				if (step) {
					return step*Math.round(Math.sqrt((e.x - xPos) ** 2 + (e.y - yPos) ** 2)/step)
				}
				return Math.sqrt((e.x - xPos) ** 2 + (e.y - yPos) ** 2);
			})
			const shortestDistance = Math.min(...distances);
			const secondShortest = Math.min(...distances.filter(e => e != shortestDistance));
			let strength = 255 - shortestDistance / (canvasSize / pointsCount) * 255;

			// strength = (strength > 70) ? mapRange(70,255,0,255,strength) : strength/3;
			if (secondShortest - shortestDistance <= 3) {
				strength = 0;
			} else {
				strength = mapRange(0, 255, 3, 255, strength);
			}

			image.data[xPos * 4 + yPos * canvasSize * 4] = Math.sqrt(r * strength);
			image.data[xPos * 4 + yPos * canvasSize * 4 + 1] = Math.sqrt(g * strength);
			image.data[xPos * 4 + yPos * canvasSize * 4 + 2] = Math.sqrt(b * strength);
			image.data[xPos * 4 + yPos * canvasSize * 4 + 3] = 255;
		}
	}
	ctx.putImageData(image, 0, 0);

	let file:{[id:string]:{url:string}} = {};

	const exists = await fs.stat(path).then(()=>{return true}).catch(()=>{return false});
	if (exists) {
		file = JSON.parse(await fs.readFile(path, {encoding:"utf-8"}));
		// console.log(file);
	} else {
		fs.appendFile(path, JSON.stringify({}));
	};
	file[id] = {url:canvas.toDataURL("image/jpeg")}
	fs.writeFile(path,JSON.stringify(file));
}