/*
    Plot App using a 3-Module Architecture
	(based on Module Pattern)

	UI <--> Control <--> Data

	1. Control Module
		Contains:
			1.1.1. UI Module handle
			1.1.2. Data Module  handle
		Does:
			1.2.1. Add Event Handlers for:
				File Selection,
				Plot Graph(s) Button,
				and Plot Enabling
			1.2.2. Handle File Selection
			1.2.3. Handle Plot Graph(s) click
			1.2.4. Enable/Disable Plot Graph(s) button
			1.2.5. Enable/Disable Generate Output(s) button
			1.2.6. Append Downloadable Data to Generate Output(s) Button
			1.2.7. Initialization of Inputs and APP
	2. Data Module
		Contains:
			2.1.1. Data Structure (parsed from USER INPUT'd files)
			2.1.2. File List (parsed from USER INPUT'd files)
		Does:
			2.2.1. Parse CSV File into Data Structure (from USER INPUT via Global Controller)
			2.2.2. List Files Parsed into File List (from USER INPUT via Global Controller)
			2.2.3. Treat Parsed Data
			2.2.4. Clear Parsed Data
			2.2.5. Retrieve Parsed Data to Caller
			2.2.6. Retrieve File List of Parsed Data to Caller
			2.2.7. Retrieve CSV Files (unParsed from Parsed Data) with:
				Typical Price	(complete and trimmed)
				Vector Data		(complete and trimmed)
	3. UI Module
		Contains:
			3.1.1. List of Subplot DIVs IDs
		Does:
			3.2.1. List Input Files Information (from USER INPUT via Global Controller)
			3.2.2. Clear Input Files Information
			3.2.3. Create Subplot Blocks for Multiple Graphs
			3.2.4. Plot Graphs parsed to Data Structure (from Data Module)
			3.2.5. Clear Plot Area
        	3.2.6. Get Y-Axis Input from User
			3.2.7. Get Graph Type Input from User

*/


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Global Definitions
///////////////////////////////////////////////////////////////////////////////

// 	Requires
const Papa					= require('papaparse');
const JSZip					= require('jszip');
const appDir				= require('electron').remote.app.getAppPath();
const _HTMLClasses			= require(`${appDir}/scripts/DOM_info`)._HTMLClasses;
const _DS					= require(`${appDir}/scripts/DOM_info`)._DS;
const Resolutions			= require(`${appDir}/scripts/global_constants`).ResolutionSequence;
const CriticalHeaderList	= require(`${appDir}/scripts/global_constants`).CriticalHeaderList;
const HeaderList			= require(`${appDir}/scripts/global_constants`).HeaderList;
const OHLCTData				= require(`${appDir}/scripts/classes/OHLCTData`);
const OHLCStructure			= require(`${appDir}/scripts/classes/OHLCStructure`);
const renameProperty		= require(`${appDir}/scripts/auxiliary/rename_property`);
const correctKey			= require(`${appDir}/scripts/auxiliary/correct_key`);
const detectTimeframe		= require(`${appDir}/scripts/auxiliary/detect_timeframe`);
const Stopwatch				= require(`${appDir}/scripts/auxiliary/stopwatch`);
const Versions				= require(`${appDir}/scripts/auxiliary/versions`);

// User Controls List
const controls = [
	_DS.undoZoom,
	_DS.redoZoom,
	_DS.verticalFit,
];

// Data Options List
const dataOptions = [
	_DS.yAxisType,
	_DS.graphType,
	_DS.trimCheck,
	_DS.dateCheck,
	_DS.resolution,
	_DS.typicalType,
];
// Data Options that are Tied to X-Axis Change Graph List
const autoUpdateDataOptions = [
	_DS.resolution,
	_DS.trimCheck,
	_DS.typicalType
];

// 	Performance Evaluation
inputParsingSW		= new Stopwatch('Input Parsing');
inputProcessingSW	= new Stopwatch('Input Processing');
outputGenerationSW	= new Stopwatch('Output Generation');
graphPlottingSW		= new Stopwatch('Graph Plotting');


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Global Controller
///////////////////////////////////////////////////////////////////////////////

class GlobalController {
    constructor (_DataController, _UIController) {
        this._UIController		= _UIController;
		this._DataController	= _DataController;
		this.optionsDisabled	= false;
		this.controlsDisabled	= false;
    }

