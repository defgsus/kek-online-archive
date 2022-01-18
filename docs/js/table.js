

class Table {

    //sort_icons = ["▵", "▴", "▿", "▾"];
    sort_icons = ["△", "▲", "▽", "▼"];

    constructor(element, columns, rows=null) {
        this.element = element;
        this.columns = columns;
        this.rows = [];
        this.page = 0;
        this.num_pages = 0;
        this.per_page = 10;
        this.order = null;
        this.on_row_click = () => {};
        if (rows)
            this.update_rows(rows);
    }

    update_rows = (rows) => {
        this.rows = rows;
        this.num_pages = (this.rows.length / this.per_page).toFixed();
        this.page = Math.max(0, Math.min(this.page, this.num_pages - 1));
        this.sort();
        this.render();
    };

    set_page = (page) => {
        this.page = Math.max(0, Math.min(this.num_pages - 1, page));
        this.render();
    };

    set_order = (order) => {
        this.order = order;
        this.sort();
        this.render();
    };

    get_paged_rows = () => {
        return this.rows.slice(
            this.page * this.per_page,
            (this.page + 1) * this.per_page,
        );
    };

    sort = () => {
        let column = this.order;
        if (!column)
            return;
        let descending = false;
        if (column.startsWith("-")) {
            column = column.slice(1, column.length);
            descending = true;
        }
        this.rows.sort((a, b) => {
            const ret = a[column] < b[column] ? -1 : 1;
            return descending ? -ret : ret;
        });
    };

    render = () => {
        let markup = ``;
        markup += `<div class="grid-x">`;
        markup += `<div class="grow"></div>`;
        markup += `<div>page <input type="number" name="page" value="${this.page+1}"`;
        markup += ` min="1" max="${Math.max(1, this.num_pages)}">`;
        markup += ` of ${this.num_pages}</div>`;

        markup += `</div>`;

        markup += `<table class="table"><thead><tr>`;
        for (const col of this.columns) {
            let order = 0;
            if (this.order === col.data)
                order = 1;
            else if (this.order === `-${col.data}`)
                order = 3;
            markup += `<th data-column="${col.data}">${this.sort_icons[order]} ${col.title}</th>`;
        }
        markup += `</tr></thead>`;
        markup += `<tbody>`;
        let row_idx = this.page * this.per_page;
        for (const row of this.get_paged_rows()) {
            markup += `<tr data-row="${row_idx}">`;
            for (const col of this.columns) {
                let class_stmt = "";
                if (col.align)
                    class_stmt = ` class="${col.align}"`;
                markup += `<td${class_stmt}>${row[col.data] || "-"}</td>`;
            }
            markup += `</tr>`;
            ++row_idx;
        }
        markup += `</tbody></table>`;

        this.element.innerHTML = markup;
        this.element.querySelector('input[name="page"]').oninput = (e) => {
            this.set_page(e.target.value - 1);
        };
        for (const elem of this.element.querySelectorAll('thead th')) {
            elem.onclick = () => {
                let order = elem.getAttribute("data-column");
                if (this.order === order)
                    order = `-${order}`;
                this.set_order(order);
            };
        }
        for (const elem of this.element.querySelectorAll('tbody tr')) {
            elem.onclick = () => {
                const idx = elem.getAttribute("data-row");
                this.on_row_click(this.rows[idx]);
            };
        }
    };

}