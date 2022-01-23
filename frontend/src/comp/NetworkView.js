import Search from "./Search";
import NodeTable from "./NodeTable";
import VisNetwork, { clear_network_data, add_network_data } from "./VisNetwork";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { TYPE_COLOR_MAPPING } from "../conf";
import "./NetworkView.scss"


const add_kek_network_data = (graph, nodes, edges, selection=null) => {
    nodes = [...nodes];

    for (const edge of edges) {
        for (const node_id of [edge.from, edge.to]) {
            const
                node_squuid = graph.node_id_to_squuid[node_id],
                node = to_vis_node(graph.node_map[node_squuid]);
            nodes.push(node);
        }
    }
    add_network_data(nodes, edges, selection);
};

const expand_nodes = (graph, squuid, mode) => {
    if (!graph.node_map)
        return;
    const nodes = traverse_nodes(graph, squuid, mode);
    let edges = [];
    for (const node of nodes) {
        edges = edges.concat(to_vis_edges(node));
    }
    add_kek_network_data(
        graph,
        nodes.map(to_vis_node),
        edges,
    );
};

const NetworkView = () => {
    const {graph} = useSelector(state => state.data);
    const [selected_squuid, set_selected_squuid] = useState(null);

    const select_squuid = squuid => {
        set_selected_squuid(squuid);
        if (graph && graph.node_map) {
            const
                edges = to_vis_edges(graph.node_map[squuid]),
                nodes = [to_vis_node(graph.node_map[squuid])];

            add_kek_network_data(graph, nodes, edges, {nodes: [nodes[0].id]});
        }
    };

    const on_node_click = (node_id) => {
        if (graph && graph.node_id_to_squuid)
            select_squuid(graph.node_id_to_squuid[node_id]);
    };

    return (
        <div className={"network-view"}>
            <div className={"grid-x nowrap"}>
                 <div className={"grow"}>
                    <VisNetwork
                        on_node_click={on_node_click}
                    />
                 </div>
                <div className={"panel"}>
                    <button
                        onClick={() => expand_nodes(graph, selected_squuid, "up")}
                    >expand up</button>
                    <button
                        onClick={() => expand_nodes(graph, selected_squuid, "down")}
                    >expand down</button>
                    <hr/>
                    <button onClick={() => clear_network_data()}>clear</button>
                </div>
            </div>
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

const traverse_nodes = (graph, start_squuid, direction, visited=null) => {
    visited = visited || new Set();
    const
        go_up = direction === "up" || direction === "both",
        go_down = direction === "down" || direction === "both",
        todo = new Set(),
        ret_nodes = [];
    todo.add(start_squuid);

    while (todo.size) {
        const
            squuid = todo.keys().next().value,
            node = graph.node_map[squuid];
        todo.delete(squuid);

        if (!visited.has(squuid))
            ret_nodes.push(node);
        visited.add(squuid);

        if (go_up)
            for (const adj of node.nodes_in) {
                const adj_squuid = graph.node_id_to_squuid[adj.id];
                if (!visited.has(adj_squuid))
                    todo.add(adj_squuid);
            }
        if (go_down)
            for (const adj of node.nodes_out) {
                const adj_squuid = graph.node_id_to_squuid[adj.id];
                if (!visited.has(adj_squuid))
                    todo.add(adj_squuid);
            }
    }
    return ret_nodes;
}