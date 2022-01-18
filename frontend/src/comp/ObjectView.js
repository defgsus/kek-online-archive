import React, { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetch_object } from "../reducers/data"


const ObjectView = ({squuid, type}) => {
    const dispatch = useDispatch();
    const
        object_map = useSelector(state => state.data.object_map)
    ;

    useEffect(() => {
        if (squuid && !object_map[squuid])
            dispatch(fetch_object(type === "shareholder" ? "shareholders" : "media", squuid));
    }, [squuid]);

    return (
        <div className={"object"}>
            <h2>{squuid}</h2>
            <pre>{JSON.stringify(object_map[squuid], null, 2)}</pre>
        </div>
    )
};

export default ObjectView

