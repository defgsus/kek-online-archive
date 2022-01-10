window.addEventListener("DOMContentLoaded", () => {

    const TYPE_COLOR_MAPPING = {
        "shareholder": "#777",
        "radio": "#986",
        "online": "#689",
        "print": "#698",
        "tv": "#965",
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
        pseudoCompany: "pseudo company ?",
        supplierConsortium: "supplier consortium ?",
        rfFreePay: "free ?",
        rfPublicPrivate: "public ?",
        rfShoppingChannel: "shopping channel ?",
        rfStatewide: "statewide ?",
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
        pressEditionsIVW: "press editions (IVW) ?",
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
    const node_map = {};
    const object_map = {};
    let filtered_data = [];
    let table = null;
    let network = null;
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
            .then(data => { object_map[squuid] = data; })
            .catch(error => { status_msg(`error fetching ${squuid}: ${error}`); });
    }

    function store_raw_data(data) {
        raw_data = data;
        for (const node of raw_data.nodes) {
            node.label_lower = node.label.toLowerCase();
            node.nodes_in = [];
            node.nodes_out = [];
            node_map[node.id] = node;
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
                        }
                    }
                },
            );
            network.on("click", on_network_click);
            window.network = network;
        }
        new Promise((resolve, reject) => resolve())
            .then(() => { status_msg(`traversing graph...`); })
            .then(() => {
                let picked_nodes = traverse_nodes(selected_node_id, "up");
                picked_nodes = picked_nodes.slice(1, picked_nodes.length);
                picked_nodes = picked_nodes.concat(
                    traverse_nodes(selected_node_id, "down")
                );
                console.log(`traversed ${picked_nodes.length} nodes`);
                return picked_nodes;
            })
            .then(nodes => { status_msg(`create ${nodes.length} nodes network...`); return nodes; })
            .then(picked_nodes => {
                const nodes = [], edges = [];
                if (selected_node_id) {
                    for (const entry of picked_nodes) {
                        nodes.push({
                            id: entry.id,
                            label: entry.label,
                            group: entry.type,
                            color: entry.id === selected_node_id
                                ? "#bcb"
                                : TYPE_COLOR_MAPPING[entry.type] || "#f00",
                            value: entry.num_medias_weighted,
                        });

                        for (const other of entry.nodes_out) {
                            edges.push({
                                from: entry.id,
                                to: other.id,
                                value: other.weight,
                                label: other.weight,
                            });
                        }
                    }
                }
                network.setData({nodes, edges});
            })
            .then(() => { status_msg(); })
            .catch(error => { status_msg(error); });
    }

    function render_object(data) {
        const elements = [];

        let icon = "";
        if (!data.type) {  // shareholder
            icon = data.naturalPerson ? "😃" : "🏛";
        } else {
            icon = TYPE_ICON_MAPPING[data.type] || "❓";
        }

        elements.push($("<h3>").text(`${icon} ${data.name}`));

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
            address = address.concat(rfAddress.split("\n"));
        }
        if (address.length) {
            elements.push($("<p>").html(address.join("<br>")));
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
            const table_rows = [];
            for (const value of values) {
                table_rows.push($("<tr>").html([
                    $("<td>").text(value[0]),
                    $("<td>").text(value[1]),
                ]));
            }
            elements.push($("table").html($("<tbody>").html(table_rows)));
        }

        elements.push($("<hr>"));
        elements.push($("<pre>").text(JSON.stringify(data, null, 2)));

        $("#object").html(elements);
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
            render_object_by_node_id(node_id);
        }
    }

    function traverse_nodes(node_id, direction="both") {
        const
            go_up = direction === "up" || direction === "both",
            go_down = direction === "down" || direction === "both",
            visited = new Set(),
            todo = new Set(),
            ret_nodes = [];
        todo.add(node_id);

        while (todo.size) {
            const
                id = todo.keys().next().value,
                node = node_map[id];
            todo.delete(id);
            visited.add(id);
            ret_nodes.push(node);

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
            $view = $(".view-wrapper");
        if ($views.width() >= 1200) {
            $view.addClass("half");
        } else {
            $view.removeClass("half");
        }
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
    }

    on_window_resize();
    get_data();

});

