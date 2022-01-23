import { createSlice, PayloadAction } from '@reduxjs/toolkit';


const initialState = {
    relation_levels: {},
    relation_thresholds: {},
    show_json: false,
};


export const objectViewSlice = createSlice({
    name: 'object_view',
    initialState,
    reducers: {
        set_relation_level: (state, action) => {
            state.relation_levels[action.payload.relation_type] = action.payload.level;
        },
        set_relation_threshold: (state, action) => {
            state.relation_thresholds[action.payload.relation_type] = action.payload.threshold;
        },

        set_show_json: (state, action) => {
            state.show_json = action.payload;
        }
    },
});

const { actions, reducer } = objectViewSlice;

export const { set_relation_level, set_show_json, set_relation_threshold } = actions;

export default reducer;
