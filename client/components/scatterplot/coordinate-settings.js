import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
	ListGroup,
	ListGroupItem,
	Button,
	Glyphicon,
} from 'react-bootstrap';

import {
	CollapsibleSettings,
	DropdownMenu,
	OverlayTooltip,
} from '../settings/settings';

import { popoverTest } from './popover';

import { merge } from '../../js/util';

import { SET_VIEW_PROPS } from '../../actions/actionTypes';

function nullFunc() { }

export class CoordinateSettings extends PureComponent {
	componentWillMount() {
		const {
			dispatch,
			dataset,
			axis,
		} = this.props;

		const {
			attrs,
		} = dataset[axis];

		// function to generate functions used in buttons
		const setCoordinateFactory = (label, xAttr, yAttr) => {
			if (attrs[xAttr] && attrs[yAttr]) {
				return (xAttrs, yAttrs) => {
					const resetAttrs = {
						type: SET_VIEW_PROPS,
						stateName: axis,
						path: dataset.path,
						viewState: {
							[axis]: {
								xAttrs: [{
									attr: xAttr,
									jitter: false,
									logscale: false,
								}],
								yAttrs: [{
									attr: yAttr,
									jitter: false,
									logscale: false,
								}],
							},
						},
					};
					const handleClick = () => {
						dispatch(resetAttrs);
					};

					// default to previous jitter and logscale settings
					// note that this will return `undefined` for empty
					// attributes, which is equivalent to false, but
					// we set it to false anyway for type consistency
					let newXattrs = xAttrs.slice(0),
						newYattrs = yAttrs.slice(0);
					// check if xAtt is already selected,
					// don't  append if it is.
					let i = newXattrs.length;
					while (i--) {
						if (newXattrs[i].attr === xAttr) { break; }
					}
					if (i === -1) {
						const xSettings = newXattrs[length - 1];
						const xJitter = xSettings ? xSettings.jitter : false;
						const xLogscale = xSettings ? xSettings.logscale : false;
						newXattrs.push({
							attr: xAttr,
							jitter: xJitter,
							logscale: xLogscale,
						});
					}
					let j = newYattrs.length;
					while (j--) {
						if (newYattrs[j].attr === yAttr) { break; }
					}
					if (j === -1) {
						const ySettings = newYattrs[length - 1];
						const yJitter = ySettings ? ySettings.jitter : false;
						const yLogscale = ySettings ? ySettings.logscale : false;
						newYattrs.push({
							attr: yAttr,
							jitter: yJitter,
							logscale: yLogscale,
						});
					}
					let handleClickAppend;
					if (i === -1 || j === -1) {
						const newAttrs = {};
						if (i === -1) {
							newAttrs.xAttrs = newXattrs;
						}
						if (j === -1) {
							newAttrs.yAttrs = newYattrs;
						}
						const appendAttrs = {
							type: SET_VIEW_PROPS,
							stateName: axis,
							path: dataset.path,
							viewState: { [axis]: newAttrs },
						};
						handleClickAppend = () => { dispatch(appendAttrs); };
					}
					return (
						<ListGroupItem>
							<OverlayTooltip
								tooltip={`Set first attributes to ${xAttr} and ${yAttr} and unset the others`}
								tooltipId={`set-${xAttr}_${yAttr}-tltp`}>
								<Button bsStyle='link' onClick={handleClick}>
									{label}
								</Button>
							</OverlayTooltip>
							<OverlayTooltip
								tooltip={'Append attributes after current selection'}
								tooltipId={`appnd-${xAttr}_${yAttr}-tltp`}>
								<Button bsStyle='link' onClick={handleClickAppend}>
									<b>+</b>
								</Button>
							</OverlayTooltip>
						</ListGroupItem>
					);
				};
			} else {
				return nullFunc;
			}
		};

		const setXY = setCoordinateFactory('default X / Y', '_X', '_Y');
		const setTSNE = setCoordinateFactory('tSNE1 / tSNE2', '_tSNE1', '_tSNE2');
		const setPCA = setCoordinateFactory('PCA 1 / PCA 2', '_PC1', '_PC2');
		const setSFDP = setCoordinateFactory('SFDP X / SFDP Y', 'SFDP_X', 'SFDP_Y');
		const setLog = setCoordinateFactory('LogMean / LogCV', '_LogMean', '_LogCV');

		const quickSettings = (
			setTSNE !== nullFunc ||
			setPCA !== nullFunc ||
			setSFDP !== nullFunc ||
			setLog !== nullFunc
		) ? (
				(xAttrs, yAttrs) => {
					return (
						<CollapsibleSettings
							label={'X/Y Quick Settings'}
							tooltip={'Quickly set X and Y attributes to one of the listed default values'}
							tooltipId={'quickstngs-tltp'}
							popover={popoverTest}
							popoverTitle={'Test'}
							popoverId={'popoverId1'}
							mountClosed>
							<ListGroup>
								{setXY(xAttrs, yAttrs)}
								{setTSNE(xAttrs, yAttrs)}
								{setPCA(xAttrs, yAttrs)}
								{setSFDP(xAttrs, yAttrs)}
								{setLog(xAttrs, yAttrs)}
							</ListGroup>
						</CollapsibleSettings>
					);
				}
			) : nullFunc;

		const attrSelectFactory = (attrName, attrs, idx) => {
			let newAttrs = attrs.slice(0);
			return (value) => {
				if (value) {
					let oldVal = (idx === newAttrs.length) ? newAttrs[newAttrs.length - 1] : newAttrs[idx],
						newVal = {
							attr: value,
							jitter: oldVal.jitter,
							logscale: oldVal.logscale,
						};
					newAttrs[idx] = newVal;
				} else if (idx < newAttrs.length && newAttrs.length > 1) {
					for (let i = idx; i < newAttrs.length - 1; i++) {
						newAttrs[i] = newAttrs[i + 1];
					}
					newAttrs.pop();
				}
				dispatch({
					type: SET_VIEW_PROPS,
					stateName: axis,
					path: dataset.path,
					viewState: { [axis]: { [attrName]: newAttrs } },
				});
			};
		};

		const attrJitterFactory = (attrName, attrs, idx) => {
			let newAttrs = attrs.slice(0),
				jitter = !newAttrs[idx].jitter;
			newAttrs[idx] = merge(newAttrs[idx], { jitter });
			const newState = {
				type: SET_VIEW_PROPS,
				stateName: axis,
				path: dataset.path,
				viewState: { [axis]: { [attrName]: newAttrs } },
			};
			return () => {
				dispatch(newState);
			};
		};

		const attrLogscaleFactory = (attrName, attrs, idx) => {
			let newAttrs = attrs.slice(0),
				logscale = !newAttrs[idx].logscale;
			newAttrs[idx] = merge(newAttrs[idx], { logscale });
			const newState = {
				type: SET_VIEW_PROPS,
				stateName: axis,
				path: dataset.path,
				viewState: { [axis]: { [attrName]: newAttrs } },
			};
			return () => {
				dispatch(newState);
			};
		};
		this.setState({
			quickSettings,
			attrSelectFactory,
			attrJitterFactory,
			attrLogscaleFactory,
		});
	}

