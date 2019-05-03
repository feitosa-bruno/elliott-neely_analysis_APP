const appDir				= require('electron').remote.app.getAppPath();
const TypicalTypes			= require(`${appDir}/scripts/global_constants`).TypicalTypes;
const Resolutions			= require(`${appDir}/scripts/global_constants`).ResolutionSequence;


class typeStructure {
	constructor () {
		this.full		= null;
		this.mwVector	= null;
		this.trim		= null;
	}
}

class TimeFrameStructure {
	constructor () {
		// I don't know if this is beautiful or ugly, but I love it anyways
		TypicalTypes.map(typicalType => {
			return this[typicalType] = new typeStructure();
		});
	}
}

class OHLCStructure {
	constructor () {
		// I don't know if this is beautiful or ugly, but I love it anyways
		Resolutions.map(resolution => {
			return this[resolution]	= new TimeFrameStructure();
		});
	}
}

module.exports = OHLCStructure;
