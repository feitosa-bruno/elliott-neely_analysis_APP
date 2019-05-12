function closestValue (array, target) {
	return array.reduce((previous, current) => {
		return (Math.abs(current - target) < Math.abs(previous - target) ? current : previous);
	});
}

function closestIndex (array, target) {
	var value = closestValue(array, target);
	return array.indexOf(value);
}

module.exports = closestIndex;