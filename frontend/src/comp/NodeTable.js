import {useDispatch, useSelector} from "react-redux";
import React from "react";
import Table from "./Table";
import {select_squuid} from "../reducers/data";


const COLUMNS = [
    {data: "type", title: "type"},
    {data: "label", title: "name"},
    {data: "state", title: "state"},
    {data: "in_degree", title: "num in", align: "right"},
    {data: "out_degree", title: "num out", align: "right"},
    {data: "num_medias", title: "num medias", align: "right"},
    {data: "num_medias_weighted", title: "num medias (weighted)", align: "right"},
];


const NodeTable = () => {
    const dispatch = useDispatch();
    const
        {graph, rows, selected} = useSelector(state => state.data)
    ;

    if (!graph || graph.loading) {
        return (
            <div>LOADING...</div>
        );
    }

    if (graph.error) {
        return (
            <div className={"error"}>{graph.error}</div>
        );
    }

    return (
        <div>
            <Table
                columns={COLUMNS}
                rows={rows}
                defaultOrder={"-out_degree"}
                highlightRow={row => row.name === selected.squuid}
                onRowClick={row => dispatch(select_squuid(row.name))}
            />
        </div>
    );
};


export default NodeTable;