	shouldComponentUpdate(nextProps) {
		return nextProps.xAttrs !== this.props.xAttrs ||
			nextProps.yAttrs !== this.props.yAttrs;
	}

	render() {
		const { dataset, axis,
			xAttrs, yAttrs } = this.props;

		const { allKeysNoUniques, dropdownOptions } = dataset[axis];
		const filterOptions = dropdownOptions.allNoUniques;


		const {
								quickSettings,
			attrSelectFactory,
			attrJitterFactory,
			attrLogscaleFactory,
		} = this.state;

		// filter out undefined attributes;
		let newXattrs = [];
		for (let i = 0; i < xAttrs.length; i++) {
			let attr = xAttrs[i];
			if (attr) {
				newXattrs.push(attr);
			}
		}

		// generate dropdowns for x attribute
		let i = newXattrs.length,
			attrName = 'xAttrs',
			xAttrDropdowns = new Array(i);

		// set attribute values
		while (i--) {
			const attrData = newXattrs[i],
				xAttrHC = attrSelectFactory(attrName, newXattrs, i);
			const xJitterHC = attrJitterFactory(attrName, newXattrs, i),
				xLogscaleHC = attrLogscaleFactory(attrName, newXattrs, i);
			xAttrDropdowns[i] = (
				<div className={'view'} key={attrData.attr + '_x_' + i}>
					<OverlayTooltip
						tooltip={`select attribute ${i + 1}`}
						tooltipId={`xattr-${i}-tltp`}>
						<div style={{ flex: 8 }}>
							<DropdownMenu
								key={i}
								value={attrData.attr}
								options={allKeysNoUniques}
								filterOptions={filterOptions}
								onChange={xAttrHC}
							/>
						</div>
					</OverlayTooltip>
					<OverlayTooltip
						tooltip={`toggle log2-scaling for attribute ${i + 1}`}
						tooltipId={`xattr-log-${i}-tltp`}>
						<Button
							bsStyle='link'
							bsSize='small'
							style={{ flex: 1 }}
							onClick={xLogscaleHC}>
							<Glyphicon glyph={attrData.logscale ? 'check' : 'unchecked'} /> log
						</Button>
					</OverlayTooltip>
					<OverlayTooltip
						tooltip={`toggle jitter for attribute ${i + 1}`}
						tooltipId={`xattr-jitter-${i}-tltp`}>
						<Button
							bsStyle='link'
							bsSize='small'
							style={{ flex: 1 }}
							onClick={xJitterHC}>
							<Glyphicon glyph={attrData.jitter ? 'check' : 'unchecked'} /> jitter
						</Button>
					</OverlayTooltip>
				</div >
			);
		}

		let newYattrs = [];
		for (i = 0; i < yAttrs.length; i++) {
			let attr = yAttrs[i];
			if (attr) {
				newYattrs.push(attr);
			}
		}
		// newYattrs.push({
		// 	attr: '<select attribute>',
		// 	jitter: newYattrs[i - 1] ? newYattrs[i - 1].jitter : false,
		// 	log: newYattrs[i - 1] ? newYattrs[i - 1].log : false,
		// });

		i = newYattrs.length;
		attrName = 'yAttrs';
		let yAttrDropdowns = new Array(i);
		while (i--) {
			const attrData = newYattrs[i],
				yAttrHC = attrSelectFactory(attrName, newYattrs, i);
			const yJitterHC = attrJitterFactory(attrName, newYattrs, i),
				yLogscaleHC = attrLogscaleFactory(attrName, newYattrs, i);
			yAttrDropdowns[i] = (
				<div className={'view'} key={attrData.attr + '_y_' + i}>
					<OverlayTooltip
						tooltip={`select attribute ${i + 1}`}
						tooltipId={`yattr-${i}-tltp`}>
						<div style={{ flex: 8 }}>
							<DropdownMenu
								key={i}
								value={attrData.attr}
								options={allKeysNoUniques}
								filterOptions={filterOptions}
								onChange={yAttrHC}
							/>
						</div>
					</OverlayTooltip>
					<OverlayTooltip
						tooltip={`toggle log2-scaling for attribute ${i + 1}`}
						tooltipId={`yattr-log-${i}-tltp`}>
						<Button
							bsStyle='link'
							bsSize='small'
							style={{ flex: 1 }}
							onClick={yLogscaleHC}>
							<Glyphicon glyph={attrData.logscale ? 'check' : 'unchecked'} /> log
					</Button>
					</OverlayTooltip>
					<OverlayTooltip
						tooltip={`toggle jitter for attribute ${i + 1}`}
						tooltipId={`yattr-jitter-${i}-tltp`}>
						<Button
							bsStyle='link'
							bsSize='small'
							style={{ flex: 1 }}
							onClick={yJitterHC}>
							<Glyphicon glyph={attrData.jitter ? 'check' : 'unchecked'} /> jitter
					</Button>
					</OverlayTooltip>
				</div>);
		}

		return (
			<div>
				<ListGroupItem>
					{quickSettings(newXattrs, newYattrs)}
				</ListGroupItem>
				<ListGroupItem>
					<CollapsibleSettings
						label={'X attributes'}
						tooltip={'Select attributes for the X axis, with optional logaritmic scaling and jittering'}
						tooltipId={'xattrs-tltp'}
						popover={popoverTest}
						popoverTitle={'Test'}
						popoverId={'popoverId2'}
					>
						<div>
							{xAttrDropdowns}
						</div>
					</CollapsibleSettings>
				</ListGroupItem>
				<ListGroupItem>
					<CollapsibleSettings
						label={'Y attributes'}
						tooltip={'Select attributes for the Y axis, with optional logaritmic scaling and jittering'}
						tooltipId={'yattrs-tltp'}
						popover={popoverTest}
						popoverTitle={'Test'}
						popoverId={'popoverId3'}
					>
						<div>
							{yAttrDropdowns}
						</div>
					</CollapsibleSettings>
				</ListGroupItem>
			</div>
		);
	}
}

CoordinateSettings.propTypes = {
	dispatch: PropTypes.func.isRequired,
	dataset: PropTypes.object.isRequired,
	axis: PropTypes.string.isRequired,
	xAttrs: PropTypes.array.isRequired,
	yAttrs: PropTypes.array.isRequired,
};