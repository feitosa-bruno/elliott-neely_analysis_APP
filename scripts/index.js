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
const Plotly				= require('plotly.js-dist');
const appDir				= require('electron').remote.app.getAppPath();
const _HTMLClasses			= require(`${appDir}/scripts/DOM_info`)._HTMLClasses;
const _DS					= require(`${appDir}/scripts/DOM_info`)._DS;
const defaultTypicalType	= require(`${appDir}/scripts/global_constants`).defaultTypicalType;
const OHLCStructure			= require(`${appDir}/scripts/classes/OHLCStructure`);
const CSVtoOHLCT			= require(`${appDir}/scripts/classes/CSVtoOHLCT`);
const PlotLyPlotData		= require(`${appDir}/scripts/classes/PlotlyPlotData`);
const Relayout				= require(`${appDir}/scripts/classes/Relayout`);
const PlotKey				= require(`${appDir}/scripts/classes/PlotKey`);
const Stopwatch				= require(`${appDir}/scripts/lib/stopwatch`);
const Versions				= require(`${appDir}/scripts/lib/versions`);
const objectSize			= require(`${appDir}/scripts/auxiliary/objectSize`);

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
	_DS.xAxisType,
	_DS.resolution,
	_DS.typicalType,
	_DS.trimData,
];

// Data Options that do not change the Graph Layout
const autoUpdateDataOptions = [
	_DS.graphType,
	_DS.typicalType,
];

// Data Options that change X-Axis Graph Layout
const xAxisUpdateDataOptions = [
	_DS.xAxisType,
	_DS.resolution,
	_DS.trimData,
];

// Data Options that change Y-Axis Graph Layout
const yAxisUpdateDataOptions = [
	_DS.yAxisType,
];

