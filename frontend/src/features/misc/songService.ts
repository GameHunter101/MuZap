import axios from "axios";
import qs from "qs";

export interface SearchResult {
	searchQuery: string,
	youtube: [[string,string],[string,string]][],
	spotify: [[string,string[]],[string,string]][]
};

export interface ConvertSong {
	song: string,
	url: string,
	thumbnail: string,
	searchTerm: string
}

const API_URL = "/api/song";

const searchYtSp = async (query: string) => {
	const config = {
		method: "GET",
		url: API_URL + "/search/" + encodeURIComponent(query),
		headers: {}
	};

	const response = await axios(config);
	return response.data as SearchResult;
};

const convertSong = async(query:string)=>{
	const config = {
		method: "GET",
		url: API_URL +"/"+ encodeURIComponent(query),
		headers: {}
	};
	const response = await axios(config);
	return response.data as ConvertSong;
}

const songService = {
	searchYtSp,
	convertSong
};

export default songService;