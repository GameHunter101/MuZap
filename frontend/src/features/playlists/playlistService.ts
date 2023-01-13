import axios from "axios";
import qs from "qs";

export interface Playlist {
    users: string[],
    name: string,
    public: boolean,
    likes: number,
    _id: string,
    createdAt: string,
    updatedAt: string,
    __v: number,
    thumbnail: string
}

export interface PlaylistElement {
    song: string,
    url: string,
    thumbnail: string,
    searchTerm: string
}

const API_URL = "/api/playlist";

// Create a new playlist
const createPlaylist = async (playlistName: string, token: string) => {
    const options = {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        data: qs.stringify({}),
        url: API_URL + "/" + playlistName,
    };
    const response = await axios(options);
    return response.data as Playlist;
}

// Get user playlists
const getPlaylists = async (token: string) => {
    const options = {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        data: qs.stringify({}),
        url: API_URL,
    };
    const response = await axios(options);
    return response.data as Playlist[];
}

// Delete user goal
const deletePlaylist = async (playlistId: string, token: string) => {
    const options = {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
        data: qs.stringify({}),
        url: API_URL + "/" + playlistId,
    };
    const response = await axios(options);
    return response.data as { "id": string };
}

// Get single playlist
const getPlaylistData = async (playlistId: string, token: string) => {
    const options = {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        data: qs.stringify({}),
        url: API_URL + "/modify/" + playlistId
    };
    const response = await axios(options);
    return response.data as ({ playlistInfo: Playlist, playlistContents: { [song: string]: PlaylistElement } }) | { message: string, stack: string };
}

// Get playlist users
const getPlaylistUsers = async (users: string[], token: string) => {

    let data = qs.stringify({ "users": JSON.stringify(users) });
    const options = {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        data,
        url: API_URL + "/convert/users"
    }
    const response = await axios(options);
    return response.data;
}

// Updated playlist metadata
const updatePlaylist = async (playlistId: string, data: FormData, token: string) => {
    const options = {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type":"multipart/form-data"},
        data,
        url: API_URL + "/modify/meta/" + playlistId,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    }
    const response = await axios(options);
    return response.data as {playlistInfo:Playlist};
}

// Convert playlist
const convertPlaylist = async (playlistLink:string,token:string)=>{
    const options = {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`},
        data: qs.stringify({}),
        url: API_URL+"/convert/"+encodeURIComponent(playlistLink)
    };
    const response = await axios(options);
    return response.data as Playlist;
}

const playlistService = {
    createPlaylist,
    getPlaylists,
    deletePlaylist,
    getPlaylistData,
    getPlaylistUsers,
    updatePlaylist,
    convertPlaylist
}

export default playlistService;