const appDir				= require('electron').remote.app.getAppPath();
const OHLCTData				= require(`${appDir}/scripts/auxiliary/OHLCTData`);
const resolutionSequence	= require(`${appDir}/scripts/global_constants`).ResolutionSequence;
const resolutionDuration	= require(`${appDir}/scripts/global_constants`).ResolutionDuration;

function cpyObj (obj) {
	return JSON.parse(JSON.stringify(obj));
}

const rs = resolutionSequence;

// TODO: Refactor using Resolution Sequence
var reduceOHLC = function (input) {
	var output = {};

	// Output Initialization
	for (var keyPos = rs.indexOf(input.Timeframe) ; timeFrame = rs[++keyPos] ; ) {
		output[timeFrame] = new OHLCTData();
		for (var subKey in output[timeFrame]) {
			if (subKey in input) {
				output[timeFrame][subKey][0] = input[subKey][0];
			}
		}
	}

	// TODO: Refactor using Resolution Sequence
	var t0 = {
		_H1: input['Date'][0],
		_D1: input['Date'][0],
		_W1: input['Date'][0],
	};
	// TODO: Refactor using Resolution Sequence
	var subIndex = {
		_H1: 0,
		_D1: 0,
		_W1: 0,
	}

	for (var index = 0 ; index < input['Date'].length ; index++) {
		for (var timeFrame in output) {
			if (input['Date'][index] - t0[timeFrame] >= resolutionDuration[timeFrame]) {
				// Initialize Close with the last Close value on interval
				output[timeFrame]['Close'][subIndex[timeFrame]] = input['Close'][index - 1];

				// Next subIndex
				subIndex[timeFrame]++;

				// Update t0 for that given timeFrame
				t0[timeFrame] = input['Date'][index];

				// Initialize Values
				for (var subKey in output[timeFrame]) {
					if (subKey in input) {
						if (subKey === "Date") {			// Format Date object
							output[timeFrame][subKey].push(new Date(cpyObj(input[subKey][index])));
						} else if (subKey !== "Close" && input[subKey][index]) {
							output[timeFrame][subKey].push(input[subKey][index]);
						}	
					}
				}
			} else {
				// Increment OHLC Reduction Progressively

				// 'High' is the maximum of the section
				output[timeFrame]['High'][subIndex[timeFrame]] = Math.max(
					input['High'][index], 
					output[timeFrame]['High'][subIndex[timeFrame]]
				);
				// 'Low' is the minimum of the section
				output[timeFrame]['Low'][subIndex[timeFrame]] = Math.min(
					input['Low'][index], 
					output[timeFrame]['Low'][subIndex[timeFrame]]
				);
				// Otherwise, it's the sum of the section
				output[timeFrame]['TickVolume'][subIndex[timeFrame]]	+= input['TickVolume'][index];
				output[timeFrame]['Volume'][subIndex[timeFrame]]		+= input['Volume'][index];
				output[timeFrame]['Spread'][subIndex[timeFrame]]		+= input['Spread'][index];
			}
		}
	}

	// 'Close' values for last point of OHLC Reduction
	for (var timeFrame in output) {
		output[timeFrame]['Close'].push(input['Close'][input['Close'].length - 1]);
	}

	return output;
}

module.exports = reduceOHLC;