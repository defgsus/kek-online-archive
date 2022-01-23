import React, {useEffect} from "react";
import { Route, Routes, useLocation } from 'react-router';
import { ReduxRouter, push } from '@lagunovsky/redux-react-router'
import ObjectView from "./ObjectView";
import { fetch_graph } from "../reducers/data";
import { useDispatch, useSelector } from "react-redux";
import NodeTable from "./NodeTable";
import Search from "./Search";
import ErrorBoundary from "./ErrorBoundary";
import { history, store } from "../store";
import Header from "./Header";
import NetworkView from "./NetworkView";


const App = () => {
    const
        dispatch = useDispatch(),
        {graph} = useSelector(state => state.data);

    useEffect(() => {
        if (!graph)
            dispatch(fetch_graph());
    }, [graph]);

    const select_squuid = squuid => {
        dispatch(push(`/object/${squuid}`));
    };
    return (
        <ReduxRouter history={history} store={store}>
            <Routes>
                <Route exact path={"/"} element={
                    <ErrorBoundary>
                        <Header/>
                        <Search/>
                        <NodeTable
                            select_squuid={select_squuid}
                        />
                    </ErrorBoundary>
                }/>

                <Route exact path={"/network"} element={
                    <ErrorBoundary>
                        <Header/>
                        <NetworkView/>
                    </ErrorBoundary>
                }/>

                <Route exact path={"/object/:squuid"} element={
                    <ErrorBoundary>
                        <ObjectView
                            select_squuid={select_squuid}
                        />
                    </ErrorBoundary>
                }/>

                <Route element={
                    <div>404</div>
                }/>
            </Routes>
        </ReduxRouter>
    );
};

export default App