    setupEventListeners () {
        // File Selection Event Listener
        // Flagged whenever there is a change in the selected file
        // Event Callback Function is called handleFileSelect
        // 'this' is tied to the GlobalController object via the 'bind(this)' so the
        // GlobalController keeps access to the other Modules (UI and Data)
        document
        .getElementById(_DS.fileInput)
        .addEventListener('change', this.handleFileSelect.bind(this), false);

        // Previous Zoom Button Event Listener
        // Event Callback Function is called previousRelayout
        // 'this' is tied to the UIController object via the 'bind(this.etc)' so the
        // UIController keeps access to the Module
        document
        .getElementById(_DS.undoZoom)
		.addEventListener(
			'click',
			this._UIController.previousRelayout.bind(this._UIController),
			false
		);

		// Previous Zoom Button Event Listener
        // Event Callback Function is called nextRelayout
        // 'this' is tied to the UIController object via the 'bind(this.etc)' so the
        // UIController keeps access to the Module
        document
        .getElementById(_DS.redoZoom)
		.addEventListener(
			'click',
			this._UIController.nextRelayout.bind(this._UIController),
			false
		);

		// Fit Data Vertically Button Event Listener
        // Event Callback Function is called fitGraphVertically
        // 'this' is tied to the UIController object via the 'bind(this)' so the
        // UIController keeps access to the Module
        document
        .getElementById(_DS.verticalFit)
		.addEventListener(
			'click',
			this._UIController.fitGraphVertically.bind(this._UIController),
			false
		);

		// Auto-Update Options Event Listener
		// Event Callback Function is called changeXAxisResolution
		// Event is tied to changes that are Resolution sensitive
		// 'this' is tied to the UIController object via the 'bind(this)' so the
		// UIController keeps access to the Module
		autoUpdateDataOptions.map(option => {
			document
			.getElementById(option)
			.addEventListener(
				'change',
				this._UIController.changeXAxisResolution.bind(
					this._UIController,
					this._DataController.data),
				false)
		});
	
		// Date Axis Change Event Listener
        // Event Callback Function is called changeXAxisType
        // 'this' is tied to the UIController object via the 'bind(this)' so the
        // UIController keeps access to the Module
        document
        .getElementById(_DS.dateCheck)
		.addEventListener(
			'change',
			this._UIController.changeXAxisType.bind(this._UIController),
			false
		);
		// This isn't tied to auto-update graph because it needs to process data beforehand

		// Typical Type Change Event Listener
		// Event Callback Function is called changeTypicalType
		// 'this' is tied to the UIController object via the 'bind(this)' so the
		// UIController keeps access to the Module
        document
        .getElementById(_DS.typicalType)
		.addEventListener(
			'change',
			this._UIController.changeTypicalType.bind(this._UIController),
			false
		);
		// This doesn't update the graph, just disable/enable other options
	
		// Trimmed Change Event Listener
		// Event Callback Function is called changeTrimmedOption
		// 'this' is tied to the UIController object via the 'bind(this)' so the
		// UIController keeps access to the Module
        document
        .getElementById(_DS.trimCheck)
		.addEventListener(
			'change',
			this._UIController.changeTrimmedOption.bind(this._UIController),
			false
		);
		// This doesn't update the graph, just disable/enable other options

		// Y Axis Change Event Listener
		// Event Callback Function is called changeYAxis
        // 'this' is tied to the UIController object via the 'bind(this)' so the
        // UIController keeps access to the Module
        document
        .getElementById(_DS.yAxisType)
		.addEventListener(
			'change',
			this._UIController.changeYAxis.bind(this._UIController),
			false
		);
		// This isn't tied to auto-update graph because it needs to process data beforehand

		// Graph Update Event Listener
		// Event Callback Function is called handleGraphUpdate
		// Event is tied to change in Graph Type and Manual Triggering
		// 'this' is tied to the GlobalController object via the 'bind(this)' so the
		// GlobalController keeps access to the other Modules (UI and Data)
		document
		.getElementById(_DS.graphType)
		.addEventListener('change', this.handleGraphUpdate.bind(this), false);
		document
		.addEventListener('update_graph', this.handleGraphUpdate.bind(this), false);

		// Valid Data Entered Event Listener
        // Event Callback Function is called validDataParsed
        // 'this' is tied to the GlobalController object via the 'bind(this)' so the
		// GlobalController keeps access to the other Modules (UI and Data)
		document
		.addEventListener('valid_data_entered', this.validDataParsed.bind(this), false);

		// Enable/Disable Zoom Controls Event Listener
        // Event Callback Function is called changeZoomControl
        // 'this' is tied to the GlobalController object via the 'bind(this)' so the
		// GlobalController keeps access to the other Modules (UI and Data)
		document
		.addEventListener('zoom_control', this.changeZoomControl.bind(this), false);

		// Enable Vertical Fit Control Event Listener
        // Event Callback Function is called changeZoomControl
        // 'this' is tied to the GlobalController object via the 'bind(this)' so the
		// GlobalController keeps access to the other Modules (UI and Data)
		document
		.addEventListener('fit_control', this.enableVerticalFitButton.bind(this), false);

		// Window Resize Event Listener
		// Event Callback Function is called resizePlotBox
		// Resizes PlotBox to fill rest of page height
		window.addEventListener('resize', this.resizePlotBox, false);
	}

