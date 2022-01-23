import React, {useEffect, useState} from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetch_object } from "../reducers/data"
import ObjectRelations, { RELATION_TYPE_MAPPING } from "./ObjectRelations";
import "./ObjectView.scss"


const TYPE_COLOR_MAPPING = {
    "shareholder": ["#777", "#ccc"],
    "radio": ["#986", "#dc9"],
    "online": ["#689", "#9cd"],
    "print": ["#698", "#9dc"],
    "tv": ["#965", "#da9"],
};

const TYPE_ICON_MAPPING = {
    "radio": "📻",
    "online": "🕸",
    "print": "🕮",
    "tv": "🖵",
};

const KEY_VALUE_MAPPING = {
    controlDate: "control date",
    accessibilityEmail: "email",
    accessibilityUrl: "url",
    description: "description",
    placeOfBusiness: "place of business",
    pseudoCompany: "pseudo company?",
    supplierConsortium: "supplier consortium?",
    rfFreePay: "free?",
    rfPublicPrivate: "public?",
    rfShoppingChannel: "shopping channel?",
    rfStatewide: "statewide?",
    languages: {title: "languages", func: v => v.map(l => l.name).join(", ")},
    rfStartDate: "start date",
    marketReach: {title: "market reach", func: v => `${v.toFixed(3)}%`},
    matchedNames: "matched names",
    onlineComments: "online comments",
    onlineAGOF: "online (AGOF)",
    onlineAsOfDateAGOF: "online since (AGOF)",
    onlineAsOfDateIVW: "online since (IVW)",
    onlineIVWPI: "online (IVWPI)",
    onlineOfferType: {title: "online offer type", func: v => v.name},
    onlineVisitsIVW: "online visits (IVW)",
    platformOperators: {
        title: "platform operators",
        func: v => v.map(o => `${o.name} (${o.distributionType.name})`).join(", ")
    },
    pressType: {title: "press type", func: v => v.name},
    pressAsOfDate: "press as of date",
    pressDistributionArea: "press distribution area",
    pressEditionsComments: "press editions comments",
    pressEditionsEpaper: "press editions ePaper",
    pressEditionsIVW: "press editions (IVW)?",
    pressEditionsSold: "press editions sold",
    pressKind: "press kind",
    pressMagazineType: {title: "press magazine type", func: v => v.name},
    pressPublishingIntervals: "press publising intervals",
    rfBroadcastStatus: {title: "broadcast status", func: v => v.name},
    rfCategory: {title: "category", func: v => v.name},
    rfDirector: "director",
    rfLicensed: "license date",
    rfLicenseFrom: "license from",
    rfLicenseUntil: "license until",
    rfParentalAdvisor: "parental advisor",
    rfRepresentative: "representative",
    rfSupervisingAuthority: {
        title: "supervising authority",
        func: v => v.fullName || v.name,
    },
    sharesInfo: "shares info",
    credits: "credits",
};


const ObjectView = ({squuid, select_squuid}) => {
    const dispatch = useDispatch();
    const
        object_map = useSelector(state => state.data.object_map),
        graph = useSelector(state => state.data.graph);

    useEffect(() => {
        if (squuid && graph && graph.node_map[squuid] && !object_map[squuid]) {
            const type = graph.node_map[squuid].type;
            dispatch(fetch_object(type === "shareholder" ? "shareholders" : "media", squuid));
        }
    }, [squuid, graph, object_map]);

    let content = null;

    let obj = object_map[squuid];
    if (!squuid || !obj) {
        content = null;
    }
    else if (obj.loading) {
        content = (
            <div>
                LOADING {squuid}...
            </div>
        )
    }
    else if (obj.error) {
        content = (
            <div className={"error"}>
                ERROR: {obj.error}...
            </div>
        )
    }
    else {
        let data = obj.data;
        // ignore validation errors in api response
        if (data.errors && data.value)
            data = data.value;
        content = (
            <ObjectDetails data={data} select_squuid={select_squuid}/>
        );
    }

    return (
        <div className={"object-wrapper"}>
            {content}
        </div>
    )
};

export default ObjectView


const ObjectDetails = ({data, select_squuid}) => {

    const [relation_levels, set_relation_levels] = useState({});

    let kek_url = null;
    let icon = "";
    let type;
    if (!data.type) {
        type = "shareholder";
        icon = data.naturalPerson ? "😃" : "🏛";
        kek_url = `https://www.kek-online.de/medienkonzentration/mediendatenbank#/profile/shareholder/${data.squuid}`;
    } else {
        type = data.type;
        icon = TYPE_ICON_MAPPING[data.type] || "❓";
        kek_url = `https://www.kek-online.de/medienkonzentration/mediendatenbank#/profile/media/${data.squuid}`;
    }
    const color = TYPE_COLOR_MAPPING[type][1];

    const _render_address = () => {
        let address = [];
        if (data.corporationName)
            address.push(data.corporationName);
        if (data.co)
            address.push(data.co);
        if (data.rfAddress) {
            address = address.concat(data.rfAddress.split("\n"));
        } else {
            if (data.street) {
                let line = data.street;
                if (data.streetNumber)
                    line = `${line} ${data.streetNumber}`;
                address.push(line);
            }
            if (data.city) {
                let line = data.city;
                if (data.zipcode)
                    line = `${data.zipcode} ${line}`;
                address.push(line);
            }
        }
        if (address.length) {
            return (
                <div className={"address"}>
                    {address.map((line, i) => <div key={i}>{line}</div>)}
                </div>
            )
        } else
            return null;
    };

    const _render_values = () => {
        const values = [];
        for (const key of Object.keys(KEY_VALUE_MAPPING)) {
            if (data[key] !== undefined) {
                let value = data[key],
                    desc = KEY_VALUE_MAPPING[key];

                if (typeof value === "boolean")
                    value = value ? "yes" : "no";

                if (typeof desc === "string")
                    values.push([desc, value]);
                else
                    values.push([desc.title, desc.func(value)]);
            }
        }
        return (
            <div className={"grid-x key-values"}>
                {values.map((value, i) => (
                    <div>
                        <div className={"key"}>{value[0]}</div>
                        <div className={"value"}>{value[1]}</div>
                    </div>
                ))}
            </div>
        )
    };

    return (
        <div>
            <div className={"grid-x nowrap heading-wrapper"}>
                <div className={"grow heading"}>
                    <span style={{color}}>{icon}</span> {data.name || "-no name"}
                </div>
                <div>
                    <a href={kek_url} target={"_blank"}>↗ kek-online.de</a>
                </div>
            </div>

            <div className={"object"}>

                {_render_address()}

                {Object.keys(RELATION_TYPE_MAPPING).map((relation_type, i) => (
                    <ObjectRelations
                        key={relation_type}
                        object_data={data}
                        relation_type={relation_type}
                        level={relation_levels[relation_type] || 1}
                        select_squuid={select_squuid}
                        set_relation_level={level => {
                            set_relation_levels({
                                ...relation_levels,
                                [relation_type]: level,
                            });
                        }}
                    />
                ))}

                {_render_values()}

                {/*<pre>{JSON.stringify(data, null, 2)}</pre>*/}
            </div>
        </div>
    )
};
