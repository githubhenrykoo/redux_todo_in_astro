import { createSlice } from "@reduxjs/toolkit";
import layoutConfig from "./panellayoutSlice.json";

const initialState = {
  panels: layoutConfig["todo_layout"],
};

const panellayoutSlice = createSlice({
  name: "panellayout",
  initialState,
  reducers: {},
});

export default panellayoutSlice.reducer;
