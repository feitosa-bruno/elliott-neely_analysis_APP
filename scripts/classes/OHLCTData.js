///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Dependencies
///////////////////////////////////////////////////////////////////////////////
const appDir				= require('electron').remote.app.getAppPath();
const HeaderList			= require(`${appDir}/scripts/global_constants`).HeaderList;
const cpyObj				= require(`${appDir}/scripts/auxiliary/copyObject`);


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Classes
///////////////////////////////////////////////////////////////////////////////

class OHLCTData {
	constructor (input) {
		if (input === undefined) {
			// Empty Initialization of OHLCT Data
			for (var index in HeaderList) {
				var key = HeaderList[index];
				this[key]	= [];
			}
		} else if (input.constructor.name === 'MonowaveVector') {
			// Initialize OHLCT Data from Monowave Vector
			// Uses 1st value of each Monowave in the Vector, plus last value of the last Monowave
			// 3 Steps: Initialization, Pass-through, Finalization
			// 1st Step: Empty Vectors Headers Initialization
			for (var key in input.monowave[0].OHLCTData) {
				this[key]	= [];			// Empty Vectors Headers for Later Initialization
			}
			// 2nd Step: Pass-through Data to initialize all values
			input.monowave.map(el => {
				var element = el.OHLCTData;
				for (var key in element) {
					// console.log(index, key, element);
					if (element[key][0] instanceof Date) {
						this[key].push(new Date(element[key][0]));
					} else {
						this[key].push(element[key][0]);
					}
				}
			});
			// 3rd Step: Finalize last values of Data
			var lastMonowave		= input.monowave.length - 1;
			var lastMonowaveData	= input.monowave[lastMonowave].OHLCTData["Date"].length - 1;
			for (key in input.monowave[lastMonowave].OHLCTData) {
				this[key].push(
					input.monowave[lastMonowave].OHLCTData[key][lastMonowaveData]
				); 
			}
		} else if (input instanceof OHLCTData) {
			// Initialize OHLCT Data from Other OHLCT Data
			// Keys are simply copied directly with their values
			for (var key in input) {
				if (key === 'Date') {	// Individual Initialization for Date Objects
					this[key]	= input[key].map(el => new Date(el));
				} else {				// Copy Object for Other Objects
					this[key]	= cpyObj(input[key]);
				}
			}
		} else {
			// Initialize OHLCT Data from similar structure
			// Keys present are copied. Non-present are initialized empty
			for (var index in HeaderList) {
				var key = HeaderList[index];
				if (input[key]) {
					if (key !== 'Date') {
						this[key]	= cpyObj(input[key]);
					} else {
						this[key]	= input[key].map(el => new Date(el));
					}

				} else {
					this[key]	= [];	// Empty Initialization
				}
			}
		}
	}
}

module.exports = OHLCTData;
