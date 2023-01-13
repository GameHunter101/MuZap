import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import songService, { ConvertSong, SearchResult } from "./songService";

interface SongState {
    songName: string,
    url: string,
    thumbnail: string,
    nextSong: string,
    nextUrl: string,
    nextThumbnail: string,
    searchResults?: SearchResult,
    isError: boolean,
    isSuccess: boolean,
    isLoading: boolean,
    message: string
}

const initialState: SongState = {
    songName: "",
    url: "",
    thumbnail: "",
    nextSong: "",
    nextUrl: "",
    nextThumbnail: "",
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: ""
}

export const searchYtSp = createAsyncThunk("song/search", async (query: string, thunkAPI) => {
    try {
        return await songService.searchYtSp(query);
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const retrieveSong = createAsyncThunk("song/retrieve",async(query:string,thunkAPI)=>{
    try {
        return await songService.convertSong(query);
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const songSlice = createSlice({
    name: "song",
    initialState,
    reducers: {
        setPlayingSong: (state, action: PayloadAction<{ songName: string, url: string, thumbnail: string }>) => {
            state.songName = action.payload.songName;
            state.url = action.payload.url;
            state.thumbnail = action.payload.thumbnail;
        },
        setNextSong: (state, action: PayloadAction<{ nextSong: string, nextUrl: string, nextThumbnail: string }>) => {
            state.nextSong = action.payload.nextSong;
            state.nextUrl = action.payload.nextUrl;
            state.nextThumbnail = action.payload.nextThumbnail;
        },
        reset: (state) => initialState
    },
    extraReducers: (builder) => {
        builder
            .addCase(searchYtSp.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(searchYtSp.fulfilled, (state, action:PayloadAction<SearchResult>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.searchResults = action.payload;
            })
            .addCase(searchYtSp.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(retrieveSong.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(retrieveSong.fulfilled, (state, action:PayloadAction<ConvertSong>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.songName = action.payload.song;
                state.url = action.payload.url;
                state.thumbnail = action.payload.thumbnail;
            })
            .addCase(retrieveSong.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
    },
});

export const { setPlayingSong, setNextSong } = songSlice.actions;

export default songSlice.reducer;