	changeZoomControl (e) {
		// console.log(e);
		var state = e.enable;
		var control = e.control;
		// console.log(document.getElementById(control).disabled);
		if (document.getElementById(control).disabled == state) {
			document.getElementById(control).disabled = !state;
			document
			.getElementById(control)
			.classList
			.toggle(_HTMLClasses.inactive_button);
		}
	}

	enableVerticalFitButton () {
		if (document.getElementById(_DS.verticalFit).disabled) {
			document.getElementById(_DS.verticalFit).disabled = false;
			document
			.getElementById(_DS.verticalFit)
			.classList
			.toggle(_HTMLClasses.inactive_button);
		}
	}

    handleFileSelect (e) {
		var files = e.target.files; // File list

		// // Clear Present Graphs when selecting new files
		// this._DataController.clearParsedData();

		// Disable Graph plotting and Output generation if no files were inputted
		if (Object.keys(files).length === 0) {
			this.disableButtons();
		} else {
			inputParsingSW.start();

			// Work with inputted files otherwise
			// Go through all files
			for (var i = 0, f; f = files[i]; i++) {
				if(f != undefined){
					// Parse CSV file
					this._DataController.parseFile(f);
				}
			}
		}
	}
	
    enablePlotGraphButton () {
		if(document.getElementById(_DS.plotButton).disabled){
			document.getElementById(_DS.plotButton).disabled = false;
			document
			.getElementById(_DS.plotButton)
			.classList
			.toggle(_HTMLClasses.inactive_button);
		}
    }

	disablePlotGraphButton (mode) {
		if(!document.getElementById(_DS.plotButton).disabled){
			document.getElementById(_DS.plotButton).disabled = true;
			document
			.getElementById(_DS.plotButton)
			.classList
			.toggle(_HTMLClasses.inactive_button);
		}
    }

    enableGenerateOutputButton () {
		if(document.getElementById(_DS.genButton).disabled){
			document.getElementById(_DS.genButton).disabled = false;
			document
			.getElementById(_DS.genButton)
			.classList
			.toggle(_HTMLClasses.inactive_button);
		}
    }

	disableGenerateOutputButton () {
		if(!document.getElementById(_DS.genButton).disabled){
			document.getElementById(_DS.genButton).disabled = true;
			document
			.getElementById(_DS.genButton)
			.classList
			.toggle(_HTMLClasses.inactive_button);
		}
	}

	enableButtons () {
		this.enablePlotGraphButton();
		this.enableGenerateOutputButton();
	}

	disableButtons () {
		this.disablePlotGraphButton();
		this.disableGenerateOutputButton();
	}

	disableControls () {
		if (!this.controlsDisabled) {
			controls.map(el => {
				document.getElementById(el).disabled = true;
				document.getElementById(el).classList.toggle(_HTMLClasses.inactive_button);
			});
			this.controlsDisabled = true;
		}
	}

	disableOptions () {
		if (!this.optionsDisabled) {
			dataOptions.map(el => document.getElementById(el).disabled = true);
			this.optionsDisabled = true;
		}
	}

	enableOptions () {
		if (this.optionsDisabled) {
			dataOptions.map(el => document.getElementById(el).disabled = false);
			this.optionsDisabled = false;
		}
	}

	handleGraphUpdate () {
		if (this._DataController.getFilename() !== undefined){
			graphPlottingSW.start();
			console.log("Data Updated, Starting Graph Plotting");
	
			var key = this._UIController.getKey();
			
			// Plot Graph
			if (key.typicalType !== "combined") {
				this._DataController.plotData = this._DataController.getPlotData(key);
			} else {
				this._DataController.plotData = [];
				key.typicalType = "HLC";
				this._DataController.plotData.push(this._DataController.getPlotData(key));
				key.typicalType = "HL";
				this._DataController.plotData.push(this._DataController.getPlotData(key));
			}
			// console.log(plotData);
			this._UIController.plotGraph(
				this._DataController.plotData,
				this._DataController.getFilename()
			);
		} else {
			console.warn('Nothing to Plot. No File Successfully Parsed.');
			alert('Nothing to Plot. No File Successfully Parsed.');
		}
	}

