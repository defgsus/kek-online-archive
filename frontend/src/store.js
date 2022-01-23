import { createBrowserHistory } from 'history'
import { createRouterReducer, createRouterMiddleware } from '@lagunovsky/redux-react-router'
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import dataReducer from './reducers/data'
import objectReducer from "./reducers/object_view";

export const history = createBrowserHistory();


export const store = configureStore({
    reducer: {
        router: createRouterReducer(history),
        data: dataReducer,
        object_view: objectReducer,
    },
    middleware: getDefaultMiddleware => (
        getDefaultMiddleware({
            // this certainly takes too much time for the size of the state
            serializableCheck: false,
        }).concat([
            createRouterMiddleware(history),
        ])
    )
});

window.store = store;
