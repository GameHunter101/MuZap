import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import authService, { User, UserData } from "./authService";

// Get user from localStorage

const user = JSON.parse(localStorage.getItem("user") as string) as User;

interface InitialState{
    user: User | null,
    isError: boolean,
    isSuccess: boolean,
    isLoading: boolean,
    message: string
}

const initialState:InitialState = {
    user: user ? user : null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: ""
};

// Register user
export const register = createAsyncThunk("auth/register", async (user:UserData, thunkAPI) => {
    try {
        return await authService.register(user);
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
    
});

// Login user
export const login = createAsyncThunk("auth/login", async (user:UserData, thunkAPI) => {
    try {
        return await authService.login(user)
    } catch (error: any) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const logout = createAsyncThunk("auth/logout",async()=>{
    authService.logout();
});

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isLoading = false;
            state.message = "";
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
                state.user = null;
            })
            .addCase(login.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
                state.user = null;
            })
            .addCase(logout.fulfilled,(state)=>{
                state.user = null;
            })
    }
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;