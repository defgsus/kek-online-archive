import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import vis from "vis";


const initialState = {
    graph: null,
    object_map: {},
    filter: {
        query: "",
    },
    rows: [],
    selected: {
        squuid: null,
        type: null,
    },
};

export const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        graph_started: (state, action) => {
            state.graph = {
                loading: true
            };
        },
        graph_failed: (state, action) => {
            state.graph = {
                failed: true,
                error: action.payload.error,
            };
        },
        graph_finished: (state, action) => {
            state.graph = action.payload;
            state.rows = filter_rows(state.graph.vis.nodes, state.filter);
        },

        object_started: (state, action) => {
            state.object_map[action.payload.squuid] = {
                loading: true
            };
        },
        object_failed: (state, action) => {
            state.object_map[action.payload.squuid] = {
                failed: true,
                error: action.payload.error,
            };
        },
        object_finished: (state, action) => {
            state.object_map[action.payload.squuid] = {
                fetched: true,
                data: action.payload.data,
            };
        },

        set_query: (state, action) => {
            state.filter.query = action.payload;
            state.rows = filter_rows(state.graph.vis.nodes, state.filter);
        },

        select_squuid: (state, action) => {
            state.selected = {
                squuid: action.payload,
                type: state.graph.node_map[action.payload].type,
            };
        }
    },
});

const { actions, reducer } = dataSlice;

export const { set_query, select_squuid } = actions;

export default reducer;


const fetch_graph = () => async (dispatch) => {
    dispatch(actions.graph_started());
    fetch(`data/graph.dot`)
        .then(response => response.text())
        .then(dot_string => {
            try {
                return {dot_string, vis_data: vis.network.convertDot(dot_string)}
            }
            catch (e) {
                let msg = `${e}`;
                const match = msg.match(/.*\(char (\d+)\)/);
                if (match && match.length) {
                    const idx = Math.max(0, parseInt(match[1]) - 20);
                    msg += ` at: ${dot_string.slice(idx, idx + 100)}`
                }
                throw `error parsing dot: ${msg}`;
            }
        })
        .then(({dot_string, vis_data}) => {
            const graph = {
                fetched: true,
                dot: dot_string,
                // visjs compatible {nodes: [], edges: []}
                vis: vis_data,
                // squuid -> node
                node_map: {},
                // id -> squuid
                node_id_to_squuid: {},
            };
            for (const node of vis_data.nodes) {
                node.label_lower = node.label.toLowerCase();
                node.nodes_in = [];
                node.nodes_out = [];
                graph.node_map[node.name] = node;
                graph.node_id_to_squuid[node.id] = node.name;
            }

            for (const edge of vis_data.edges) {
                const
                    n1 = graph.node_map[graph.node_id_to_squuid[edge.from]],
                    n2 = graph.node_map[graph.node_id_to_squuid[edge.to]];
                n1.nodes_out.push({squuid: n2.squuid, id: n2.id, weight: edge.weight});
                n2.nodes_in.push({squuid: n1.squuid, id: n1.id, weight: edge.weight});
            }
            dispatch(actions.graph_finished(graph))
        })
        .catch(error => {
            console.log(error);
            dispatch(actions.graph_failed({error: error.message || error}))
        })
};


const fetch_object = (path, squuid) => async (dispatch) => {
    dispatch(actions.object_started({path, squuid}));
    fetch(`data/${path}/${squuid}.json`)
        .then(response => response.json())
        .then(data => dispatch(actions.object_finished({path, squuid, data: data})))
        .catch(error => dispatch(actions.object_failed({path, squuid, error: error.message || error})))
};

export { fetch_object, fetch_graph }


const filter_rows = (all_rows, filter) => {
    const search_query = filter.query.toLowerCase();
    const rows = [];
    for (const node of all_rows) {
        if (node["label_lower"].indexOf(search_query) < 0)
            continue;
        rows.push(node);
    }
    return rows;
};