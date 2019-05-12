///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Dependencies
///////////////////////////////////////////////////////////////////////////////
const appDir			= require('electron').remote.app.getAppPath();
const Monowave			= require(`${appDir}/scripts/classes/Monowave`);
const DirectionalAction	= require(`${appDir}/scripts/classes/DirectionalAction`);


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Classes
///////////////////////////////////////////////////////////////////////////////

class MonowaveVector {
	constructor(reference) {
		if (reference === undefined) {
			// No Reference
			alert(`${this} initialized without valid reference.`);
			console.warn(`${this} initialized without valid reference.`);
		} else if (reference.constructor.name === 'OHLCTData') {
			// Initialize from OHLCTData Object

			this.monowave = [new Monowave(reference)];
			var currentMonowave = this.monowave[0];
			var index = 1;
			
			// Populate Monowave Vector until end of Data
			while (index < reference["Date"].length) {
				// Add point to monowave, and check it
				var checkResult = currentMonowave.checkPoint(reference, index);

				// If a new monowave is returned, last monowave ended
				if (checkResult instanceof Monowave) {
					// Add new monowave on vector
					this.monowave.push(checkResult);

					// Update current monowave to the one returned after the check
					currentMonowave = checkResult;

					// Rewind Index Position
					index--;
				}

				// Increment to next data point
				index++;
			}

			// Force last Monowave to close on last Data point
			currentMonowave.lastPoint(reference, index);

			this.directionalAction		= [];
			this.nonDirectionalAction	= [];	
		}
	}


	///////////////////////////////////////////////////////////////////////////
	//  Methods  /////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////

	evaluateDirectionalActions() {
		var mwIndex = 0;	// Monowave Index
		var daIndex = 0;	// Directional Action Index

		// Starting Value
		this.directionalAction.push(new DirectionalAction(this.monowave[mwIndex]));
		mwIndex++;

		while (mwIndex < this.monowave.length) {
			var test = this.directionalAction[daIndex].check(this.monowave[mwIndex]);
			if (test) {
				this.directionalAction[daIndex].close(this.monowave[mwIndex-1]);
				this.directionalAction.push(test);
				daIndex++;
			}
			mwIndex++;
		}

		// Close last Directional Action
		if (this.directionalAction.valueEnd === null) {
			this.directionalAction[daIndex].close(this.monowave[mwIndex]);
		}
	}

	// Ignored as Discussion on 07/04/2019
	// evaluateNonDirectionalActions() {
	// 	// IGNORING for now
	// }
}

module.exports = MonowaveVector;
