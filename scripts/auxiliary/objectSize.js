// See 	https://stackoverflow.com/questions/1248302/how-to-get-the-size-of-a-javascript-object

function roughSizeOfObject(object) {
	var objectList = [];
	var stack = [object];
	var bytes = 0;

	while (stack.length) {
		var value = stack.pop();

		if (typeof value === 'boolean') {
			bytes += 4;
		}
		else if (typeof value === 'string') {
			bytes += value.length * 2;
		}
		else if (typeof value === 'number') {
			bytes += 8;
		}
		else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
			objectList.push(value);
			for (var i in value) {
				stack.push(value[i]);
			}
		}
	}
	return bytes;
}

function reportSizeOf(object) {
	var size = roughSizeOfObject(object);
	var unit = "Bytes";
	if (size > 1023) {
		size = size / 1024;
		unit = "KBytes"
		if (size > 1023) {
			size = size / 1024;
			unit = "MBytes"
			if (size > 1023) {
				size = size / 1024;
				unit = "GBytes"
			}
		}
	}
	return `${size.toFixed(2)} ${unit}`;
}

module.exports = reportSizeOf;