	validDataParsed () {
		inputProcessingSW.stop();

		// Enable Force Graph Plotting Button
		this.enablePlotGraphButton();

		// Enable Options
		this.enableOptions();

		// Graph Plotting
		this.handleGraphUpdate();

		// // Start Output Generation
		// this.generateOutput();
	}

	generateOutput () {
		// TODO: Redo this whole section after analysis is complete.

		outputGenerationSW.start();

		console.log("Output Generation Linked to Generate Output(s) Button");

		var name = 'output.zip';
		var zip = new JSZip();

		var parsedData = this._DataController.getParsedData();
		var parsedDataTrimmed = this._DataController.getParsedDataTrimmed();
		var parsedDataFilename = this._DataController.getFilename();
		var file = null;
		var filename = null;
		// console.log(parsedData);
		// console.log(parsedDataList);
		if (parsedDataFilename.includes('OHLCT_')) {
			filename = `${parsedDataFilename}`;	
		} else {
			filename = `OHLCT_${parsedDataFilename}`;
		}
		file = this._DataController.OHLCTtoCSV(parsedData, filename);
		zip.file(file["name"], file["data"]);
		// console.log(file);

		filename = `trimmed/trim${filename}`;
		file = this._DataController.OHLCTtoCSV(parsedDataTrimmed, filename);
		zip.file(file["name"], file["data"]);

		zip
		.generateAsync({type: "base64"})
		.then(content => {
			// console.log(content);
			document
			.getElementById(_DS.genHyperLink)
			.setAttribute("href", "data:application/zip;base64," + content);
			document
			.getElementById(_DS.genHyperLink)
			.setAttribute("download", `${name}`);

			outputGenerationSW.stop();

			// Allow Output Generation after Zip is complete
			this.enableGenerateOutputButton();
		});
	}
	
	resizePlotBox () {
		var headerHeight = document.getElementById(_DS.header).offsetHeight;
		// console.log(header_height);
		var windowHeight = window.innerHeight;
		// console.log(window_height);
		var plotBoxHeight = windowHeight - (headerHeight + 30);

		document.getElementById(_DS.plotArea).style.height = `${plotBoxHeight}px`;
	}

	initializeInputs (mode) {
        // Disable Plot Button
		this.disablePlotGraphButton();

        // Disable Data Generation Button
		this.disableGenerateOutputButton();

		// Disable Options
		this.disableOptions();

		// Disable Controls
		this.disableControls();

		this.resizePlotBox();
	}

    initialize () {
        this.setupEventListeners();
		this.initializeInputs("silent");
        console.log('Application has started.');
    }
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Data Controller
///////////////////////////////////////////////////////////////////////////////

class DataController {
    constructor () {
		this.plotData = null;
		this.data = new OHLCStructure();
		this.parsedFilename = null;
	}

	clearParsedData () {
 		this.parsedFilename = [];
		this.data = new OHLCStructure();
	}

