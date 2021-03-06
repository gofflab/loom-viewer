import 'whatwg-fetch';

import localforage from 'localforage';
import 'localforage-removeitems';


import {
	// REQUEST_PROJECTS,
	REQUEST_PROJECTS_FETCH,
	// REQUEST_PROJECTS_CACHED,
	REQUEST_PROJECTS_FAILED,
	RECEIVE_PROJECTS,
	LOAD_CACHED_PROJECTS,
} from './action-types';

export const OFFLINE = 0,
	ONLINE = 1,
	UNKNOWN = -1;

// //////////////////////////////////////////////////////////////////////////////
//
// Fetch the list of projects
//
// //////////////////////////////////////////////////////////////////////////////


// function requestProjects() {
// 	return {
// 		type: REQUEST_PROJECTS,
// 	};
// }

function requestProjectsFetch() {
	return {
		type: REQUEST_PROJECTS_FETCH,
	};
}

// function requestProjectsCached() {
// 	return {
// 		type: REQUEST_PROJECTS_CACHED,
// 	};
// }

function requestProjectsFailed() {
	return {
		type: REQUEST_PROJECTS_FAILED,
		state: {
			fetchProjectsStatus: OFFLINE,
		},
	};
}

function loadOfflineProjects(list) {
	return {
		type: LOAD_CACHED_PROJECTS,
		state: {
			list,
			fetchProjectsStatus: OFFLINE,
		},
	};
}

function receiveProjects(json, prevList) {
	// convert json array to dictionary
	let list = {};
	for (let i = 0; i < json.length; i++) {
		let dataset = json[i];
		dataset.path = dataset.project + '/' + dataset.filename;
		// check if dataset changed.
		const storedDS = prevList && prevList[dataset.path];
		if (!storedDS) {
			dataset.fetchedGenes = {};
			dataset.fetchingGenes = {};
			dataset.col = null;
			dataset.row = null;
			list[dataset.path] = dataset;
		} else if (
			dataset.creationDate !== storedDS.creationDate ||
			dataset.lastModified !== storedDS.lastModified
		) {
			console.log('Dataset was modified:');
			console.log({
				newDS: {
					creationDate: dataset.creationDate,
					lastModified: dataset.lastModified,
				},
				storedDS: {
					creationDate: storedDS.creationDate,
					lastModified: storedDS.lastModified,
				},
			});
			uncacheDataset(dataset);
			list[dataset.path] = unloadDataset(dataset, storedDS);
		}
	}

	return {
		type: RECEIVE_PROJECTS,
		state: {
			list,
			fetchProjectsStatus: ONLINE,
		},
	};
}

/**
 * Remove dataset from localforage
 * @param {*} dataset
 */
export function uncacheDataset(dataset) {
	localforage.keys().then((keys) => {
		let matchingKeys = [];
		for (let i = 0; i < keys.length; i++) {
			let key = keys[i];
			// this covers both `${key}` and `${key}/genes` case
			if (key.startsWith(dataset.path)) {
				matchingKeys.push(key);
			}
		}
		return localforage.removeItems(matchingKeys);
	});

}

/**
 * Modify `dataset` in such a way that it removes all previously loaded
 * data from `storedDS`
 * @param {*} dataset
 * @param {*} storedDS
 */
export function unloadDataset(dataset, storedDS) {
	// To unload previously set fetchedGenes and fetchingGenes,
	// we have to manually set all to `false` (since `undefined`
	// will leave the previous value untouched). Note that we
	// must copy to respect redux' immutability guarantee.
	dataset.fetchedGenes = copyAndSetFalse(storedDS.fetchedGenes);
	dataset.fetchingGenes = copyAndSetFalse(storedDS.fetchingGenes);
	dataset.col = null;
	dataset.row = null;
	dataset.loaded = false;
	return dataset;
}

/**
 * Returns a copy of `obj` with `false` assigned to each key;
 * @param {*} obj
 */
function copyAndSetFalse(obj) {
	let newObj = {},
		keys = Object.keys(obj);
	keys.sort();
	for (let i = 0; i < keys.length; i++) {
		newObj[keys[i]] = false;
	}
	return newObj;
}


// Thunk action creator, following http://rackt.org/redux/docs/advanced/AsyncActions.html
// Though its insides are different, you would use it just like any other action creator:
// store.dispatch(requestProjects(...))

export function requestProjects(list, fetchProjectsStatus) {
	return (dispatch) => {
		// Check if projects already exists in the store,
		// and if we weren't offline last time we tried
		// to fetch the projects
		if (!(list && fetchProjectsStatus)) { // Announce we are fetching from server
			dispatch(requestProjectsFetch());
			return (
				fetch('/loom').then((response) => {
					return response.json();
				})
					.then((json) => {
						if (typeof json === 'string') {
							throw json;
						}
						return dispatch(receiveProjects(json, list));
					})
					.catch((err) => {
						console.log('fetching projects failed with following error:');
						console.log(err);
						// Try loading the offline datasets,
						// if we have not done so before
						if (!list) {
							console.log('attempting to load cached datasets');
							loadProjects(dispatch);
						}
					})
			);
		} else {
			// This branch is reached only if we are offline and have
			// previously loaded the offline data. In that case we can
			// safely use the in-memory redux store since it's already
			// synchronised with the offline cache.
			return null;
		}
	};
}

function loadProjects(dispatch) {
	localforage.getItem('cachedDatasets')
		.then((cachedDatasets) => {
			if (cachedDatasets) {
				dispatch(loadOfflineProjects(cachedDatasets));
			} else {
				// if list is empty, we have no
				// cached datasets and fetching
				// effectively failed.
				throw 'no cached datasets';
			}
		})
		.catch((err) => {
			console.log('Loading projects failed:', err, {
				err,
			});
			dispatch(requestProjectsFailed());
		});
}