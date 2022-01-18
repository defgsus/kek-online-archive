window.addEventListener("DOMContentLoaded", () => {

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

    let raw_data = null;
    const node_map = {}; // by node-id
    const object_map = {}; // by squuid
    const squuid_to_node_id = {};
    let filtered_data = [];
    let table = null;
    let network = null;
    let network_data_sets = null;
    let selected_node_id = null;

    window.raw_data = raw_data;
    window.node_map = node_map;
    window.object_map = object_map;

    const $search_input = $('input[name="search"]');
    const $status = $("#status");

    function status_msg(msg) {
        $status.text(msg || null);
    }

    function get_data() {
        status_msg("fetching graph.dot...");
        fetch("data/graph.dot")
            .then(response => response.text())
            .then(dot_string => {
                status_msg("parsing graph.dot...");
                try {
                    return vis.network.convertDot(dot_string)
                }
                catch (e) {
                    let msg = `${e}`;
                    const match = msg.match(/.*\(char (\d+)\)/);
                    if (match && match.length) {
                        const idx = Math.max(0, parseInt(match[1]) - 20);
                        msg += ` at: ${dot_string.slice(idx, idx + 100)}`
                    }
                    throw `error parsing dot: ${msg}`;
                }
            })
            .then(store_raw_data)
            .then(filter_data)
            .then(update_table)
            .then(hook_controls)
            .then(() => status_msg())
            .catch(error => { status_msg(error); });
    }

    function fetch_object(node_id) {
        const
            node = node_map[node_id],
            path = node.type === "shareholder" ? "shareholders" : "media",
            squuid = node.name;
        return fetch(`data/${path}/${squuid}.json`)
            .then(response => response.json())
            .then(data => {
                if (data.ownedBy)
                    data.ownedBy.sort((a, b) => a.capitalShares > b.capitalShares ? -1 : 1);
                if (data.owns)
                    data.owns.sort((a, b) => a.capitalShares > b.capitalShares ? -1 : 1);
                object_map[squuid] = data;
            })
            .catch(error => { status_msg(`error fetching ${squuid}: ${error}`); });
    }

    function store_raw_data(data) {
        raw_data = data;
        for (const node of raw_data.nodes) {
            node.label_lower = node.label.toLowerCase();
            node.nodes_in = [];
            node.nodes_out = [];
            node_map[node.id] = node;
            squuid_to_node_id[node.name] = node.id;
        }
        for (const edge of raw_data.edges) {
            const
                n1 = node_map[edge.from],
                n2 = node_map[edge.to];
            n1.nodes_out.push({id: n2.id, weight: edge.weight});
            n2.nodes_in.push({id: n1.id, weight: edge.weight});
        }
    }

    function filter_data() {
        const search_term = $search_input.val().toLowerCase();
        filtered_data = [];
        for (const node of raw_data.nodes) {
            if (node["label_lower"].indexOf(search_term) < 0)
                continue;
            filtered_data.push(node);
        }
        console.log(`searchterm '${search_term}', filtered rows: ${filtered_data.length}`);
    }

    function update_table() {
        if (!table) {
            table = new Table(
                document.querySelector("#table"),
                [
                    {data: "type", title: "type"},
                    {data: "label", title: "name"},
                    {data: "state", title: "state"},
                    {data: "in_degree", title: "num in", align: "right"},
                    {data: "out_degree", title: "num out", align: "right"},
                    {data: "num_medias", title: "num medias", align: "right"},
                    {data: "num_medias_weighted", title: "num medias<br>(weighted)", align: "right"},
                ],
            );
            table.on_row_click = (row) => {
                selected_node_id = row.id;
                render_object_by_node_id(selected_node_id);
                update_network();
            }
        }
        table.order = "-out_degree";
        table.update_rows(filtered_data);
    }

    function update_network() {
        if (!network) {
            const container = document.getElementById("network");
            network = new vis.Network(
                container,
                {},
                {
                    autoResize: true,
                    width: "100%",
                    height: "600px",
                    layout: {
                        improvedLayout: true,
                        randomSeed: 23,
                    },
                    nodes: {
                        shape: "dot",
                        font: {
                            color: "#ccc",
                        }
                        //widthConstraint: {maximum: 25},
                        //heightConstraint: {maximum: 25},
                    },
                    edges: {
                        arrows: "to",
                        arrowStrikethrough: false,
                        scaling: {
                            min: 2,
                            max: 10,
                        }
                    },
                    physics: {
                        barnesHut: {
                            //springLength: 200,
                        },
                        stabilization: {
                            iterations: 300,
                        }
                    }
                },
            );
            network.on("click", on_network_click);
            network.on("stabilizationProgress", e => status_msg(
                `stabilizing network ${e.iterations}/${e.total}`
            ));
            network.on("stabilizationIterationsDone", e => status_msg());
            window.network = network;
        }

        build_network_nodes_and_edges(selected_node_id)
            .then(({nodes, edges}) => {
                if (!network_data_sets) {
                    network_data_sets = {
                        nodes: new vis.DataSet(nodes),
                        edges: new vis.DataSet(edges),
                    };
                    window.data_sets = network_data_sets;
                    network.setData(network_data_sets);
                } else {
                    const
                        existing_nodes = new Set(network_data_sets.nodes.map(n => n.id)),
                        existing_edges = {};
                    network_data_sets.edges.forEach(e => existing_edges[e.from]
                        ? existing_edges[e.from].add(e.to)
                        : existing_edges[e.from] = new Set([e.to])
                    );
                    for (const node of nodes)
                        if (!existing_nodes.has(node.id))
                            network_data_sets.nodes.add(node);
                    for (const edge of edges)
                        if (!(existing_edges[edge.from] && existing_edges[edge.from].has(edge.to)))
                            network_data_sets.edges.add(edge);
                }
                network.selectNodes([selected_node_id]);
            })
            .catch(error => { status_msg(error); });
    }

    function build_network_nodes_and_edges(start_node_id) {
        return new Promise((resolve, reject) => resolve())
            .then(() => { status_msg(`traversing graph...`); })
            .then(() => {
                const visited = new Set();
                let picked_nodes = traverse_nodes(start_node_id, "up", visited);
                picked_nodes = picked_nodes.concat(
                    traverse_nodes(start_node_id, "down", visited)
                );
                console.log(`traversed ${picked_nodes.length} nodes`);
                return picked_nodes;
            })
            //.then(nodes => { status_msg(`create ${nodes.length} nodes network...`); return nodes; })
            .then(picked_nodes => {
                const nodes = [], edges = [];
                if (selected_node_id) {
                    for (const entry of picked_nodes) {
                        nodes.push({
                            id: entry.id,
                            label: entry.label,
                            group: entry.type,
                            color: {
                                background: TYPE_COLOR_MAPPING[entry.type][0],
                                border: TYPE_COLOR_MAPPING[entry.type][1],
                                highlight: TYPE_COLOR_MAPPING[entry.type][1],
                            },
                            value: entry.num_medias_weighted,
                        });

                        for (const other of entry.nodes_out) {
                            edges.push({
                                from: entry.id,
                                to: other.id,
                                value: other.weight,
                                label: other.weight,
                                color: TYPE_COLOR_MAPPING[entry.type][0],
                            });
                        }
                    }
                }
                return {nodes, edges};
            });
        }

    function render_object(data) {
        const elements = [];

        let kek_url = null;
        let icon = "";
        if (!data.type) {  // shareholder
            icon = data.naturalPerson ? "😃" : "🏛";
            kek_url = `https://www.kek-online.de/medienkonzentration/mediendatenbank#/profile/shareholder/${data.squuid}`;
        } else {
            icon = TYPE_ICON_MAPPING[data.type] || "❓";
            kek_url = `https://www.kek-online.de/medienkonzentration/mediendatenbank#/profile/media/${data.squuid}`;
        }

        elements.push(
            $("<div>").addClass("grid-x").html([
                $("<div>").addClass("grow").html($("<div>").addClass("heading").text(`${icon} ${data.name || "-no name-"}`)),
                $("<div>").html(
                    $("<a>").attr("target", "_blank").attr("href", kek_url)
                        .text("↗ KEK")
                )
            ])
        );

        let address = [];
        if (data.corporationName)
            address.push(data.corporationName);
        if (data.co)
            address.push(data.co);
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
        if (data.rfAddress) {
            address = address.concat(data.rfAddress.split("\n"));
        }
        if (address.length) {
            elements.push($("<div>").addClass("address").html(address.join("<br>")));
        }

        function render_relations(label, data) {
            return $("<div>").addClass("relations").html([
                $("<span>").text(label),
                $("<ul>").html(
                    data.map(e => $("<li>")
                        .attr("data-squuid", e.squuid)
                        .addClass("squuid-link")
                        .text(e.label))
                )
            ]);
        }

        if (data.ownedBy) {
            const
                owned_by = data.ownedBy.filter(e => !e.complementaryPartner),
                partnerships = data.ownedBy.filter(e => e.complementaryPartner);

            if (owned_by.length) {
                elements.push(render_relations(
                    "owners",
                    owned_by.map(e => ({squuid: e.holder, label: `${e.capitalShares}% ${e.holder.name}`}))
                ));
            }
            if (partnerships.length) {
                elements.push(render_relations(
                    "partners",
                    partnerships.map(e => ({
                        squuid: e.holder.squuid,
                        label: `${e.capitalShares}% ${e.holder.name}`
                    }))
                ));
            }
        }
        if (data.owns) {
            const
                owns = data.owns.filter(e => !e.complementaryPartner),
                partnerships = data.owns.filter(e => e.complementaryPartner);

            if (owns.length) {
                elements.push(render_relations(
                    "owns",
                    owns.map(e => ({
                        squuid: e.held.squuid,
                        label: `${e.capitalShares}% ${e.held.name}`
                    }))
                ));
            }
            if (partnerships.length) {
                elements.push(render_relations(
                    "partners",
                    partnerships.map(e => ({
                        squuid: e.held.squuid,
                        label: `${e.capitalShares}% ${e.held.name}`
                    }))
                ));
            }
        }
        if (data.operatedBy) {
            elements.push(render_relations(
                "operated by",
                data.operatedBy.map(e => ({
                    squuid: e.holder.squuid,
                    label: e.holder.name
                }))
            ));
        }
        if (data.operates) {
            elements.push(render_relations(
                "operates",
                data.operates.map(e => ({
                    squuid: e.held.squuid,
                    label: e.held.name
                }))
            ));
        }

        if (data.otherMediaActivities)
            elements.push($("<p>").text(data.otherMediaActivities));

        if (data.note)
            elements.push($("<p>").text(data.note));

        const values = [];
        for (const key of Object.keys(KEY_VALUE_MAPPING)) {
            if (data[key] !== undefined) {
                const
                    value = data[key],
                    desc = KEY_VALUE_MAPPING[key];
                if (typeof desc === "string")
                    values.push([desc, value]);
                else
                    values.push([desc.title, desc.func(value)]);
            }
        }
        if (values.length) {
            const value_elements = [];
            for (const i of Object.keys(values)) {
                let [key, value] = values[i];
                value_elements.push($("<div>").html([
                    $("<div>").addClass("key").text(key),
                    $("<div>").addClass("value").text(value),
                ]));
            }
            elements.push($("<div>").addClass("grid-x key-values").html(value_elements));
        }

        elements.push($("<hr>"));
        //elements.push($("<pre>").text(JSON.stringify(data, null, 2)));
        console.log(data);
        $("#object").html(elements);
        hook_link_controls()
    }

    function render_object_by_node_id(node_id) {
        const squuid = node_map[node_id].name;
        if (object_map[squuid])
            render_object(object_map[squuid]);
        else {
            fetch_object(node_id)
                .then(() => render_object(object_map[squuid]));
        }
    }

    function on_network_click(event) {
        //console.log(event);
        if (event.nodes.length) {
            const node_id = event.nodes[0];
            selected_node_id = node_id;
            render_object_by_node_id(node_id);
            update_network();
        }
    }

    function traverse_nodes(node_id, direction="both", visited=null) {
        visited = visited || new Set();
        const
            go_up = direction === "up" || direction === "both",
            go_down = direction === "down" || direction === "both",
            todo = new Set(),
            ret_nodes = [];
        todo.add(node_id);

        while (todo.size) {
            const
                id = todo.keys().next().value,
                node = node_map[id];
            todo.delete(id);
            if (!visited.has(node.id))
                ret_nodes.push(node);
            visited.add(id);

            if (go_up)
                for (const adj of node.nodes_in) {
                    if (!visited.has(adj.id))
                        todo.add(adj.id);
                }
            if (go_down)
                for (const adj of node.nodes_out) {
                    if (!visited.has(adj.id))
                        todo.add(adj.id);
                }
        }
        return ret_nodes;
    }

    function on_window_resize(e) {
        const
            $views = $(".views-wrapper"),
            $view = $(".view-wrapper.halfable");
        if ($views.width() >= 1200) {
            $view.addClass("half");
        } else {
            $view.removeClass("half");
        }
    }

    function hook_link_controls() {
        $(".squuid-link").on("click", (e) => {
            const squuid = e.target.getAttribute("data-squuid");
            selected_node_id = squuid_to_node_id[squuid];
            render_object_by_node_id(selected_node_id);
            update_network();
        });
    }

    function hook_controls() {
        let _timeout = null;
        function update_throttled() {
            if (_timeout)
                clearTimeout(_timeout);
            _timeout = setTimeout(() => {
                filter_data();
                update_table();
            }, 400);
        }

        $search_input.on("input", update_throttled);
        $(window).resize(on_window_resize);
        hook_link_controls();
    }

    on_window_resize();
    get_data();

});

