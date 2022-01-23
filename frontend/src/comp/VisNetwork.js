import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { useEffect, useRef, useState } from "react";


const VisNetwork = ({on_node_click}) => {

    const visJsRef = useRef(null);
    const [network, set_network] = useState(null);

    useEffect(() => {
        if (visJsRef.current) {
            visJsRef.current.append(global_network_element);
            set_network(global_network);
        }

        return () => {
            if (visJsRef.current) {
                visJsRef.current.removeChild(global_network_element)
            }
        }
    }, [visJsRef, set_network]);

    useEffect(() => {
        if (network) {
            const on_network_click = (event) => {
                if (event.nodes.length) {
                    const node_id = event.nodes[0];
                    on_node_click(node_id);
                }
            };
            network.off("click");
            network.on("click", on_network_click);
        }
    }, [network, on_node_click]);

    return (
        <div ref={visJsRef}/>
    );
};

export default VisNetwork;


const create_vis_network = (element, data) => {
    return new Network(
        element,
        data,
        {
            autoResize: true,
            width: "100%",
            height: "800px",
            layout: {
                improvedLayout: true,
                randomSeed: 23,
            },
            nodes: {
                shape: "dot",
                font: {
                    color: "#ccc",
                }
                //widthConstraint: {maximum: 25},
                //heightConstraint: {maximum: 25},
            },
            edges: {
                arrows: "to",
                arrowStrikethrough: false,
                scaling: {
                    min: 2,
                    max: 10,
                }
            },
            physics: {
                barnesHut: {
                    //springLength: 200,
                },
                stabilization: {
                    iterations: 300,
                }
            }
        }
    );
};

const
    global_network_element = document.createElement("div"),
    global_network_data = {
        nodes: new DataSet(),
        edges: new DataSet(),
        // fast memory to avoid duplicate nodes or edges
        existing_nodes: new Set(),
        existing_edges: {},
    },
    global_network = create_vis_network(global_network_element, global_network_data);


const clear_network_data = () => {
    global_network_data.edges.clear();
    global_network_data.nodes.clear();
    global_network_data.existing_nodes = new Set();
    global_network_data.existing_edges = {};
};

const add_network_data = (nodes, edges, selection=null) => {
    setTimeout(() => {
        for (const node of nodes) {
            if (!global_network_data.existing_nodes.has(node.id)) {
                global_network_data.existing_nodes.add(node.id);
                global_network_data.nodes.add(node);
            }
        }
        for (const edge of edges) {
            if (!global_network_data.existing_edges[edge.from])
                global_network_data.existing_edges[edge.from] = new Set();

            if (!global_network_data.existing_edges[edge.from].has(edge.to)) {
                global_network_data.existing_edges[edge.from].add(edge.to);
                global_network_data.edges.add(edge);
            }
        }
        if (selection) {
            global_network.setSelection(selection);
        }
    }, 100);
};

const set_network_selection = (nodes) => {
    global_network.setSelection(nodes);
};

export { clear_network_data, add_network_data, set_network_selection };

window.network_data = global_network_data;