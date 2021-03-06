import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
	Table,
	Glyphicon,
} from 'react-bootstrap';

import { isEqual } from 'lodash';

// we can map a single or multiple
// keys from the data set to a cell.
const mapToCell = (row, key, keys) => {
	return row ?
		keys ?
			keys.map((k) => { return row[k]; }) :
			row[key] :
		null;
};

export class SortableTable extends Component {
	render() {
		const {
			data,
			columns,
			order,
			striped,
			bordered,
			condensed,
			hover,
			responsive,
		} = this.props;

		let headerRows = [];
		let maxHeaders = 0;
		for (let i = 0; i < columns.length; i++) {
			const { headers } = columns[i];
			if (headers) {
				maxHeaders = Math.max(maxHeaders, columns[i].headers.length);
			}
		}

		for (let i = 0; i < maxHeaders; i++) {
			// A row of header cells
			let headerCells = [];
			for (let j = 0; j < columns.length; j++) {
				const column = columns[j];
				const {
					key,
					keys,
					headers,
					headerStyles,
					onHeaderClick,
				} = column;

				const sortIcon = (i === 0 && order && key === order.key) ? (
					<Glyphicon
						glyph={column.sortIcon + (order.asc ? '' : '-alt')} />
				) : null;
				const header = headers ?
					headers[i] :
					null;
				const onClick = header ?
					(
						Array.isArray(onHeaderClick) ?
							onHeaderClick[i] :
							onHeaderClick
					) :
					null;
				headerCells.push(
					<th
						key={keys ?
							keys.join(' ') :
							key
						}
						style={Object.assign({ cursor: onClick ? 'pointer' : 'default' }, headerStyles ? headerStyles[i] : null)}
						onClick={onClick}>
						{header}{sortIcon}
					</th>
				);
			}
			headerRows.push(<tr key={i + 1} >{headerCells}</tr>);
		}


		let dataRows = [];
		if (data) {
			for (let i = 0; i < data.length; i++) {
				let rowCells = [];
				for (let j = 0; j < columns.length; j++) {
					const {
						dataStyle,
						key,
						keys,
						mergeRows,
					} = columns[j];
					const cell = mapToCell(data[i], key, keys);
					let rowSpan = 1;
					if (mergeRows) {
						if (isEqual(cell, mapToCell(data[i - 1], key, keys))) {
							continue;
						} else {
							while (isEqual(cell, mapToCell(data[i + rowSpan], key, keys))) { rowSpan++; }
						}
					}
					rowCells.push(
						<td
							style={dataStyle}
							rowSpan={rowSpan}
							key={keys ? keys.join(' ') : key} >
							{cell}
						</td>
					);
				}
				dataRows.push(<tr key={data[i].rowKey} >{rowCells}</tr>);
			}
		}

		const tableHeader = headerRows.length ?
			<thead>{headerRows}</thead> :
			null;
		const tableRows = dataRows.length ?
			<tbody>{dataRows}</tbody> :
			null;

		return tableHeader || tableRows ?
			(
				<Table
					striped={striped}
					bordered={bordered}
					condensed={condensed}
					hover={hover}
					responsive={responsive}
					style={{ width: '100%' }}>
					{tableHeader}
					{tableRows}
				</Table>
			) :
			null;
	}
}

SortableTable.propTypes = {
	data: PropTypes.array,
	columns: PropTypes.array.isRequired,
	// Indicates to the table by which of the columns,
	// if any, the data is sorted and whether it is
	// ascending or descending
	order: PropTypes.shape({
		key: PropTypes.string,
		asc: PropTypes.bool,
	}),
	striped: PropTypes.bool,
	bordered: PropTypes.bool,
	condensed: PropTypes.bool,
	hover: PropTypes.bool,
	responsive: PropTypes.bool,
};
