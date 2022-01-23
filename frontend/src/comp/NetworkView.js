import Search from "./Search";
import NodeTable from "./NodeTable";
import VisNetwork, { clear_network_data, add_network_data } from "./VisNetwork";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { TYPE_COLOR_MAPPING } from "../conf";


const NetworkView = () => {
    const {graph} = useSelector(state => state.data);
    const [selected_squuid, set_selected_squuid] = useState(null);

    const select_squuid = squuid => {
        set_selected_squuid(squuid);
        if (graph && graph.node_map) {
            const
                edges = to_vis_edges(graph.node_map[squuid]),
                nodes = [to_vis_node(graph.node_map[squuid])];

            for (const edge of edges) {
                for (const node_id of [edge.from, edge.to]) {
                    const
                        node_squuid = graph.node_id_to_squuid[node_id],
                        node = to_vis_node(graph.node_map[node_squuid]);
                    nodes.push(node);
                }
            }
            add_network_data(nodes, edges);
        }
    };

    const on_node_click = (node_id) => {
        if (graph && graph.node_id_to_squuid)
            select_squuid(graph.node_id_to_squuid[node_id]);
    };

    return (
        <div className={"network-view"}>
            <VisNetwork
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