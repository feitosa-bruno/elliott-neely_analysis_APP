///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Dependencies
///////////////////////////////////////////////////////////////////////////////
const appDir				= require('electron').remote.app.getAppPath();
const OHLCTData				= require(`${appDir}/scripts/classes/OHLCTData`);
const HeaderList			= require(`${appDir}/scripts/global_constants`).HeaderList;
const CriticalHeaderList	= require(`${appDir}/scripts/global_constants`).CriticalHeaderList;
const correctKey			= require(`${appDir}/scripts/auxiliary/correctKey`);
const renameProperty		= require(`${appDir}/scripts/auxiliary/renameProperty`);
const detectTimeframe		= require(`${appDir}/scripts/auxiliary/detectTimeframe`);


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Classes
///////////////////////////////////////////////////////////////////////////////

class CSVtoOHLCT {
	constructor (input) {
		this.isValidData	= true;		// Valid File Header check
		this.timeframe		= null;

		var parsedHeader	= Object.keys(input[0]);
		var output = {
			Date: [],
			Open: [],
			High: [],
			Low: [],
			Close: [],
			TickVolume: [],
			Volume: [],
			Spread: [],
		};

		// console.log(parsedHeader);
		
		// Remove Special Characters from Header and Lowercase it
		parsedHeader = parsedHeader.map(el => {
			return el.replace(/[^0-9a-zA-Z]/g,"").toLowerCase();
		});


		// List invalid headers in Parsed Data Header
		CriticalHeaderList.map(criticalHeader => {
			this.isValidData &= parsedHeader.includes(criticalHeader.toLowerCase());
		});

		if (this.isValidData) {
			// Go through Data
			input.map(el => {
				// console.log(el);
				
				// Correct Keys in Parsed Data
				for (var key in el) {
					renameProperty(
						el,
						key,
						correctKey(key)
					);
				}

				// console.log(el);
				
				// Correct Data Timestamp (for when Date = Date + Time)
				if (el.hasOwnProperty('Time')){
					el['Date'] = new Date(`${el['Date']} ${el['Time']}`);
					delete el['Time'];
				} else {
					el['Date'] = new Date(`${el['Date']}`);
				}

				// console.log(el);
				
				// Push Parsed Data
				HeaderList.map(header => {
					output[header].push(el[header]);
				});
				
				// console.log(output);
			});

			// Check if the timestamps are progressive or regressive
			var Tstep = new Date(output['Date'][1]) - new Date(output['Date'][0]);
			// Reverse the data if the time progression is regressive
			if (Tstep < 0) {
				for (var key in output) 
					output[key] = output[key].reverse();
			}

			// Detect Parsed Data Timeframe
			this.timeframe = detectTimeframe(output['Date'][0], output['Date'][1]);

			// Convert Parsed Data to OHLCTData
			this.OHLCT = new OHLCTData(output);
		}
	}
}

module.exports = CSVtoOHLCT;