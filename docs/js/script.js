window.addEventListener("DOMContentLoaded", () => {

    const raw_data = {};
    let filtered_data = [];
    let network = null;

    window.raw_data = raw_data;

    const $search_input = $('input[name="search"]');

    function get_data() {
        fetch("data/shareholders.json")
            .then(response => response.json())
            .then(add_to_raw_data)
            .then(() => {
                fetch("data/media.json")
                    .then(response => response.json())
                    .then(add_to_raw_data)
                    .then(filter_data)
                    .then(build_table)
                    .then(build_network)
                    .then(hook_controls)
            });
    }

    function add_to_raw_data(data) {
        for (const entry of data) {
            entry.name_lower = entry.name.toLowerCase();
            if (!entry.type)
                entry.type = "owner";

            entry.out_nodes = [];
            if (entry.owns) {
                for (const own of entry.owns)
                    entry.out_nodes.push(own.held.squuid);
            }
            entry.num_out_nodes = entry.out_nodes.length;

            raw_data[entry["squuid"]] = entry;
        }
    }

    function filter_data() {
        const search_term = $search_input.val().toLowerCase();
        filtered_data = [];
        for (const squuid of Object.keys(raw_data)) {
            const entry = raw_data[squuid];
            if (entry["name_lower"].indexOf(search_term) < 0)
                continue;
            filtered_data.push(entry);
        }
        console.log(`searchterm '${search_term}', filtered rows: ${filtered_data.length}`);
    }

    function build_table() {
        $("#data-table").DataTable({
            autoWidth: false,
            data: filtered_data,
            //rowCallback: render_row,
            lengthMenu: [[10, 25, 50, 100, 500, -1], [10, 25, 50, 100, 500, "All"]],
            pageLength: 10,
            order: [[1, "asc"]],
            columns: [
                //{data: "data", visible: false},
                {data: "type", title: "Type"},
                {data: "name", title: "Name"},
                {data: "state", title: "State"},
                {data: "num_out_nodes", tile: "num out"},
            ],
            searching: false,
        });
    }

    function update_table() {
        const dt = $("#data-table").DataTable();
        dt.clear();
        for (const row of filtered_data)
            dt.row.add(row);
        dt.draw();
    }

    function build_network() {
        const
            nodes = [],
            edges = [];

        for (const entry of filtered_data.slice(0, 100)) {

            nodes.push({
                id: entry["squuid"],
                label: entry["name"],
            });

            for (const other_squuid of entry.out_nodes) {
                edges.push({
                    from: entry.squuid,
                    to: other_squuid,
                });
            }

            if (nodes.length > 2000) {
                console.log("Stopping graph at 2000 nodes!");
                break;
            }
        }

        const container = document.getElementById("network");
        network = new vis.Network(
            container,
            {nodes, edges},
            {
                height: "600px",
                layout: {
                    improvedLayout: false
                },
            },
        );
        window.network = network;
    }

    function hook_controls() {

        let _timeout = null;
        function update_throttled() {
            if (_timeout)
                clearTimeout(_timeout);
            _timeout = setTimeout(() => {
                filter_data();
                update_table();
                build_network();
            }, 400);
        }

        $search_input.on("input", update_throttled);
    }

    get_data();

});

