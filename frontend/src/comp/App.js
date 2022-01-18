import React, {useEffect} from "react";
import ObjectView from "./ObjectView";
import {fetch_graph} from "../reducers/data";
import {useDispatch, useSelector} from "react-redux";
import NodeTable from "./NodeTable";
import Search from "./Search";


const App = () => {
    const dispatch = useDispatch();
    const
        {graph, selected} = useSelector(state => state.data)
    ;

    useEffect(() => {
        if (!graph)
            dispatch(fetch_graph());
    }, [graph]);

    return (
        <div>
            <div>What the heck</div>
            <Search/>
            <NodeTable/>
            <ObjectView squuid={selected.squuid} type={selected.type}/>
        </div>
    );
};

export default App
