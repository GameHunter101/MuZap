"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const canvas_1 = __importDefault(require("canvas"));
const fs_1 = __importDefault(require("fs"));
async function voronoi(path, id, pointsCount, canvasSize, step) {
    const preTime = Date.now();
    const canvas = canvas_1.default.createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const centers = [];
    const image = ctx.createImageData(canvasSize, canvasSize);
    for (let i = 0; i < pointsCount; i++) {
        centers.push([]);
        for (let j = 0; j < pointsCount; j++) {
            centers[i].push({ x: Math.floor(Math.random() * (canvasSize / pointsCount)) + i * (canvasSize / pointsCount), y: Math.floor(Math.random() * (canvasSize / pointsCount)) + j * (canvasSize / pointsCount) });
        }
    }
    const colors = [[248, 255, 244], [37, 44, 44], [71, 101, 102], [227, 74, 111]];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const r = color[0];
    const g = color[1];
    const b = color[2];
    for (let xPos = 0; xPos < canvasSize; xPos++) {
        for (let yPos = 0; yPos < canvasSize; yPos++) {
            const x = (Math.floor((xPos / (canvasSize / pointsCount))));
            const y = (Math.floor((yPos / (canvasSize / pointsCount))));
            let closestCenters = [];
            for (let i = -1; i < 2; i++) {
                for (let j = -1; j < 2; j++) {
                    if (x + i >= 0 && x + i < pointsCount && y + j >= 0 && y + j < pointsCount) {
                        closestCenters.push(centers[x + i][y + j]);
                    }
                }
            }
            const lerp = (a, b, k) => {
                return a + (b - a) * k;
            };
            const invlerp = (a, b, v) => {
                return (v - a) / (b - a);
            };
            const mapRange = (inMin, inMax, outMin, outMax, v) => {
                return lerp(outMin, outMax, invlerp(inMin, inMax, v));
            };
            const distances = closestCenters.map(e => {
                if (step) {
                    return step * Math.round(Math.sqrt((e.x - xPos) ** 2 + (e.y - yPos) ** 2) / step);
                }
                return Math.sqrt((e.x - xPos) ** 2 + (e.y - yPos) ** 2);
            });
            const shortestDistance = Math.min(...distances);
            const secondShortest = Math.min(...distances.filter(e => e != shortestDistance));
            let strength = 255 - shortestDistance / (canvasSize / pointsCount) * 255;
            // strength = (strength > 70) ? mapRange(70,255,0,255,strength) : strength/3;
            if (secondShortest - shortestDistance <= 3) {
                strength = 0;
            }
            else {
                strength = mapRange(0, 255, 3, 255, strength);
            }
            image.data[xPos * 4 + yPos * canvasSize * 4] = Math.sqrt(r * strength);
            image.data[xPos * 4 + yPos * canvasSize * 4 + 1] = Math.sqrt(g * strength);
            image.data[xPos * 4 + yPos * canvasSize * 4 + 2] = Math.sqrt(b * strength);
            image.data[xPos * 4 + yPos * canvasSize * 4 + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
    const promise = new Promise((res, rej) => {
        const out = fs_1.default.createWriteStream(`${process.env.THUMBNAIL_IMAGE_DIR}/${id}.jpg`);
        const stream = canvas.createJPEGStream();
        stream.pipe(out);
        out.on("finish", () => res(`/api/song/thumbnail/${id}.jpg`));
    });
    return await promise;
    /* let file:{[id:string]:{url:string}} = {};

    const exists = await fs.stat(path).then(()=>{return true}).catch(()=>{return false});
    if (exists) {
        file = JSON.parse(await fs.readFile(path, {encoding:"utf-8"}));
        // console.log(file);
    } else {
        fs.appendFile(path, JSON.stringify({}));
    };
    canvas.createJPEGStream()
    const url = canvas.toDataURL("image/jpeg");
    file[id] = {url:url}
    fs.writeFile(path,JSON.stringify(file));
    return url; */
}
exports.default = voronoi;
