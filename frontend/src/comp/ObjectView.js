import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {useLocation, useMatch} from "react-router";
import { fetch_object } from "../reducers/data"
import { set_show_json, set_relation_level, set_relation_threshold } from "../reducers/object_view";
import ObjectRelations, { RELATION_TYPE_MAPPING } from "./ObjectRelations";
import { TYPE_COLOR_MAPPING, TYPE_ICON_MAPPING } from "../conf";
import Header from "./Header";
import "./ObjectView.scss"



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


const ObjectView = ({select_squuid}) => {
    const
        dispatch = useDispatch(),
        object_map = useSelector(state => state.data.object_map),
        graph = useSelector(state => state.data.graph),
        //location = useLocation(),
        match = useMatch("/object/:squuid"),
        squuid = match.params.squuid;

    useEffect(() => {
        if (squuid && graph && graph.node_map && graph.node_map[squuid] && !object_map[squuid]) {
            const type = graph.node_map[squuid].type;
            dispatch(fetch_object(type === "shareholder" ? "shareholders" : "media", squuid));
        }
    }, [squuid, graph, object_map]);

    let content = null;

    let obj = object_map[squuid];
    if (!squuid) {
        content = null;
    }
    else if (!graph || !graph.node_map || !obj || obj.loading) {
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
            <ObjectDetails detailData={data} select_squuid={select_squuid}/>
        );
    }

    return (
        <>
            <Header/>
            <div className={"object-wrapper"}>
                {content}
            </div>
        </>
    )
};

export default ObjectView


const ObjectDetails = ({detailData, select_squuid}) => {

    const
        dispatch = useDispatch(),
        {relation_levels, show_json,
         relation_thresholds} = useSelector(state => state.object_view);

    let kek_url = null;
    let icon = "";
    let type;
    if (!detailData.type) {
        type = "shareholder";
        icon = detailData.naturalPerson ? "😃" : "🏛";
        kek_url = `https://www.kek-online.de/medienkonzentration/mediendatenbank#/profile/shareholder/${detailData.squuid}`;
    } else {
        type = detailData.type;
        icon = TYPE_ICON_MAPPING[detailData.type] || "❓";
        kek_url = `https://www.kek-online.de/medienkonzentration/mediendatenbank#/profile/media/${detailData.squuid}`;
    }
    const color = TYPE_COLOR_MAPPING[type][1];

    const _render_address = () => {
        let address = [];
        if (detailData.corporationName)
            address.push(detailData.corporationName);
        if (detailData.co)
            address.push(detailData.co);
        if (detailData.rfAddress) {
            address = address.concat(detailData.rfAddress.split("\n"));
        } else {
            if (detailData.street) {
                let line = detailData.street;
                if (detailData.streetNumber)
                    line = `${line} ${detailData.streetNumber}`;
                address.push(line);
            }
            if (detailData.city) {
                let line = detailData.city;
                if (detailData.zipcode)
                    line = `${detailData.zipcode} ${line}`;
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
            if (detailData[key] !== undefined) {
                let value = detailData[key],
                    desc = KEY_VALUE_MAPPING[key];

                if (typeof value === "boolean")
                    value = value ? "yes" : "no";

                if (typeof desc === "string")
                    values.push([desc, value]);
                else
                    values.push([desc.title, desc.func(value)]);
            }
        }
        if (!values.length)
            return null;

        return (
            <>
                <div className={"sub-heading"}>data</div>
                <div className={"grid-x key-values"}>
                    {values.map((value, i) => (
                        <div key={i}>
                            <div className={"key"}>{value[0]}</div>
                            <div className={"value"}>{value[1]}</div>
                        </div>
                    ))}
                </div>
            </>
        )
    };

    return (
        <div>
            <div className={"grid-x nowrap heading-wrapper"}>
                <div className={"grow heading"}>
                    <span style={{color}}>{icon}</span> {detailData.name || "-no name"}
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
                        object_data={detailData}
                        relation_type={relation_type}
                        level={relation_levels[relation_type] || 1}
                        threshold={relation_thresholds[relation_type] || 0}
                        select_squuid={select_squuid}
                        set_relation_level={
                            level => dispatch(set_relation_level({relation_type, level}))
                        }
                        set_relation_threshold={
                            threshold => dispatch(set_relation_threshold({relation_type, threshold}))
                        }
                    />
                ))}

                {_render_values()}

                <label>
                    <input
                        type={"checkbox"}
                        checked={show_json}
                        onChange={() => dispatch(set_show_json(!show_json))}
                    /> <code>json data</code>
                </label>

                {!show_json ? null : <pre>{JSON.stringify(detailData, null, 2)}</pre>}
            </div>
        </div>
    )
};
