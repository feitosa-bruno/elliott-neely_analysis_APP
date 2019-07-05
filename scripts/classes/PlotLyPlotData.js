///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Dependencies
///////////////////////////////////////////////////////////////////////////////
const appDir				= require('electron').remote.app.getAppPath();
const defaultTypicalType	= require(`${appDir}/scripts/global_constants`).defaultTypicalType;

// Configuration
var colorKey = {
	OHLCDecreasing:	'#FF0000',
	OHLCIncreasing:	'#17BECF',
	OHLCLine:		'#666666',
	soloTypical:	'#000000',
	HLCTypical:		'#005500',
	HLTypical:		'#DD6600',
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Classes
///////////////////////////////////////////////////////////////////////////////

class PlotLyPlotData {
	constructor (data, name, key) {
		// Main Properties
		this.trace			= [];
		this.layout			= null;
		this.dataName		= name;
		this.yAxisType		= key.ring.yAxisType;
		this.graphType		= key.ring.graphType;
		this.xAxisType		= key.ring.xAxisType;
		this.dateType		= key.ring.xAxisType === "date" ? true : false;
		this.xAxis			= null;
		this.yAxis			= {};
			
		// Auxiliary Variables
		var timeframe	= key.ring.resolution;
		var dataType	= key.ring.trimData;
		var typicalType = key.ring.typicalType;
		var set 		= data[timeframe][defaultTypicalType][dataType];
		
		// Set Date X Axis and Y Range for Relayout Usage
		this.xAxis			= set['Date'];
		this.yAxis["High"]	= set['High'];
		this.yAxis["Low"]	= set['Low'];

		// Trace Setup (OHLC Data part)
		if (this.graphType !== "none") {			
			this.trace.push({
				name:	'OHLC',
				x:		set['Date'],
				close:	set['Close'],
				high:	set['High'],
				low:	set['Low'],
				open:	set['Open'],
	
				decreasing: {line: {color: colorKey.OHLCDecreasing}},
				increasing: {line: {color: colorKey.OHLCIncreasing}},
				
				type: key.ring.graphType,
				line: {
					color: colorKey.OHLCLine,
					width: 2,
				},
				tickwidth: '0.5',
			});
		}

		// Trace Setup (Typical Value part)
		if (typicalType === "combined") {
			set = data[timeframe]["HLC"][dataType];
			this.trace.push({
				name:	`Typical (HLC)`,
				x:		set['Date'],
				y:		set['Typical'],
				
				type: 'scatter',
				mode: 'lines',
				line: {
					color: colorKey.HLCTypical,
					dash: 'dash',
					width: 1,
				},
			});
			set = data[timeframe]["HL"][dataType];
			this.trace.push({
				name:	`Typical (HL)`,
				x:		set['Date'],
				y:		set['Typical'],
				
				type: 'scatter',
				mode: 'lines',
				line: {
					color: colorKey.HLTypical,
					dash: 'dashdot',
					width: 1,
				},
			});
		} else if (typicalType !== "none") {
			set = data[timeframe][typicalType][dataType];
			this.trace.push({
				name:	`Typical (${typicalType})`,
				x:		set['Date'],
				y:		set['Typical'],
				
				type: 'scatter',
				mode: 'lines',
				line: {
					color: colorKey.soloTypical,
					width: 1,
				},
			});
		}

		// Layout Setup
		this.layout = {
			title: `Source: ${name}`,
            dragmode: 'zoom',
            margin: {
                r: 10,
                t: 25,
                b: 40,
                l: 50
            },
            showlegend: false,
            xaxis: {
				visible: this.dateType ? true : false,
				title: 'Date',
				type: this.dateType ? 'date' : 'category',
				
				domain: [0, 1],
				rangeslider: {
                    visible: false,
                },
				
				autorange: {},
                range: [],
            },
            yaxis: {
				visible: true,
				title: 'Price',

				showticklabels: true,
				ticks: 'inside',
				type: this.yAxisType,
				
				autorange: {},
                range: [],
			},
		};
	}

	update (data, key) {
		// Main Properties
		this.yAxisType		= key.ring.yAxisType;
		this.graphType		= key.ring.graphType;
		this.xAxisType		= key.ring.xAxisType;
		this.dateType		= key.ring.xAxisType === "date" ? true : false;

		// Auxiliary Variables
		var timeframe	= key.ring.resolution;
		var dataType	= key.ring.trimData;
		var set = data[timeframe][defaultTypicalType][dataType];
		
		// Set Date X Axis and Y Range for Relayout Usage
		this.xAxis			= set['Date'];
		this.yAxis["High"]	= set['High'];
		this.yAxis["Low"]	= set['Low'];
	}
}

module.exports = PlotLyPlotData;