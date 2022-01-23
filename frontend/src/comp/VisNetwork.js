import {Network} from "vis-network";
import {useEffect, useRef, useState} from "react";
import "./VisNetwork.scss"


const VisNetwork = ({network_data, on_node_click}) => {

    const visJsRef = useRef(null);
    const [network, set_network] = useState(null);

    useEffect(() => {
        if (visJsRef.current) {
            const network = new Network(
                visJsRef.current,
                network_data,
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
                        enabled: true,
                    }
                }
            );
            set_network(network);
        }

        return () => {
            if (network)
                network.destroy();
        }
    }, [visJsRef, set_network]);

    useEffect(() => {
        if (network) {
            console.log("SET NETWORK DATA", network_data.nodes.length, network_data.edges.length);
            network.setData(network_data);
        }
    }, [network, network_data]);

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
