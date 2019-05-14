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
const cpyObj				= require(`${appDir}/scripts/auxiliary/copyObject`);


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Classes
///////////////////////////////////////////////////////////////////////////////

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
	

	///////////////////////////////////////////////////////////////////////////
	//  Methods  /////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////


	initialize(input, timeframe) {
		for (var typicalTypes in this[timeframe]) {
			this[timeframe][typicalTypes]["full"] = new OHLCTData(input);
		}
	}

	// TODO: (CRITICAL) TO REVISE (broken)
	reduceOHLC(firstTimeframe) {
		var firstInput = this[firstTimeframe][defaultTypicalType]["full"];

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
		// DEBUG: this logic is showing bad behavior, need to debug
		for (var typicalType in this[firstTimeframe]) {
			for (var index in firstInput["Date"]) {
				if (index == 0)	// Skip initial value already used in initialization
					continue;
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
				// Execute the First Run of Rule of Neutrality
				var preRNmwVector = new MonowaveVector(this[timeframe][typicalType]["full"]);
				// Calculate Directional Actions based on First Run of Rule of Neutrality
				preRNmwVector.evaluateDirectionalActions();
				
				// Execute 2nd Run of Rule of Neutrality
				var mwVector = new MonowaveVector();
				mwVector.initializeWithRuleOfNeutrality(
					this[timeframe][typicalType]["full"],
					preRNmwVector
				);
				this[timeframe][typicalType]["mwVector"] = mwVector;
				this[timeframe][typicalType]["trim"] = new OHLCTData(mwVector);
			}
		}		
	}
}

module.exports = OHLCStructure;
