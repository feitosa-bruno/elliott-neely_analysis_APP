function detectTimeframe (time1, time2)  {
	var timeframe = (time2 - time1)/60000;
	// console.log(timeframe);
	switch (timeframe) {
		case 1:
			return '_M1';
		case 60:
			return '_H1';
		case 1440:
			return '_D1';
		case 10080:
			return '_W1';
		default:
			console.warn('Unknown Timeframe on Data');
			return false;
	}
}

module.exports = detectTimeframe;
