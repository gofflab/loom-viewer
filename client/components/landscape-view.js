import React, { Component, PropTypes } from 'react';
import { LandscapeSidepanel } from './landscape-sidepanel';
import { Scatterplot } from './scatterplot';
import { fetchDataSet } from '../actions/actions';


class LandscapeViewComponent extends Component {
	constructor(props) {
		super(props);
		this.makeData = this.makeData.bind(this);
	}

	makeData(attr, gene) {
		let data = [];
		if (attr === "(gene)") {
			if (this.props.genes.hasOwnProperty(gene)) {
				data = this.props.genes[gene];
			}
		} else {
			data = this.props.dataSet.colAttrs[attr];
		}
		return data;
	}

	render() {
		const { dispatch, landscapeState, dataSet, genes } = this.props;
		const { colorAttr, colorGene, xCoordinate, xGene, yCoordinate, yGene} = landscapeState;
		const color = this.makeData(colorAttr, colorGene);
		const x = this.makeData(xCoordinate, xGene);
		const y = this.makeData(yCoordinate, yGene);
		return (
			<div style={{ display: 'flex', flex: '1 1 auto' }}>
				<div className='view-sidepanel'>
					<LandscapeSidepanel
						landscapeState={landscapeState}
						dataSet={dataSet}
						genes={genes}
						dispatch={dispatch}
						/>
				</div>
				<div  style={{ display: 'flex', flex: '1 1 auto', padding: '0px', overflow: 'hidden' }}>
					<Scatterplot
						x={x}
						y={y}
						color={color}
						colorMode={landscapeState.colorMode}
						logScaleColor={landscapeState.colorAttr === "(gene)"}
						logScaleX={landscapeState.xCoordinate === "(gene)"}
						logScaleY={landscapeState.yCoordinate === "(gene)"}
						/>
				</div>
			</div>
		);
	}
}

LandscapeViewComponent.propTypes = {
	dataSet: PropTypes.object.isRequired,
	genes: PropTypes.object.isRequired,
	landscapeState: PropTypes.object.isRequired,
	dispatch: PropTypes.func.isRequired,
};


class LandscapeViewContainer extends Component {

	componentDidMount(){
		const { dispatch, data, params } = this.props;
		const { transcriptome, project, dataset } = params;
		const dataSetName = transcriptome + '__' + project + '__' + dataset;
		dispatch(fetchDataSet({ dataSets: data.dataSets, dataSetName: dataSetName}));
	}

	render(){

		const { dispatch, data, landscapeState, params } = this.props;
		const { transcriptome, project, dataset } = params;
		const fetchDatasetString = transcriptome + '__' + project + '__' + dataset;
		const dataSet = data.dataSets[fetchDatasetString];
		const genes = data.genes;
		return ( dataSet ?
			<LandscapeViewComponent
				dispatch={dispatch}
				landscapeState={landscapeState}
				dataSet={dataSet}
				genes={genes} />
		:
			<div className='container' >Fetching dataset...</div>
		);
	}

}

LandscapeViewContainer.propTypes = {
	// Passed down by react-router-redux
	params: PropTypes.object.isRequired,
	// Passed down by react-redux
	data: PropTypes.object.isRequired,
	landscapeState: PropTypes.object.isRequired,
	dispatch: PropTypes.func.isRequired,
};

//connect GenescapeViewContainer to store
import { connect } from 'react-redux';

// react-router-redux passes URL parameters
// through ownProps.params. See also:
// https://github.com/reactjs/react-router-redux#how-do-i-access-router-state-in-a-container-component
const mapStateToProps = (state, ownProps) => {
	return {
		params: ownProps.params,
		landscapeState: state.landscapeState,
		data: state.data,
	};
};

export const LandscapeView = connect(mapStateToProps)(LandscapeViewContainer);
