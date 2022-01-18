import {useDispatch, useSelector} from "react-redux";
import React from "react";
import { set_query } from "../reducers/data"


const Search = () => {
    const dispatch = useDispatch();
    const query = useSelector(state => state.data.filter.query);

    return (
        <div>
            <input
                type={"text"}
                value={query}
                onInput={(e) => dispatch(set_query(e.target.value))}
            />
        </div>
    );
};


export default Search;
