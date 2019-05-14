///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Dependencies
///////////////////////////////////////////////////////////////////////////////
const appDir = require('electron').remote.app.getAppPath();
const Monowave = require(`${appDir}/scripts/classes/Monowave`);


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Classes
///////////////////////////////////////////////////////////////////////////////

class DirectionalAction {
	constructor(reference) {
		if (reference instanceof Monowave) {
			this.direction		= reference.advance > 0;	// true === positive
			this.ratio			= null;
			this.dateStart		= reference.timeStart;
			this.dateEnd		= null;
			this.valueStart		= reference.valueStart;
			this.valueEnd		= null;
			this.monowaveCount	= 1;
		}
	}


	///////////////////////////////////////////////////////////////////////////
	//  Methods  /////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////

	// Checks whether  monowave closes the directional action or not
	check(monowave) {
		// Directional Action Doesn't end until the next monowave retraces 100% of the current one
		// Check if monowave direction is the same as Directional Action Direction
		if (this.direction != monowave.direction) {
			// Different Direction, now check the strength of the change
			if (monowave.relativeAdvance < -100) {		// Directional Action changed
				// Finish the Directional Action by starting the next one
				return new DirectionalAction(monowave);
			} else if (monowave.relativeAdvance < -61.8 && (this.monowaveCount === 1)) {
				// First monowave strength was not sufficient
				// Update current Directional Action to start on current monowave
				this.update(monowave);
				return false;	
			}
		} else {
			this.monowaveCount++;
			// No change in Directional Action
			return false;
		}
	}

	// Update Directional Action from a monowave
	update(monowave) {
		// Basically, re-run the constructor function
		this.direction		= monowave.advance > 0;	// true === positive
		this.ratio			= null;
		this.dateStart		= monowave.timeStart;
		this.dateEnd		= null;
		this.valueStart		= monowave.valueStart;
		this.valueEnd		= null;
		this.monowaveCount	= 1;
	
	}

	// End the Directional Action
	close(monowave) {
		this.dateEnd	= monowave.timeEnd;
		this.valueEnd	= monowave.valueEnd;
		var deltaPrice 	= this.valueEnd - this.valueStart;
		var deltaTime 	= this.dateEnd - this.dateStart;
		this.ratio		= deltaPrice / deltaTime;
	}
}

module.exports = DirectionalAction;
