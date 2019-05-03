const appDir				= require('electron').remote.app.getAppPath();
const Monowave				= require(`${appDir}/scripts/auxiliary/Monowave`);


var OHLCT2MonowaveVec = function (OHLCT) {
	var currentMonowave = new Monowave(OHLCT);
	var outputMonowaveVector = [currentMonowave];
	var index = 1;	// Starts on 1 because 0 is used on the first Monowave initialization

	// Populate Monowave Vector until end of Data
	while (index < OHLCT["Date"].length) {
		// Add point to monowave, and check it
		var checkResult = currentMonowave.checkPoint(OHLCT, index);
		
		// If a new monowave is returned, last monowave ended
		if (checkResult instanceof Monowave) {
			// Add new monowave on vector
			outputMonowaveVector.push(checkResult);
			
			// Update current monowave to the one returned after the check
			currentMonowave = checkResult;

			// Rewind Index Position
			index--;
		}

		// Increment to next data point
		index++;
	}
	
	// Force last Monowave to close on last Data point
	currentMonowave.lastPoint(OHLCT, index);

	return outputMonowaveVector;
}

module.exports = OHLCT2MonowaveVec;
