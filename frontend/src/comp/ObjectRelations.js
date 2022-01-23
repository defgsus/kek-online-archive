import React, { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetch_object } from "../reducers/data"
import "./ObjectView.scss"

export const RELATION_TYPE_MAPPING = {
    "partners": {
        title: "complementary partners",
        array_name: "ownedBy",
        relation_name: "holder",
        filter: rel => !!rel.complementaryPartner,
    },
    "partners2": {
        title: "complementary partners",
        array_name: "owns",
        relation_name: "held",
        filter: rel => !!rel.complementaryPartner,
    },
    "owned_by": {
        title: "owned by",
        array_name: "ownedBy",
        relation_name: "holder",
        filter: rel => !rel.complementaryPartner,
    },
    "operated_by": {
        title: "operated by",
        array_name: "operatedBy",
        relation_name: "holder",
    },
    "owns": {
        title: "owns",
        array_name: "owns",
        relation_name: "held",
        filter: rel => !rel.complementaryPartner,
    },
    "operates": {
        title: "operates",
        array_name: "operates",
        relation_name: "held",
    },
};

const get_object_relations = ({
    object_data, relation_type, level, object_map, required_set,
    set_relation_level
}) => {
    const descriptor = RELATION_TYPE_MAPPING[relation_type];
    let relations = null;

    if (object_data[descriptor.array_name]) {
        let array = object_data[descriptor.array_name];

        if (descriptor.filter) {
            array = array.filter(descriptor.filter);
        }

        relations = array.map(rel => {
            const
                rel_squuid = rel[descriptor.relation_name].squuid,
                rel_data = {
                    squuid: rel_squuid,
                    name: rel[descriptor.relation_name].name,
                    shares: rel.capitalShares === undefined ? null : rel.capitalShares,
                };

            if (level > 1 && object_map) {
                if (!object_map[rel_squuid]) {
                    required_set.add(rel_squuid);
                }
                else if (object_map[rel_squuid].data) {
                    rel_data.relations = get_object_relations({
                        object_data: object_map[rel_squuid].data,
                        relation_type, object_map, required_set,
                        level: level - 1,
                    })
                }
            }

            return rel_data;
        })
    }

    if (!relations || !relations.length)
        return null;

    relations.sort((a, b) => a.name < b.name ? -1 : 1);
    relations.sort((a, b) => a.shares > b.shares ? -1 : 1);

    return relations;
};


const ObjectRelations = ({object_data, relation_type, select_squuid, level, set_relation_level}) => {
    if (relation_type === undefined)
        return null;

    const dispatch = useDispatch();
    const
        object_map = useSelector(state => state.data.object_map),
        graph = useSelector(state => state.data.graph),
        required_set = new Set(),
        relations = get_object_relations({
            object_data, relation_type, object_map, required_set,
            level,
        });

    // request the next objects in the relations
    useEffect(() => {
        if (relations && relations.length && required_set.size && graph) {
            for (const squuid of required_set) {
                if (graph.node_map[squuid] && !object_map[squuid]) {
                    const type = graph.node_map[squuid].type;
                    dispatch(fetch_object(type === "shareholder" ? "shareholders" : "media", squuid));
                }
            }
        }
    }, [graph, object_map, required_set, relations]);

    if (!relations || !relations.length)
        return null;

    const relations_rendered = new Set();
    return (
        <div className={"relations"}>
            <div className={"relation-name"}>
                {RELATION_TYPE_MAPPING[relation_type].title}
                <input
                    type={"number"}
                    value={level}
                    min={1}
                    title={"Change number of levels to display"}
                    onChange={e => set_relation_level(parseInt(e.target.value))}
                />
            </div>
            <ObjectRelationsList
                relations={relations}
                relations_rendered={relations_rendered}
                select_squuid={select_squuid}
            />
        </div>
    )
};

export default ObjectRelations;


const ObjectRelationsList = ({relations, select_squuid, relations_rendered}) => {
    return (
        <ul>
            {relations.map((rel, i) => {
                const content = (
                    <li key={i}>
                        {rel.shares !== null
                            ? <span className={"shares"}>{rel.shares}% </span>
                            : null
                        }
                        <span className={"object-link"} onClick={() => select_squuid(rel.squuid)}>{rel.name}</span>
                        {rel.relations
                            ? relations_rendered.has(rel.squuid)
                                ? <ul><li title={`relations of "${rel.name}" are already listed`}>...</li></ul>
                                : <ObjectRelationsList
                                    relations={rel.relations}
                                    relations_rendered={relations_rendered}
                                    select_squuid={select_squuid}
                                  />
                            : null
                        }
                    </li>
                );
                relations_rendered.add(rel.squuid);
                return content;
            })}
        </ul>
    );
};
