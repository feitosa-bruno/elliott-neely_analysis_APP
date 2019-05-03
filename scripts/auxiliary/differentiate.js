let differentiate = function (input)  {
	
	var result = [];
	
	for (var index = 1 ; index < input.length ; index++) {
		var diff = input[index] - input[index - 1];
		if (diff > 0) result.push(1);
		else if (diff < 0) result.push(-1);
		else result.push(0);
	}

	return result;
}
module.exports = differentiate;