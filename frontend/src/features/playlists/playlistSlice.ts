import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import playlistService, { Playlist, PlaylistElement } from "./playlistService";

interface InitialState {
	playlists: Playlist[],
	playlistData: PlaylistElement[],
	currentPlaylist?: Playlist,
	isError: boolean,
	isSuccess: boolean,
	isLoading: boolean,
	message: string
}

const initialState: InitialState = {
	playlists: [],
	playlistData: [],
	isError: false,
	isSuccess: false,
	isLoading: false,
	message: "",
}

// Create new playlist
export const createPlaylist = createAsyncThunk("playlist/create", async (playlistData: string, thunkAPI) => {
	try {
		const token = (thunkAPI.getState() as RootState).auth.user?.token as string;
		return await playlistService.createPlaylist(playlistData, token);
	} catch (error: any) {
		const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
		return thunkAPI.rejectWithValue(message);
	}
});

// Delete user playlist
export const deletePlaylist = createAsyncThunk("playlist/delete", async (id: string, thunkAPI) => {
	try {
		const token = (thunkAPI.getState() as RootState).auth.user?.token as string;
		return await playlistService.deletePlaylist(id, token);
	} catch (error: any) {
		const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
		return thunkAPI.rejectWithValue(message);
	}
});

// Get user playlists
export const getPlaylists = createAsyncThunk("playlists/getAll", async (_, thunkAPI) => {
	try {
		const token = (thunkAPI.getState() as RootState).auth.user?.token as string;
		return await playlistService.getPlaylists(token);
	} catch (error: any) {
		const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
		return thunkAPI.rejectWithValue(message);
	}
})

// Get playlist data
export const getData = createAsyncThunk("playlists/getOne", async (id: string, thunkAPI) => {
	try {
		interface data {
			playlistInfo: Playlist;
			playlistContents: { [song: string]: PlaylistElement; };
		}
		type messageType = data | { message: string, stack: string }

		const isData = (data: messageType): data is data => { if ((data as data).playlistInfo) { return true } return false };

		const token = (thunkAPI.getState() as RootState).auth.user?.token as string;
		const result = await playlistService.getPlaylistData(id, token);
		if (isData(result)) {
			const parsedResult: { playlistInfo: Playlist, playlistContents: PlaylistElement[] } = { playlistInfo: result.playlistInfo, playlistContents: Object.values(result.playlistContents) }
			const users = await playlistService.getPlaylistUsers(parsedResult.playlistInfo.users,token);
			parsedResult.playlistInfo.users = users;
			return parsedResult;
		}
		console.log("ERROR");
		return thunkAPI.rejectWithValue(result.message);
	} catch (error: any) {
		console.log("ERROR");
		const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
		return thunkAPI.rejectWithValue(message);
	}
});

// Update playlist data
export const updatePlaylist = createAsyncThunk("playlists/update",async(update:{id:string,data:FormData},thunkAPI)=>{
	try {
		const token = (thunkAPI.getState() as RootState).auth.user?.token as string;
		const result = await playlistService.updatePlaylist(update.id,update.data,token);
		const users = await playlistService.getPlaylistUsers(result.playlistInfo.users,token);
		result.playlistInfo.users = users;
		return result;
	} catch (error: any) {
		const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
		return thunkAPI.rejectWithValue(message);
	}
});

// Create new playlist
export const convertPlaylist = createAsyncThunk("playlist/convert", async (playlistLink: string, thunkAPI) => {
	try {
		const token = (thunkAPI.getState() as RootState).auth.user?.token as string;
		return await playlistService.convertPlaylist(playlistLink, token);
	} catch (error: any) {
		const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
		return thunkAPI.rejectWithValue(message);
	}
});

export const playlistSlice = createSlice({
	name: "playlist",
	initialState,
	reducers: {
		reset: (state) => initialState
	},
	extraReducers: (builder) => {
		builder
			.addCase(createPlaylist.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(createPlaylist.fulfilled, (state, action: PayloadAction<Playlist>) => {
				state.isLoading = false;
				state.isSuccess = true;
				state.playlists.push(action.payload);
			})
			.addCase(createPlaylist.rejected, (state, action) => {
				state.isLoading = false;
				state.isError = true;
				state.message = action.payload as string
			})
			.addCase(getPlaylists.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(getPlaylists.fulfilled, (state, action: PayloadAction<Playlist[]>) => {
				state.isLoading = false;
				state.isSuccess = true;
				state.playlists = action.payload;
			})
			.addCase(getPlaylists.rejected, (state, action) => {
				state.isLoading = false;
				state.isError = true;
				state.message = action.payload as string;
			})
			.addCase(deletePlaylist.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(deletePlaylist.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
				state.isLoading = false;
				state.isSuccess = true;
				state.playlists = state.playlists.filter(playlist => playlist._id !== action.payload.id);
			})
			.addCase(deletePlaylist.rejected, (state, action) => {
				state.isLoading = false;
				state.isError = true;
				state.message = action.payload as string;
			})
			.addCase(getData.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(getData.fulfilled, (state, action: PayloadAction<{ playlistInfo: Playlist, playlistContents: PlaylistElement[] }>) => {
				state.isLoading = false;
				state.isSuccess = true;
				state.playlistData = action.payload.playlistContents;
				state.currentPlaylist = action.payload.playlistInfo;
			})
			.addCase(getData.rejected, (state, action) => {
				state.isLoading = false;
				state.isError = true;
				state.message = action.payload as string;
			})
			.addCase(updatePlaylist.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(updatePlaylist.fulfilled, (state, action: PayloadAction<{playlistInfo: Playlist}>) => {
				state.isLoading = false;
				state.isSuccess = true;
				state.currentPlaylist = action.payload.playlistInfo;
			})
			.addCase(updatePlaylist.rejected, (state, action) => {
				state.isLoading = false;
				state.isError = true;
				state.message = action.payload as string;
			})
			.addCase(convertPlaylist.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(convertPlaylist.fulfilled, (state, action: PayloadAction<Playlist>) => {
				state.isLoading = false;
				state.isSuccess = true;
				state.playlists.push(action.payload);
			})
			.addCase(convertPlaylist.rejected, (state, action) => {
				state.isLoading = false;
				state.isError = true;
				state.message = action.payload as string
			})
	},
})

export const { reset } = playlistSlice.actions;
export default playlistSlice.reducer;