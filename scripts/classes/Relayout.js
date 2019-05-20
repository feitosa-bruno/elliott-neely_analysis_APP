///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Dependencies
///////////////////////////////////////////////////////////////////////////////
const appDir				= require('electron').remote.app.getAppPath();
const closestIndex			= require(`${appDir}/scripts/auxiliary/closestIndex`);
const cpyObj				= require(`${appDir}/scripts/auxiliary/copyObject`);

// Configuration
let standardRelayout = {
	"xaxis.autorange": true,
	"yaxis.autorange": true,
	"xaxis.range[0]": undefined,
	"xaxis.range[1]": undefined,
	"yaxis.range[0]": undefined,
	"yaxis.range[1]": undefined,
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Classes
///////////////////////////////////////////////////////////////////////////////

class Relayout {
	constructor () {
		this.notTied				= true;
		this.xAxis					= null;
		this.yAxis					= null;
		this.key					= null;
		this.current				= 0;
		this.savedRelayout			= standardRelayout;
		this.relayoutHistory		= [];
		this.relayoutDateHistory	= [];
	}

	importPlotlyPlotData(plotlyPlotData, key) {
		this.xAxis		= plotlyPlotData.xAxis;
		this.yAxis		= plotlyPlotData.yAxis;
		this.key		= key;
		this.notTied	= false;
	}

	update(relayout) {
		// Save relayout information
		for (var key in this.savedRelayout) {
			// Save property if available
			if (relayout.hasOwnProperty(key)) {
				this.savedRelayout[key] = relayout[key];
			}
			// Erase autorange property if not present on relayout
			if (!relayout.hasOwnProperty(key) && key.includes('autorange')) {
				this.savedRelayout[key] = {};
			}
		}

		// Save current relayout to history (maximum 10 items)
		this.save(this.savedRelayout);
	}

	save(relayout) {
		// Remove All Saved Relayouts forwards to the current
		while (this.current !== 0) {
			this.relayoutHistory.shift();
			this.relayoutDateHistory.shift();
			this.current--;
		}

		// Limit number of Relayouts to 10
		if (this.relayoutHistory.length >= 10) {
			this.relayoutHistory.pop();
			this.relayoutDateHistory.pop();
		}
		
		// Save History of Relayouts
		this.relayoutHistory.unshift(cpyObj(relayout));

		// Save Relayout Date History
		if (this.key.ring.xAxisType === "date") {
			// Already in Date Mode
			this.relayoutDateHistory.unshift([
				new Date(relayout["xaxis.range[0]"]),
				new Date(relayout["xaxis.range[1]"])
			]);
		} else {
			// In Category (numeric) Mode, need to change to Date
			var xMin = Math.floor(relayout["xaxis.range[0]"]);
			var xMax = Math.floor(relayout["xaxis.range[1]"]) + 1;
			this.relayoutDateHistory.unshift([
				new Date(this.xAxis[xMin]), 
				new Date(this.xAxis[xMax])
			]);
		}
	}

	// Set Relayout x Axis and y Axis information on PlotLy Layout
	set(plotData) {
		var relayout = this.getCurrentRelayout();
		for (var key in relayout) {
			switch (key) {
				case "xaxis.autorange":
					plotData.layout.xaxis.autorange = relayout[key];
					break;
				case "yaxis.autorange":
					plotData.layout.yaxis.autorange = relayout[key];
					break;
				case "xaxis.range[0]":
					plotData.layout.xaxis.range[0] = relayout[key];
					break;
				case "xaxis.range[1]":
					plotData.layout.xaxis.range[1] = relayout[key];
					break;
				case "yaxis.range[0]":
					plotData.layout.yaxis.range[0] = relayout[key];
					break;
				case "yaxis.range[1]":
					plotData.layout.yaxis.range[1] = relayout[key];
					break;
			}
		}
	}

	fitYAxis() {
		var relayout = this.getCurrentRelayout();
	
		// Quit if Current Layout is undefined
		if(!relayout) return;

		// Get the xAxis boundaries
		var x0 = closestIndex(this.xAxis, new Date(relayout["xaxis.range[0]"])) - 1;
		var x1 = closestIndex(this.xAxis, new Date(relayout["xaxis.range[1]"])) + 1;
		var yMaxSlice = this.yAxis.High.slice(x0, x1);
		var yMinSlice = this.yAxis.Low.slice(x0, x1);

		// Get the Max and Min inside the boundaries
		var maxY = Math.max(...yMaxSlice);
		var minY = Math.min(...yMinSlice);
		
		// console.log(relayout["yaxis.range[0]"], relayout["yaxis.range[1]"]);
		if (this.key.ring.yAxisType === "log") {
			relayout["yaxis.range[0]"] =  Math.log10(minY);
			relayout["yaxis.range[1]"] =  Math.log10(maxY);
		} else {
			relayout["yaxis.range[0]"] =  minY;
			relayout["yaxis.range[1]"] =  maxY;
		}

		// Save current relayout to history (maximum 10 items)
		this.save(relayout);
	}

	updateYAxis() {
		if (this.key.updated.yAxisType) {
			console.log(this.key.ring.yAxisType);
			if (this.key.ring.yAxisType === 'log'){
				// Changed from Linear to Log
				this.relayoutHistory.map(el => {
					el['yaxis.range[0]'] = Math.log10(el['yaxis.range[0]']);
					el['yaxis.range[1]'] = Math.log10(el['yaxis.range[1]']);
				});
			} else {
				// Changed from Log to Linear
				this.relayoutHistory.map(el => {
					el['yaxis.range[0]'] = 10**el['yaxis.range[0]'];
					el['yaxis.range[1]'] = 10**el['yaxis.range[1]'];
				});
			}	
		}
	}

	updateXAxis() {
			// if (this.key.ring.dateType){
			// 	// Changed to Date
			// 	this.relayoutHistory.map(el => {
			// 		var xMin = Math.floor(el['xaxis.range[0]']);
			// 		var xMax = Math.floor(el['xaxis.range[1]']) + 1;
			// 		el['xaxis.range[0]'] = this.xAxis[xMin];
			// 		el['xaxis.range[1]'] = this.xAxis[xMax];
			// 	});
			// } else {
			// 	// Changed to Category
			// 	this.relayoutHistory.map(el => {
			// 		var xMin = new Date(el['xaxis.range[0]']);
			// 		var xMax = new Date(el['xaxis.range[1]']);
			// 		el['xaxis.range[0]'] = closestIndex(this.xAxis, xMin);
			// 		el['xaxis.range[1]'] = closestIndex(this.xAxis, xMax);
			// 	});
			// }
	}

	// TODO: Revise
	changeXAxisResolution(data) {
		if (!this.getDateCheck()) {
			// Not using Date when changing Resolution, change X axis
			var currentKey = this.getKey();
			var resolution = currentKey.resolution;
			var typicalType = currentKey.typicalType;
			var relayoutHistory = this.relayoutHistory;
			var relayoutDateHistory = this.relayoutDateHistory;
			relayoutDateHistory.map((el, pos) => {
				var xMin = new Date(el[0]);
				var xMax = new Date(el[1]);
				var index = 0;
				// console.log(xMin, xMax);

				while (xMin > data[resolution][typicalType]['full']['Date'][index]) {
					index++;
				}
				xMin = index - 1;

				while (xMax > data[resolution][typicalType]['full']['Date'][index]) {
					index++;
				}
				xMax = index;
				// console.log(xMin, xMax);
				relayoutHistory[pos]['xaxis.range[0]'] = xMin;
				relayoutHistory[pos]['xaxis.range[1]'] = xMax;
			});
			// console.log(relayoutHistory);

		}
		// console.log(data);
		// console.log(`Changed from ${lastKey} to ${currentKey}`);

		// Trigger Graph Potting
		this.triggerGraphUpdate();
	}
	
	firstPosition() {
		return (this.current === 0);
	}

	lastPosition() {
		return (this.current > this.relayoutHistory.length - 1);
	}

	nextPosition() {
		this.current--;
	}

	previousPosition() {
		this.current++;
	}

	getCurrentRelayout() {
		return this.relayoutHistory[this.current];
	}
}

module.exports = Relayout;