    parseFile (inputFile) {
        // Save 'this' state for usage during parsing
        var self = this;

        Papa.parse(inputFile, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
				// Input Parsed
				inputParsingSW.stop();
				// Processing started
				inputProcessingSW.start();
				
				// console.log(self);
				// console.log(results);

				// Treat Parsed Data
				var treatedData = self.processParsedOHLCData(
					results.data,
					inputFile.name
					);

				if(treatedData !== false) {
					// Generate Resolutions of Data
					self.processData(treatedData[0], treatedData[1]);

					// Send File Name to Parsed File List
					self.updateFilename(inputFile.name);
					
					// Enable Graph Plotting via firing Event
					var event = new Event('valid_data_entered');
					document.dispatchEvent(event);
				}
            }
        });
	}

	processParsedOHLCData (parsedInput) {
		var headerIsOK		= true;		// Valid File Header check
		var parsedHeader	= Object.keys(parsedInput[0]);
		var timeframe		= null;

		var output = {
			Date: [],
			Open: [],
			High: [],
			Low: [],
			Close: [],
			TickVolume: [],
			Volume: [],
			Spread: [],
		};

		// console.log(parsedHeader);
		
		// Remove Special Characters from Header and Lowercase it
		parsedHeader = parsedHeader.map(el => {
			return el.replace(/[^0-9a-zA-Z]/g,"").toLowerCase()
		});

		// console.log(parsedHeader);

		// List invalid headers in Parsed Data Header
		CriticalHeaderList.map(criticalHeader => {
			headerIsOK &=  parsedHeader.includes(criticalHeader.toLowerCase());
		});

		// console.log(`${headerIsOK ? 'true' : 'false'}`);
		// console.log(parsedInput);

		if (headerIsOK) {

			// Go through Data
			parsedInput.map(el => {
				// console.log(el);
				
				// Correct Keys in Parsed Data
				for (var key in el) {
					renameProperty(
						el,
						key,
						correctKey(key)
					);
				}

				// console.log(el);
				
				// Correct Data Timestamp
				if (el.hasOwnProperty('Time')){
					el['Date'] = new Date(`${el['Date']} ${el['Time']}`);
					delete el['Time'];
				} else {
					el['Date'] = new Date(`${el['Date']}`);
				}

				// console.log(el);
				
				// Push Parsed Data
				HeaderList.map(header => {
					output[header].push(el[header]);
				});
				
				// console.log(output);
			});

			// Check if the timestamps are progressive or regressive
			var Tstep =
				  new Date(output['Date'][1])
				- new Date(output['Date'][0]);
			// Reverse the data if the time progression is regressive
			if (Tstep < 0) {
				for (var key in output) 
					output[key] = output[key].reverse();
			}

			// Detect Parsed Data Timeframe
			timeframe = detectTimeframe(output['Date'][0], output['Date'][1]);

			// Return Processed Data & Identified Timeframe
			return [new OHLCTData(output), timeframe];
		} else {
			// Throw Error on Parsing and Return an error
			console.warn(`Header of file "${fileName}" is incorrect.`);
			alert(`Header of file "${fileName}" is incorrect.`);
			return false;
		}
	}

	processData (input, timeframe) {
		// console.log(input, timeframe);

		// Populate first set parsed from file
		this.data.initialize(input, timeframe);
			
		// Reduce Parsed Data into Lower Timeframes
		this.data.reduceOHLC(timeframe);

		// Calculate Typical Values
		this.data.calculateTypical();

		// Remove Data Trailing the Lowest Typical value on each chart
		this.data.removeTrailingData();

		// Convert OHLCT Data to Monowave Vectors, Apply Rule of Neutrality, and Trim
		this.data.generateMonowaves();

		// Disable non-parsed resolution options
		// This should be on UI Controller, but it uses data form Data Controller
		Resolutions.map(resolution => {
			if (this.data[resolution] === null) {
				var resolutionOption = document.getElementById(resolution);
				resolutionOption.disabled = true;
				resolutionOption.selected = false;
			}
		});

		// console.log(this.data);
	}

	OHLCTtoCSV (input, fileName) {

		// console.log(input);

		var output = [['Date','Open','High','Low','Close','Typical']];

		input['Date'].map((el, index) => {
			output.push([
				input['Date'][index],
				input['Open'][index],
				input['High'][index],
				input['Low'][index],
				input['Close'][index]
			]);
		});

		// console.log(output);
		var csvOutput = Papa.unparse(output, {delimiter: ","});
		// console.log(csvOutput);

		return {data: csvOutput, name: `${fileName}`};
	}

	updateFilename (inputFileName) {
		this.parsedFilesList = inputFileName;
	}

	getPlotData (key) {
		if (key.trimCheck) {
			return this.data[key.resolution][key.typicalType]['trim'];
		} else {
			return this.data[key.resolution][key.typicalType]['full'];
		}
	}

	getFilename () {
		return this.parsedFilesList;
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  UI Controller
///////////////////////////////////////////////////////////////////////////////

class UIController {
    constructor () {
		this.graphPlotted = false;
		this.plottedData = null;
		this.relayoutNotTied = true;
		this.savedRelayout = {
			"xaxis.autorange": true,
			"yaxis.autorange": true,
			"xaxis.range[0]": undefined,
			"xaxis.range[1]": undefined,
			"yaxis.range[0]": undefined,
			"yaxis.range[1]": undefined,
		};
		this.relayoutHistory = [];
		this.relayoutDateHistory = [];
		this.currentRelayout = 0;
	}

	plotGraph (parsedData, parsedFilename) {
		// Plot OHLC Graph
		this.plotOHLCGraph(parsedData, parsedFilename, _DS.plotDIV);
		
		// Keep record of the Plotted Data on UI Controller (solves fitting problems)
		if (parsedData instanceof Array) {
			this.plottedData = parsedData[0];
		} else {
			this.plottedData = parsedData;
		}
		
		
		// Tie Layout Change Observer (only once)
		// And don't you ever forget to bind it to the UI Controller ever again
		if (this.relayoutNotTied) {
			document
			.getElementById(_DS.plotDIV)
			.on('plotly_relayout', this.updateSavedRelayout.bind(this));
			this.relayoutNotTied = false;
		}
	}

    plotOHLCGraph (parsedData, dataName, plotDIV) {
		var combinedData = false;

		// Separate HL Typical data if both Typical Types were parsed
		if (parsedData instanceof Array) {
			var HLTypical = parsedData[1]['Typical'];
			parsedData = parsedData[0];
			combinedData = true;
		}

		// console.log(parsedData);

        var OHLCTrace = {
			name: 'OHLC',
            x:		parsedData['Date'],
            close:	parsedData['Close'],
            high:	parsedData['High'],
            low:	parsedData['Low'],
            open:	parsedData['Open'],

            decreasing: {line: {color: '#FF0000'}},
			increasing: {line: {color: '#17BECF'}},
			
			type: this.getGraphType(),
            line: {color: '#666666'},
			tickwidth: '0.5',
		};

		// Need Revision
		if (combinedData) {
			var TypicalHLCTrace = {
				name: `Typical (HLC)`,
				x: parsedData['Date'],
				y: parsedData['Typical'],
				
				type: 'scatter',
				mode: 'lines',
				line: {color: '#005500', dash: 'dash'},
			};
			var TypicalHLTrace = {
				name: `Typical (HL)`,
				x: parsedData['Date'],
				y: HLTypical,
				
				type: 'scatter',
				mode: 'lines',
				line: {color: '#DD6600', dash: 'dashdot'},
			};
			if (this.getGraphType() !== 'none') {
				var data = [OHLCTrace, TypicalHLCTrace, TypicalHLTrace];
			} else {
				var data = [TypicalHLCTrace, TypicalHLTrace];
			}
		} else {
			var TypicalTrace = {
				name: `Typical (${this.getTypicalType()})`,
				x: parsedData['Date'],
				y: parsedData['Typical'],
				
				type: 'scatter',
				mode: 'lines',
				line: {color: '#000000'},
			};	
			if (this.getGraphType() !== 'none') {
				var data = [OHLCTrace, TypicalTrace];
			} else {
				var data = [TypicalTrace];
			}
		}
        
        var layout = {
			title: `Source: ${dataName}`,
            dragmode: 'zoom',
            margin: {
                r: 10,
                t: 25,
                b: 40,
                l: 50
            },
            showlegend: false,
            xaxis: {
				visible: this.getDateCheck() ? true : false,
				title: 'Date',
				type: this.getDateCheck() ? 'date' : 'category',
				
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
				type: this.getYAxisType(),
				
				autorange: {},
                range: [],
			},
		};

		if (this.graphPlotted) {
			// Get from saved relayout
			var relayout = this.getCurrentRelayout();
			for (var key in relayout) {
				switch (key) {
					case "xaxis.autorange":
						layout.xaxis.autorange = relayout[key];
						break;
					case "yaxis.autorange":
						layout.yaxis.autorange = relayout[key];
						break;
					case "xaxis.range[0]":
						layout.xaxis.range[0] = relayout[key];
						break;
					case "xaxis.range[1]":
						layout.xaxis.range[1] = relayout[key];
						break;
					case "yaxis.range[0]":
						layout.yaxis.range[0] = relayout[key];
						break;
					case "yaxis.range[1]":
						layout.yaxis.range[1] = relayout[key];
						break;
				}
			}

			Plotly.react(plotDIV, data, layout, {responsive: true})
			.then(() => {
				console.log("Graph Updated.");
				graphPlottingSW.stop();
			});
		} else {
			Plotly.newPlot(plotDIV, data, layout, {responsive: true})
			.then(() => {
				console.log("Graph Plotted.");
				this.graphPlotted = true;
				graphPlottingSW.stop();
				this.enableVerticalFit();
			});
		}
	}

	triggerGraphUpdate () {
		var event = new Event('update_graph');
		document.dispatchEvent(event);
	}

	enableVerticalFit () {
		var event = new Event('fit_control');
		document.dispatchEvent(event);
	}

	changeZoomControlState (control, state) {
		var event = new Event('zoom_control');
		event.enable = state;
		event.control = control;
		document.dispatchEvent(event);
	}

	previousRelayout () {
		// Enable Redo Zoom Control
		this.changeZoomControlState(_DS.redoZoom, true);
		
		this.currentRelayout++;

		// Trigger Graph Potting
		this.triggerGraphUpdate();
		
		if (this.currentRelayout > this.relayoutHistory.length - 1) {
			// Disable Undo Zoom Control
			this.changeZoomControlState(_DS.undoZoom, false);
		}
	}

	nextRelayout () {
		// Enable Undo Zoom Control
		this.changeZoomControlState(_DS.undoZoom, true);

		this.currentRelayout--;
		
		// Trigger Graph Potting
		this.triggerGraphUpdate();

		if (this.currentRelayout === 0) {
			// Disable Redo Zoom Control
			this.changeZoomControlState(_DS.redoZoom, false);
		}
	}

	updateSavedRelayout (relayout) {
		// 'relayout' is the Event Argument
		// It's tied to the call by Plotly when called via 'plotly_relayout' Event
		// This method can also be called programmatically with any given 'relayout'

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
		// console.log(this.savedRelayout);

		// Save current relayout to history (maximum 10 items)
		this.saveRelayout(this.savedRelayout);
	}

	saveRelayout (relayout) {
		while (this.currentRelayout !== 0) {
			this.relayoutHistory.shift();
			this.relayoutDateHistory.shift();
			this.currentRelayout--;
		}

		if (this.relayoutHistory.length > 9) {
			this.relayoutHistory.pop();
			this.relayoutDateHistory.pop();
		}
		
		this.relayoutHistory.unshift(JSON.parse(JSON.stringify(relayout)));

		if (this.getDateCheck()) {
			this.relayoutDateHistory.unshift(
				[relayout["xaxis.range[0]"], relayout["xaxis.range[1]"]]
				);
		} else {
			var xMin = Math.floor(relayout["xaxis.range[0]"]);
			var xMax = Math.floor(relayout["xaxis.range[1]"]) + 1;
			this.relayoutDateHistory.unshift(
				[this.plottedData['Date'][xMin],this.plottedData['Date'][xMax]]
				);
		}

		// Disable Redo Zoom Control
		this.changeZoomControlState(_DS.redoZoom, false);

		// Enable Undo Zoom Control
		this.changeZoomControlState(_DS.undoZoom, true);
	}

	fitGraphVertically () {
		var relayout = this.getCurrentRelayout();
		if(!relayout){
			// Quit if Current Layout is undefined
			return false;
		}
		relayout = JSON.parse(JSON.stringify(relayout));
		
		var xMin;
		var xMax;
		var index = 0;

		if (this.getDateCheck()){
			xMin = new Date(relayout["xaxis.range[0]"]);
			while (xMin > this.plottedData['Date'][index]){
				index++;
			}
			xMin = index - 1;
			
			xMax = new Date(relayout["xaxis.range[1]"]);
			while (xMax > this.plottedData['Date'][index]){
				index++;
			}
			xMax = index;
		} else {
			xMin = Math.floor(relayout["xaxis.range[0]"]);
			xMax = Math.floor(relayout["xaxis.range[1]"]) + 1;	
		}
		// console.log(xMin, xMax, this.plottedData['Date'].length);
				
		// console.log(xMin, this.plottedData['Date'][index]);
		
		var yMin = this.plottedData['Low'][xMin];
		var yMax = this.plottedData['High'][xMin];
		
		index = xMin;
		while (index < xMax) {
			yMin = Math.min(yMin, this.plottedData['Low'][index]);
			yMax = Math.max(yMax, this.plottedData['High'][index]);
			index++;
		}

		// console.log('Interval: ',xMin, xMax);
		// console.log('Found: ', yMin, yMax);

		// console.log(relayout["yaxis.range[0]"], relayout["yaxis.range[1]"]);
		if (this.getYAxisType() === "log") {
			relayout["yaxis.range[0]"] =  Math.log10(yMin);
			relayout["yaxis.range[1]"] =  Math.log10(yMax);
		} else {
			relayout["yaxis.range[0]"] =  yMin;
			relayout["yaxis.range[1]"] =  yMax;
		}
		
		// console.log(this.getCurrentRelayout());
		// console.log(relayout);
		
		// Save current relayout to history (maximum 10 items)
		this.saveRelayout(relayout);
		
		// this.updateSavedRelayout(relayout);
		
		// Trigger Graph Potting
		this.triggerGraphUpdate();
	}

	changeYAxis () {
		var relayoutHistory = this.relayoutHistory;
		
		// console.log(relayoutHistory);
		
		if (this.getYAxisType() === 'log'){
			// Changed to Log
			relayoutHistory.map(el => {
				el['yaxis.range[0]'] = Math.log10(el['yaxis.range[0]']);
				el['yaxis.range[1]'] = Math.log10(el['yaxis.range[1]']);
			});
		} else {
			// Changed to Linear
			relayoutHistory.map(el => {
				el['yaxis.range[0]'] = 10**el['yaxis.range[0]'];
				el['yaxis.range[1]'] = 10**el['yaxis.range[1]'];
			});
		}

		// console.log(xMin, xMax, this.plottedData['Date'].length);
		
		// Trigger Graph Potting
		this.triggerGraphUpdate();
	}

	changeXAxisType () {
		var relayoutHistory = this.relayoutHistory;
		
		// console.log(relayoutHistory);
		
		if (this.getDateCheck()){
			// Changed to Date
			relayoutHistory.map(el => {
				var xMin = Math.floor(el['xaxis.range[0]']);
				var xMax = Math.floor(el['xaxis.range[1]']) + 1;
				el['xaxis.range[0]'] = this.plottedData['Date'][xMin];
				el['xaxis.range[1]'] = this.plottedData['Date'][xMax];
			});
		} else {
			// Changed to Category
			relayoutHistory.map(el => {
				var xMin = new Date(el['xaxis.range[0]']);
				var xMax = new Date(el['xaxis.range[1]']);
				var index = 0;

				while (xMin > this.plottedData['Date'][index]){
					index++;
				}
				xMin = index - 1;
				
				while (xMax > this.plottedData['Date'][index]){
					index++;
				}
				xMax = index;
				el['xaxis.range[0]'] = xMin;
				el['xaxis.range[1]'] = xMax;
			});
		}

		// console.log(xMin, xMax, this._DataController.plotData['Date'].length);
				
		// Trigger Graph Potting
		this.triggerGraphUpdate();
	}

	changeTypicalType () {
		var trimCheck		= document.getElementById(_DS.trimCheck);
		var combinedTypical	= document.getElementById(_DS.combinedTypical);

		// Disable Changing Trim option when HL+HLC is being used
		trimCheck.disabled = combinedTypical.selected;
	}

	changeTrimmedOption () {
		// Toggle Combined HLC+HL plot
		this.toggleCombinedTypical();
	}

	toggleCombinedTypical () {
		var trimCheck		= document.getElementById(_DS.trimCheck);
		var combinedTypical	= document.getElementById(_DS.combinedTypical);

		combinedTypical.disabled = trimCheck.checked;
	}

	changeXAxisResolution (data) {
		if (!this.getDateCheck()) {
			// Not using Date when changing Resolution, change X axis
			var currentKey			= this.getKey();
			var resolution			= currentKey.resolution;
			var typicalType			= currentKey.typicalType;
			var relayoutHistory		= this.relayoutHistory;
			var relayoutDateHistory = this.relayoutDateHistory;
			relayoutDateHistory.map((el, pos) => {
				var xMin = new Date(el[0]);
				var xMax = new Date(el[1]);
				var index = 0;
				// console.log(xMin, xMax);

				while (xMin > data[resolution][typicalType]['full']['Date'][index]){
					index++;
				}
				xMin = index - 1;
				
				while (xMax > data[resolution][typicalType]['full']['Date'][index]){
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

	relayoutConsole () {
		console.log(`Current Position: ${this.currentRelayout}`);
		console.log(`Current Relayout: `, this.getCurrentRelayout());
		console.log(`Full Relayout History: `, this.relayoutHistory);
		console.log(`Full Relayout Date History: `, this.relayoutDateHistory);
	}
	
	getCurrentRelayout () {
		return this.relayoutHistory[this.currentRelayout];	
	}

	setCurrentRelayout (relayout) {
		this.relayoutHistory[this.currentRelayout] = relayout;	
	}

	getGraphType () {
        return document.getElementById(_DS.graphType).value;
    }

	getYAxisType () {
        return document.getElementById(_DS.yAxisType).value;
	}

	getDateCheck () {
		return document.getElementById(_DS.dateCheck).checked;
	}

	getResolution () {
		return document.getElementById(_DS.resolution).value;
	}

	getKey () {
		var resolution	= this.getResolution();
		var typicalType	= this.getTypicalType();
		var trimCheck	= this.getTrimCheck();
		return {
			resolution	:	resolution,
			typicalType	:	typicalType,
			trimCheck	:	trimCheck
		};
	}

	getTypicalType () {
		return document.getElementById(_DS.typicalType).value;
	}

	getTrimCheck () {
		return document.getElementById(_DS.trimCheck).checked;
	}
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Hacks (I ain't even gonna lie)
////////////////////////////////////////////////////////////////////////////////

// None here, yet...
// someTime added to Math.__proto__ would be, if it didn't fucked up Plotly
// for whatever reason
// and OH WAIT, adding renameProperty to Object.prototype ALSO FUCKS UP PLOTLY!
// ... I should have guessed by now


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Initialization
////////////////////////////////////////////////////////////////////////////////

UICtrl = new UIController();
dataCtrl = new DataController();
globalCtrl = new GlobalController(dataCtrl, UICtrl);
versions = new Versions();

versions.printToConsole();
globalCtrl.initialize();
