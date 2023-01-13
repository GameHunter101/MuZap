import { createSlice } from "@reduxjs/toolkit";

interface deleting {
    deleting: boolean
};

const initialState: deleting = {
    deleting: false
};

export const deleteSlice = createSlice({
    name: "delete",
    initialState,
    reducers: {
        toggle: (state) => {return {...state, deleting:!state.deleting}}
    }
})

export const { toggle } = deleteSlice.actions;
export default deleteSlice.reducer;