// 	Performance Evaluation
inputParsingSW		= new Stopwatch('Input Parsing');
inputProcessingSW	= new Stopwatch('Input Processing');
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

		// File Parse Finished Event Listener
        // Flagged whenever there is a change in the selected file
        // Event Callback Function is called handleFileSelect, located in the Data Controller
        // 'this' is tied to the GlobalController object via the 'bind(this)' so the
        // GlobalController keeps access to the other Modules (UI and Data)
        document
        .addEventListener(
			'parse_finished',
			this._DataController.parseFinished.bind(this._DataController),
			false
		);

        // Previous Zoom Button Event Listener
        // Event Callback Function is called previousRelayout, located in the UI Controller
        // 'this' is tied to the UIController object via the 'bind(this.etc)' so the
        // UIController keeps access to the Module
        document
        .getElementById(_DS.undoZoom)
		.addEventListener(
			'click',
			this._UIController.previousRelayout.bind(this._UIController),
			false
		);

		// Next Zoom Button Event Listener
        // Event Callback Function is called nextRelayout, located in the UI Controller
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
        // Event Callback Function is called fitGraphVertically, located in the UI Controller
        // 'this' is tied to the UIController object via the 'bind(this.etc)' so the
        // UIController keeps access to the Module
        document
        .getElementById(_DS.verticalFit)
		.addEventListener(
			'click',
			this._UIController.fitGraphVertically.bind(this._UIController),
			false
		);

		// Auto-Update Options Event Listener
		// Event Callback Function is called handleGraphUpdate
		// Event is tied to changes that do not change Graph Layout
		// 'this' is tied to the Global Controller object via the 'bind(this)' so the
		// GlobalController keeps access to the other Modules (UI and Data)
		autoUpdateDataOptions.map(option => {
			document
			.getElementById(option)
			.addEventListener('change', this.handleGraphUpdate.bind(this), false)
		});
	
		// X-Axis Update Options Event Listener
		// Event Callback Function is called updateXAxis
		// Event is tied to changes that change X-Axis Layout
		// 'this' is tied to the GlobalController object via the 'bind(this)' so the
		// GlobalController keeps access to the other Modules (UI and Data)
		xAxisUpdateDataOptions.map(option => {
			document
			.getElementById(option)
			.addEventListener('change', this.updateXAxis.bind(this), false)
		});

		// Y-Axis Update Options Event Listener
		// Event Callback Function is called updateYAxis
		// Event is tied to changes that change Y-Axis Layout
		// 'this' is tied to the GlobalController object via the 'bind(this)' so the
		// GlobalController keeps access to the other Modules (UI and Data)
		yAxisUpdateDataOptions.map(option => {
			document
			.getElementById(option)
			.addEventListener('change', this.updateYAxis.bind(this, "test"), false)
		});
	
		// Graph Update Event Listener
		// Event Callback Function is called handleGraphUpdate
		// Event is tied to Manual Triggering (UI Module request to Global Module)
		// 'this' is tied to the GlobalController object via the 'bind(this)' so the
		// GlobalController keeps access to the other Modules (UI and Data)
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
        // Event Callback Function is called enableVerticalFitButton
        // 'this' is tied to the GlobalController object via the 'bind(this)' so the
		// GlobalController keeps access to the other Modules (UI and Data)
		document
		.addEventListener('fit_control', this.enableVerticalFitButton.bind(this), false);

		// Window Resize Event Listener
		// Event Callback Function is called resizePlotBox
		// Resizes PlotBox to fill rest of page height
		window.addEventListener('resize', this.resizePlotBox, false);

		// Disable Unused Resolutions Event Listener
        // Event Callback Function is called disableUnusedResolutions
        // 'this' is tied to the GlobalController object via the 'bind(this)' so the
		// GlobalController keeps access to the other Modules (UI and Data)
		document
		.addEventListener('disable_resolutions', this.disableResolutions.bind(this), false);
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

	// Checks User Inputted File and sends it to Parsing
	//	: Interaction between Global Module and Data Module
	//		: Global Module sends File Data to Data Module
    handleFileSelect (event) {
		var file = event.target.files[0];		// User File

		if (!(file instanceof File)) {
			alert("File Input Failed");
		} else {
			inputParsingSW.start();
			// Work with inputted file otherwise
			
			// Parse CSV file
			this._DataController.parseFile(file);
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

	// Disable Unused resolution options
	disableResolutions () {
		var set = this._DataController.data;
		for (var resolution in set) {
			if (set[resolution][defaultTypicalType]["full"] === null) {
				var resolutionOption = document.getElementById(resolution);
				resolutionOption.disabled = true;
				resolutionOption.selected = false;	
			}
		}
	}

	// Update X Axis
	//	: Interaction between UI Module and Global Module
	//		: Global Module sends key information to UI Module
	updateXAxis () {
		graphPlottingSW.start();
		// Update Plot Data beforehand
		this._UIController.updatePlotData(
			this._DataController.data,
			this._DataController.getFilename(),
			this.getKey()
		);

		// Update Relayout X Axis values
		this._UIController.relayout.updateXAxis();

		// Plot
		this._UIController.plotGraph();
	}

	// Update Y Axis
	//	: Interaction between UI Module and Global Module
	//		: Global Module sends key information to UI Module
	updateYAxis () {
		graphPlottingSW.start();
		// Update Plot Data beforehand
		this._UIController.updatePlotData(
			this._DataController.data,
			this._DataController.getFilename(),
			this.getKey()
		);

		// Update Relayout Y Axis values
		this._UIController.relayout.updateYAxis();

		// Plot
		this._UIController.plotGraph();
	}

	// Update Graph
	//	: Interaction between UI Module and Data Module via Global Module
	//		: Global Module sends Data Module information to UI Module
	handleGraphUpdate () {
		if (this._DataController.getFilename() !== undefined){
			graphPlottingSW.start();
			console.log("Data Updated, Starting Graph Plotting");
	
			this._UIController.plotData(
				this._DataController.data,
				this._DataController.getFilename(),
				this.getKey()
			);
		} else {
			console.warn('Nothing to Plot. No File Successfully Parsed.');
			alert('Nothing to Plot. No File Successfully Parsed.');
		}
	}

	getKey () {
		var key = {};

		dataOptions.map(option =>{
			key[option] = this.getDataOptionSelection(option);
		});

		return key;
	}

	getDataOptionSelection (option) {
		return document.getElementById(option).value;
	}

	resizePlotBox () {
		var headerHeight = document.getElementById(_DS.header).offsetHeight;
		// console.log(header_height);
		var windowHeight = window.innerHeight;
		// console.log(window_height);
		var plotBoxHeight = windowHeight - (headerHeight + 30);

		document.getElementById(_DS.plotArea).style.height = `${plotBoxHeight}px`;
	}

	validDataParsed () {
		// Enable Options
		this.enableOptions();

		// Graph Plotting
		this.handleGraphUpdate();
	}
	
	initializeInputs () {
		// Disable Options
		this.disableOptions();

		// Disable Controls
		this.disableControls();

		// Set Initial Plot Box Size
		this.resizePlotBox();
	}

    initialize () {
        this.setupEventListeners();
		this.initializeInputs();
        console.log('Application has started.');
    }
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  Data Controller
///////////////////////////////////////////////////////////////////////////////

class DataController {
    constructor () {
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
				var event = new Event('parse_finished');
				event.file = results.data;
				event.filename = inputFile.name;
				document.dispatchEvent(event);		
            }
		});
	}

	parseFinished(event) {
		var data		= event.file;
		var filename	= event.filename;

		// Input File Parsed
		inputParsingSW.stop();
		// Processing started
		inputProcessingSW.start();

		// Treat Parsed Data
		var treatedData = new CSVtoOHLCT(data);

		if (treatedData.isValidData) {
			// Store Processed OHLCT 
			this.processData(treatedData.OHLCT, treatedData.timeframe);

			// Processing started
			inputProcessingSW.stop();

			// Send File Name to Parsed File List
			this.updateFilename(filename);

			// Enable Graph Plotting via firing Event
			var event = new Event('valid_data_entered');
			document.dispatchEvent(event);
		} else {
			console.warn(`File ${filename} is not a valid CSV File.`);
			alert(`File ${filename} is not a valid CSV File.`);
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
		this.data.generateMonowaveVectors();

		// Disable Unused Resolution Options
		var event = new Event('disable_resolutions');
		document.dispatchEvent(event);
	}

	updateFilename (inputFileName) {
		this.parsedFilesList = inputFileName;
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
		this.plotKey			= new PlotKey();
		this.graphPlotted		= false;
		this.plotlyData			= null;
		this.relayout			= new Relayout();
		this.plotDIV			= _DS.plotDIV;
	}

	// Plot Data
	//	: Interaction between UI Module and Global & Data Modules
	//		: UI Module receives plot data from Data Module sent via Global Module
	plotData (data, filename, key) {
		// Update Plot Data from information received from Global Module
		this.updatePlotData(data, filename, key);

		// Plot OHLC Graph
		this.plotGraph();

		// Tie Layout Change Observer (only once)
		// And don't you ever forget to bind it to the UI Controller ever again
		if (this.relayout.notTied) {
			this.relayout.tieObserver();
			document
			.getElementById(this.plotDIV)
			.on('plotly_relayout', this.updateSavedRelayout.bind(this));
		}
	}

    plotGraph () {
		if (this.graphPlotted) {
			// Update Relayout information
			this.relayout.set(this.plotlyData);

			Plotly.react(
				this.plotDIV,
				this.plotlyData.trace,
				this.plotlyData.layout,
				{responsive: true}
			)
			.then(() => {
				console.log("Graph Updated.");
				graphPlottingSW.stop();
			});
		} else {
			Plotly.newPlot(
				this.plotDIV,
				this.plotlyData.trace,
				this.plotlyData.layout,
				{responsive: true}
			)
			.then(() => {
				console.log("Graph Plotted.");
				this.graphPlotted = true;
				graphPlottingSW.stop();
				this.enableVerticalFit();
			});
		}
	}

	updatePlotData (data, filename, key) {
		// Store/Update Plot Information Key
		if (!this.graphPlotted) {
			// Initialize Key information
			this.plotKey.initialize(key);
		} else {
			// Update Key information
			this.plotKey.update(key);
		}

		// Select OHLCTData Plot Data from OHLCStructure
		this.plotlyData = new PlotLyPlotData(data, filename, this.plotKey);

		// Update Plotly Plot Data in the Relayout
		this.relayout.importPlotlyPlotData(this.plotlyData, this.plotKey);
	}

	// Trigger a Graph Update on Global Controller
	//	: Interaction between UI Module and Global Module
	//		: UI Module requests Global Controller to update the graph
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
		
		// Change to Previous Relayout
		this.relayout.previousPosition();

		// Trigger Graph Potting
		this.triggerGraphUpdate();
		
		// Disable Redo Zoom Control if it's the First Relayout
		if (this.relayout.firstPosition()) {
			// Disable Undo Zoom Control
			this.changeZoomControlState(_DS.undoZoom, false);
		}
	}

	nextRelayout () {
		// Enable Undo Zoom Control
		this.changeZoomControlState(_DS.undoZoom, true);

		// Change to Next Relayout
		this.relayout.nextPosition();
		
		// Trigger Graph Potting
		this.triggerGraphUpdate();

		// Disable Redo Zoom Control if it's the Last Relayout
		if (this.relayout.lastPosition()) {
			// Disable Redo Zoom Control
			this.changeZoomControlState(_DS.redoZoom, false);
		}
	}

	updateSavedRelayout (relayout) {
		// 'relayout' is the Event Argument
		// It's tied to the call by Plotly when called via 'plotly_relayout' Event
		// This method can also be called programmatically with any given 'relayout'

		// Update Current Relayout and save to history (max 10 items)
		this.relayout.update(relayout);

		// Disable Redo Zoom Control
		this.changeZoomControlState(_DS.redoZoom, false);

		// Enable Undo Zoom Control
		this.changeZoomControlState(_DS.undoZoom, true);
	}

	fitGraphVertically () {
		// Fit Y Axis
		this.relayout.fitYAxis();
						
		// Trigger Graph Potting
		this.triggerGraphUpdate();
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
