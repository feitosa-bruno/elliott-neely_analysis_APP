let normalize = function (input)  {
	
	var min = input[0];
	var max = input[0];

	var result = [];

	input.map(el => {
		min = Math.min(min, el);
		max = Math.max(max, el);
	});

	var weight = 1.0/(max - min);

	input.map(el => {
		result.push((el -min)*weight);
	})

	return result;
}
module.exports = normalize;