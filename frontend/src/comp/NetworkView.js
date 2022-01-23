import Search from "./Search";
import NodeTable from "./NodeTable";
import VisNetwork from "./VisNetwork";
import { DataSet } from "vis-data";
import { useState } from "react";
import { useSelector } from "react-redux";
import { TYPE_COLOR_MAPPING } from "../conf";


const NetworkView = () => {
    const {graph} = useSelector(state => state.data);
    const [selected_squuid, set_selected_squuid] = useState(null);
    const [network_data, set_network_data] = useState({nodes: new DataSet(), edges: new DataSet()});
    const [existing_nodes, set_existing_nodes] = useState(new Set());
    const [existing_edges, set_existing_edges] = useState({});

    const select_squuid = squuid => {
        set_selected_squuid(squuid);
        if (graph && graph.node_map) {
            const
                edges = to_vis_edges(graph.node_map[squuid]),
                node = to_vis_node(graph.node_map[squuid]);

            if (!existing_nodes.has(squuid)) {
                existing_nodes.add(squuid);
                network_data.nodes.add(node);
            }

            for (const edge of edges) {
                for (const node_id of [edge.from, edge.to]) {
                    const node_squuid = graph.node_id_to_squuid[node_id];

                    if (!existing_nodes.has(node_squuid)) {
                        const node = to_vis_node(graph.node_map[node_squuid]);
                        existing_nodes.add(node_squuid);
                        network_data.nodes.add(node);
                    }

                    if (!existing_edges[edge.from])
                        existing_edges[edge.from] = new Set();
                }

                if (!existing_edges[edge.from].has(edge.to)) {
                    network_data.edges.add(edge);
                    existing_edges[edge.from].add(edge.to);
                }
            }
        }
    };

    const on_node_click = (node_id) => {
        if (graph && graph.node_id_to_squuid)
            select_squuid(graph.node_id_to_squuid[node_id]);
    };

    return (
        <div className={"network-view"}>
            <VisNetwork
                network_data={network_data}
                on_node_click={on_node_click}
            />
            <Search/>
            <NodeTable
                selected_squuid={selected_squuid}
                select_squuid={select_squuid}
            />
        </div>
    );
};

export default NetworkView;


const to_vis_node = (entry) => {
    return {
        id: entry.id,
        label: entry.label,
        group: entry.type,
        color: {
            background: TYPE_COLOR_MAPPING[entry.type][0],
            border: TYPE_COLOR_MAPPING[entry.type][1],
            highlight: TYPE_COLOR_MAPPING[entry.type][1],
        },
        value: entry.num_medias_weighted,
    };
};

const to_vis_edges = (entry) => {
    return entry.nodes_out.map(other => ({
        from: entry.id,
        to: other.id,
        value: other.weight,
        label: other.weight,
        color: TYPE_COLOR_MAPPING[entry.type][0],
    })).concat(entry.nodes_in.map(other => ({
        from: other.id,
        to: entry.id,
        value: other.weight,
        label: other.weight,
        color: TYPE_COLOR_MAPPING[other.type][0],
    })));
};