///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Dependencies
///////////////////////////////////////////////////////////////////////////////
// None

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
		this.trace		= [];
		this.layout		= null;
		this.dataName	= name;
		this.xAxisType	= key.dateType;
		this.yAxisType	= key.yAxisType;
		this.graphType	= key.graphType;
		this.dateType	= key.dateType;
		this.xAxis		= null;
		
		// Auxiliary Variables
		var timeframe	= key.resolution;
		var typicalType = defaultTypicalType;
		if ((key.typicalType !== "combined") && (key.typicalType !== "none")){
			typicalType = key.typicalType;
		}
		var set = data[timeframe][typicalType]["full"];
		
		// Set Date X Axis and Y Range for Relayout Usage
		this.xAxis = set['Date'];
		this.yAxis = {};
		this.yAxis["High"]	= set['High'];
		this.yAxis["Low"]	= set['Low'];

		// Trace Setup
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
				
				type: key.graphType,
				line: {color: colorKey.OHLCLine},
				tickwidth: '0.5',
			});
		}

		if (typicalType === "combined") {
			set = data[timeframe]["HLC"]["full"];
			this.trace.push({
				name:	`Typical (HLC)`,
				x:		set['Date'],
				y:		set['Typical'],
				
				type: 'scatter',
				mode: 'lines',
				line: {color: colorKey.HLCTypical, dash: 'dash'},
			});
			set = data[timeframe]["HL"]["full"];
			this.trace.push({
				name:	`Typical (HL)`,
				x:		set['Date'],
				y:		set['Typical'],
				
				type: 'scatter',
				mode: 'lines',
				line: {color: colorKey.HLTypical, dash: 'dashdot'},
			});
		} else if (typicalType !== "none") {
			set = data[timeframe][typicalType]["full"];
			this.trace.push({
				name:	`Typical (${typicalType})`,
				x:		set['Date'],
				y:		set['Typical'],
				
				type: 'scatter',
				mode: 'lines',
				line: {color: colorKey.soloTypical},
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
				visible: this.xAxisType ? true : false,
				title: 'Date',
				type: this.xAxisType ? 'date' : 'category',
				
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
}

module.exports = PlotLyPlotData;