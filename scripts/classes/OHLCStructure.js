///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Dependencies
///////////////////////////////////////////////////////////////////////////////
const appDir				= require('electron').remote.app.getAppPath();
const OHLCTData				= require(`${appDir}/scripts/classes/OHLCTData`);
const MonowaveVector		= require(`${appDir}/scripts/classes/MonowaveVector`);
const TypicalTypes			= require(`${appDir}/scripts/global_constants`).TypicalTypes;
const defaultTypicalType	= require(`${appDir}/scripts/global_constants`).defaultTypicalType;
const Resolutions			= require(`${appDir}/scripts/global_constants`).ResolutionSequence;
const resolutionDelta		= require(`${appDir}/scripts/global_constants`).ResolutionDuration;
const DataTypes				= require(`${appDir}/scripts/global_constants`).DataTypes;
const cpyObj				= require(`${appDir}/scripts/auxiliary/copyObject`);


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Classes
///////////////////////////////////////////////////////////////////////////////

class typeStructure {
	constructor() {
		// I don't know if this is beautiful or ugly, but I love it anyways
		DataTypes.map(dataType => {
			return this[dataType] = null;
		});
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
	

	///////////////////////////////////////////////////////////////////////////
	//  Methods  /////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////


	initialize(input, timeframe) {
		for (var typicalTypes in this[timeframe]) {
			this[timeframe][typicalTypes]["full"] = new OHLCTData(input);
		}
	}

	reduceOHLC(firstTimeframe) {
		var typicalType = defaultTypicalType;
		var firstInput = this[firstTimeframe][typicalType]["full"];

		// Conversion Counters and Indexes
		var t0 = {};
		var subIndex = {};

		// Initialization of Counters, Indexes and First Values
		for (var index in Resolutions) {
			if (index > Resolutions.indexOf(firstTimeframe)) {
				var timeframe = Resolutions[index];
				t0[timeframe] = firstInput["Date"][0];
				subIndex[timeframe] = 0;

				// The Reference Samba: save reference first...
				var newEntry = this[timeframe][typicalType]["full"];
				// ...dance with it...
				newEntry = new OHLCTData();
				for (var key in newEntry) {
					newEntry[key].push(firstInput[key][0]);
				}
				// ...and return it
				this[timeframe][typicalType]["full"] = newEntry;
			}
		}

		// console.log(t0);
		// console.log(subIndex);
		// console.log(this);
		// console.log(firstInput);

		// The Ugly Part
		// NOTE:	i is the most significant index (most variant)
		// 			_i is the subIndex for that given timeframe reduction
		for (var i = 1; i < firstInput["Date"].length; i++) {
			for (var timeframe in t0) {
				if (firstInput["Date"][i] - t0[timeframe] < resolutionDelta[timeframe]) {
					// Inside Timeframe: Evaluation Case

					var currEntry = this[timeframe][typicalType]["full"];
					var _i = subIndex[timeframe];

					// Increment OHLC Reduction Progressively

					// 'High' is the maximum of the section
					currEntry["High"][_i] = Math.max(
						firstInput["High"][i],
						currEntry["High"][_i]
					);
					// 'Low' is the minimum of the section
					currEntry["Low"][_i] = Math.min(
						firstInput["Low"][i],
						currEntry["Low"][_i]
					);

					// Otherwise, it's the sum of the section
					currEntry["TickVolume"][_i] += firstInput["TickVolume"][i];
					currEntry["Volume"][_i] += firstInput["Volume"][i];
					currEntry["Spread"][_i] += firstInput["Spread"][i];

					// Return reference back
					this[timeframe][typicalType]["full"] = currEntry;
				} else {
					// End of Timeframe: Closing/Opening Case

					var currEntry = this[timeframe][typicalType]["full"];
					var _i = subIndex[timeframe];

					// Current Timeframe Close gets last Close
					currEntry["Close"][_i] = firstInput["Close"][i - 1];

					// Next SubIndex
					subIndex[timeframe]++;

					// Update t0 for that given timeframe
					t0[timeframe] = firstInput["Date"][i];

					// Initialize Values
					for (var key in currEntry) {
						if (key === "Date") {			// Format Date object
							currEntry[key].push(new Date(firstInput[key][i]));
						} else if (key !== "Close") {	// Close is skipped, already init
							currEntry[key].push(firstInput[key][i]);
						}
					}
					// Return the reference back
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

		// Copy work done for default Typical Type to other Typical Types
		for (var timeframe in t0) {
			for (var typicalType in this[timeframe]) {
				if (typicalType !== defaultTypicalType) {
					var reference = this[timeframe][defaultTypicalType]["full"];
					this[timeframe][typicalType]["full"] = new OHLCTData(reference);
				}
			}
		}
	}

	calculateTypical() {
		for (var timeframe in this) {
			for (var typicalType in this[timeframe]) {
				if (TypicalTypes.includes(typicalType)) {
					var set = this[timeframe][typicalType]["full"];
					switch (typicalType) {
						case 'HLC':
							set["Typical"] = set["Date"].map((el, i) => {
								return (set['High'][i] + set['Low'][i] + set['Close'][i]) / 3.0;
							});
							this[timeframe][typicalType]["full"] = set;
							break;
						case 'HL':
							set["Typical"] = set["Date"].map((el, i) => {
								return (set['High'][i] + set['Low'][i]) / 2.0;
							});
							this[timeframe][typicalType]["full"] = set;
							break;
					}		
				} else {
					console.warn('Uncaught new Typical Type!');
					alert('Uncaught new Typical Type!');
				}			
			}
		}
	}

	removeTrailingData() {
		for (var timeframe in this) {
			for (var typicalType in this[timeframe]) {
				var set = this[timeframe][typicalType]["full"].Typical;
				// console.log(set);
				var cutPosition = set.indexOf(Math.min(...set));
				// console.log(cutPosition);
				for (var key in this[timeframe][typicalType]["full"]) {
					for (var i = cutPosition; i > 0; i--) {
						this[timeframe][typicalType]["full"][key].shift();
					}
				}
			}
		}
	}

	// TODO: Apply Rule of Neutrality on Monowave Vector
	generateMonowaveVectors() {
		for (var timeframe in this) {
			for (var typicalType in this[timeframe]) {
				// Execute the First Step of Rule of Neutrality
				var noRNmwVector = new MonowaveVector(this[timeframe][typicalType]["full"]);
				// Calculate Directional Actions based on First Step of Rule of Neutrality
				noRNmwVector.evaluateDirectionalActions();
				this[timeframe][typicalType]["noRNmwVector"] = noRNmwVector;
				
				// Execute 2nd Run of Step of Neutrality
				var mwVector = new MonowaveVector();
				mwVector.initializeWithRuleOfNeutrality(
					this[timeframe][typicalType]["full"],
					noRNmwVector
				);
				this[timeframe][typicalType]["mwVector"] = mwVector;
				this[timeframe][typicalType]["simple"] = new OHLCTData(noRNmwVector);
				this[timeframe][typicalType]["Neely"] = new OHLCTData(mwVector);
			}
		}		
	}
}

module.exports = OHLCStructure;
