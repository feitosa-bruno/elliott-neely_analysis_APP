///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Dependencies
///////////////////////////////////////////////////////////////////////////////
// None


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Classes
///////////////////////////////////////////////////////////////////////////////

class Monowave {
	constructor (reference) {
		this.advance			= 0;			// Positive: Increasing; Negative: Decreasing
		this.direction			= null;			// Increasing: true; Decreasing: false
		this.relativeAdvance	= 0;
		this.OHLCTData			= {};
		this.closed				= false;
		this.timeEnd			= undefined;
		this.valueEnd			= undefined;

		if (reference !== undefined)
		if (reference.constructor.name === 'OHLCTData') {
			// Monowave Initialized from OHLCT object (first Monowave of a series)
			this.timeStart			= new Date(reference['Date'][0]);
			this.valueStart			= reference['Typical'][0];
			this.relativeAdvance	= null;		// By standard, first advance is 100%
			for (var key in reference) {
				if (reference[key][0] instanceof Date) {
					this.OHLCTData[key] = [new Date(reference[key][0])];
				} else {
					this.OHLCTData[key] = [reference[key][0]];
				}
			}
		} else if (reference instanceof Monowave) {
			// Monowave Initialized from another Monowave (sequential Monowave)
			this.timeStart			= new Date(reference.timeEnd);
			this.valueStart			= reference.valueEnd;
			this.relativeAdvance	= reference.advance;	// Save advance of last monowave
			for (var key in reference.OHLCTData) {
				var lastMonowaveData = reference.OHLCTData[key].length - 1;
				if (reference.OHLCTData[key][lastMonowaveData] instanceof Date) {
					this.OHLCTData[key] = [new Date(reference.OHLCTData[key][lastMonowaveData])];
				} else {
					this.OHLCTData[key] = [reference.OHLCTData[key][lastMonowaveData]];
				}
			}
		}
	}


	///////////////////////////////////////////////////////////////////////////
	//  Methods  /////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////

	// Check an Input point as monowave advance or signaling end of monowave
	checkPoint (input, index) {
		// Current Variation/Delta
		var variation = input['Typical'][index] - input['Typical'][index - 1];
		
		// Direction Change verification
		var directionChange = variation * this.advance;

		// Check Current Monowave Direction
		if (directionChange === 0) {		// Monowave Direction is still undetermined
			// Save OHLC Data to Monowave
			this.saveOHLCTData(input, index);
			
			return true;					// Monowave is still going
		} else if (directionChange > 0) {	// Monowave Direction is maintained
			// Save OHLC Data to Monowave
			this.saveOHLCTData(input, index);
			
			this.direction	= this.advance > 0;
			return true;					// Monowave still going
		} else if (directionChange < 0) {	// Monowave Direction Changed
			var lastIndex = index - 1;
			
			this.closed				= true;
			this.timeEnd			= new Date(input['Date'][lastIndex]);
			this.valueEnd			= input['Typical'][lastIndex];
			this.advance			= this.valueEnd - this.valueStart;
			this.direction			= this.advance > 0;

			// this.relativeAdvance stores the advance from last monowave...
			var lastAdvance			= this.relativeAdvance;
			if (lastAdvance === null) {			// ...unless it was the first monowave
				this.relativeAdvance	= 100;	// in which case it is empty (null)
			} else {
				this.relativeAdvance	= 100 * this.advance/lastAdvance;
			}
				
			// End of monowave also means generating next monowave from current point
			// It essentially means creating a new monowave from the current one
			return new Monowave(this);
		}
	}
	
	saveOHLCTData (input, index) {
		for (var key in this.OHLCTData) {
			this.OHLCTData[key].push(input[key][index]);
		}
		this.advance = input['Typical'][index] - this.valueStart;
	}

	// Force end of Monowave
	// To be called at the end of the OHLCT data
	lastPoint (input, index) {
		var lastIndex = index - 1;

		this.closed		= true;
		this.timeEnd	= new Date(input['Date'][lastIndex]);
		this.valueEnd	= input['Typical'][lastIndex];
		this.advance	= this.valueEnd - this.valueStart;
		this.direction	= this.advance > 0;
		// this.relativeAdvance has stored the advance from last monowave
		var lastAdvance			= this.relativeAdvance;
		this.relativeAdvance	= 100 * this.advance/lastAdvance;
	}
}

module.exports = Monowave;
