const appDir				= require('electron').remote.app.getAppPath();
const TypicalTypes			= require(`${appDir}/scripts/global_constants`).TypicalTypes;

// Maybe there is a better way to implement this
// Maybe as a method for the "OHLCStructure"
// Will stay this way until otherwise
let calculateTypical = function (input, typicalType) {
	if (TypicalTypes.includes(typicalType)) {
		switch (typicalType) {
			case 'HLC':
				input["Typical"] = input["Date"].map((el, index) => {
					return (input['High'][index] + input['Low'][index] + input['Close'][index]) / 3.0;
				});
				break;
			case 'HL':
				input["Typical"] = input["Date"].map((el, index) => {
					return (input['High'][index] + input['Low'][index]) / 2.0;
				});
				break;
		}		
	} else {
		console.warn('Uncaught new Typical Type!');
		alert('Uncaught new Typical Type!');
	}
}
module.exports = calculateTypical;