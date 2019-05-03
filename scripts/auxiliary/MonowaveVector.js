const appDir = require('electron').remote.app.getAppPath();
const Monowave = require(`${appDir}/scripts/auxiliary/Monowave`);

class MonowaveVector {
	constructor(reference) {
		if (reference instanceof OHLCTData) {
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
		}
	}
}

module.exports = MonowaveVector;
