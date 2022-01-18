import {useEffect, useState} from "react";
import "./Table.scss"


const Table = ({
    columns,
    rows,
    onRowClick,
    highlightRow,
    defaultOrder,
}) => {

    const per_page = 10;
    const [order, set_order] = useState(defaultOrder);
    const [cur_page, set_cur_page] = useState(0);
    const [display_rows, set_display_rows] = useState([]);

    const num_pages = (rows.length / per_page).toFixed();
    const page = Math.max(0, Math.min(cur_page, num_pages - 1));

    useEffect(() => {
        set_display_rows(
            sort_rows(rows, order)
            .slice(cur_page * per_page, (cur_page + 1) * per_page)
        );
    }, [rows, order, cur_page]);

    return (
        <table className={"table"}>
            <TableHeader columns={columns} order={order} set_order={set_order}/>
            <TableBody
                columns={columns}
                rows={display_rows}
                onRowClick={onRowClick}
                highlightRow={highlightRow}
            />
        </table>
    );
};

export default Table;



const SORT_ICONS = ["△", "▲", "▽", "▼"];

const TableHeader = ({columns, order, set_order}) => {
    return (
        <thead>
            <tr>
                {columns.map((column, i) => {
                    let order_idx = order === column.data
                        ? 1
                        : order === `-${column.data}`
                            ? 2
                            : 0;
                    return (
                        <th
                            key={i}
                            className={column.align || null}
                            onClick={e => {
                                if (order_idx === 0)
                                    set_order(`-${column.data}`);
                                else if (order_idx === 1)
                                    set_order(column.data);
                                else
                                    set_order(null);
                            }}
                        >
                            {SORT_ICONS[order_idx]} {column.title}
                        </th>
                    );
                })}
            </tr>
        </thead>
    )
};

const TableBody = ({columns, rows, onRowClick, highlightRow}) => {
    return (
        <tbody>
            {rows.map((row, i) => (
                <tr
                    key={i}
                    className={highlightRow && highlightRow(row) ? "highlight" : null}
                    onClick={() => onRowClick && onRowClick(row)}
                >
                    {columns.map((column, j) => {
                        const classes = [];
                        if (column.align)
                            classes.push(column.align);
                        return (
                            <td
                                key={j}
                                className={classes.join(" ")}
                            >
                                {row[column.data]}
                            </td>
                        );
                    })}
                </tr>
            ))}
        </tbody>
    )
};


const sort_rows = (rows, order) => {
    let column = order;
    if (!column)
        return rows;
    let descending = false;
    if (column.startsWith("-")) {
        column = column.slice(1, column.length);
        descending = true;
    }
    const ret_rows = [...rows];
    ret_rows.sort((a, b) => {
        const ret = a[column] < b[column] ? -1 : 1;
        return descending ? -ret : ret;
    });
    return ret_rows;
};
