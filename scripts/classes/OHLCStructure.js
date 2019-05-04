const appDir			= require('electron').remote.app.getAppPath();
const OHLCTData			= require(`${appDir}/scripts/classes/OHLCTData`);
const TypicalTypes		= require(`${appDir}/scripts/global_constants`).TypicalTypes;
const Resolutions		= require(`${appDir}/scripts/global_constants`).ResolutionSequence;
const resolutionDelta	= require(`${appDir}/scripts/global_constants`).ResolutionDuration;

function cpyObj(obj) {
	return JSON.parse(JSON.stringify(obj));
}

class typeStructure {
	constructor() {
		this.full = null;
		this.mwVector = null;
		this.trim = null;
	}
}

class TimeFrameStructure {
	constructor() {
		// I don't know if this is beautiful or ugly, but I love it anyways
		TypicalTypes.map(typicalType => {
			return this[typicalType] = new typeStructure();
		});
	}
}

class OHLCStructure {
	constructor() {
		// I don't know if this is beautiful or ugly, but I love it anyways
		Resolutions.map(resolution => {
			return this[resolution] = new TimeFrameStructure();
		});
	}

	initialize(input, timeframe) {
		for (var typicalTypes in this[timeframe]) {
			this[timeframe][typicalTypes]["full"] = new OHLCTData(input);
		}
	}

	reduceOHLC(firstTimeframe) {
		var firstInput = this[firstTimeframe][TypicalTypes[0]]["full"];

		// Conversion Counters and Indexes
		var t0 = {};
		var subIndex = {};

		// Initialization of Counters, Indexes and First Values
		for (var index in Resolutions) {
			if (index > Resolutions.indexOf(firstTimeframe)) {
				var timeframe = Resolutions[index];
				t0[timeframe] = firstInput["Date"][0];
				subIndex[timeframe] = 0;
				for (var typicalType in this[timeframe]) {
					// The Reference Samba: save reference first...
					var newEntry = this[timeframe][typicalType]["full"];
					// ...dance with it...
					newEntry = new OHLCTData();
					for (var key in newEntry) {
						newEntry[key][0] = firstInput[key][0];
					}
					// ...and return it
					this[timeframe][typicalType]["full"] = newEntry;
				}
			}
		}
		// console.log(t0);
		// console.log(subIndex);
		// console.log(this);
		// console.log(firstInput);

		// The Ugly Part
		// NOTE:	index is the most significant (most variant)
		// 			_index is the subIndex for that given timeframe reduction
		for (var typicalType in this[firstTimeframe]) {
			for (var index in firstInput["Date"]) {
				for (var timeframe in t0) {
					if (firstInput["Date"][index] - t0[timeframe] >= resolutionDelta[timeframe]) {
						var currEntry = this[timeframe][typicalType]["full"];
						var _index = subIndex[timeframe];

						// Initialize current Open with the last Close value
						currEntry["Close"][_index] = firstInput["Close"][index - 1];

						// Next SubIndex
						subIndex[timeframe]++;

						// Update t0 for that given timeframe
						t0[timeframe] = firstInput["Date"][index];

						// Initialize Values
						for (var key in currEntry) {
							if (key === "Date") {		// Format Date object
								currEntry[key].push(new Date(cpyObj(firstInput[key][index])));
							} else if (key !== "Close" && firstInput[key][index]) {
								currEntry[key].push(firstInput[key][index]);
							}
						}
						// Return the reference back
						this[timeframe][typicalType]["full"] = currEntry;
					} else {
						var currEntry = this[timeframe][typicalType]["full"];
						var _index = subIndex[timeframe];

						// Increment OHLC Reduction Progressively

						// 'High' is the maximum of the section
						currEntry["High"][_index] = Math.max(
							firstInput["High"][index],
							currEntry["High"][_index]
						);
						// 'Low' is the minimum of the section
						currEntry["High"][_index] = Math.min(
							firstInput["High"][index],
							currEntry["High"][_index]
						);

						// Otherwise, it's the sum of the section
						currEntry["TickVolume"][_index] += firstInput["TickVolume"][index];
						currEntry["Volume"][_index] += firstInput["Volume"][index];
						currEntry["Spread"][_index] += firstInput["Spread"][index];

						// Return reference back
						this[timeframe][typicalType]["full"] = currEntry;
					}
					// console.log(timeframe);
				}
			}

			// "Close" values for last point of OHLC Reduction
			for (var timeframe in t0) {
				this[timeframe][typicalType]["full"]["Close"].push(
					firstInput["Close"][firstInput["Close"].length - 1]
				);
			}
		}
	}
}

module.exports = OHLCStructure;
