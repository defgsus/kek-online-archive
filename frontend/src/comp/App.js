import React, {useEffect} from "react";
import ObjectView from "./ObjectView";
import {fetch_graph, select_squuid} from "../reducers/data";
import {useDispatch, useSelector} from "react-redux";
import NodeTable from "./NodeTable";
import Search from "./Search";
import ErrorBoundary from "./ErrorBoundary";


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
            <ErrorBoundary>
                <ObjectView
                    squuid={selected.squuid}
                    select_squuid={squuid => dispatch(select_squuid(squuid))}
                />
            </ErrorBoundary>

            <ErrorBoundary>
                <Search/>
                <NodeTable/>
            </ErrorBoundary>
        </div>
    );
};

export default App
