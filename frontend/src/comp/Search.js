import {useDispatch, useSelector} from "react-redux";
import React from "react";
import { set_query } from "../reducers/data";
import "./Search.scss";


const Search = () => {
    const dispatch = useDispatch();
    const query = useSelector(state => state.data.filter.query);

    return (
        <div className={"search-area"}>
            🔍 <input
                type={"text"}
                name={"query"}
                value={query}
                onInput={(e) => dispatch(set_query(e.target.value))}
            />
        </div>
    );
};


export default Search;
