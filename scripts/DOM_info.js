//  DOM Info

// DOM Classes
const _HTMLClasses = {
	inactive_button:	"inactive_btn",		// Correct this later: should be inactiveButton on left
	inactiveOption:		"inactive_option",
};


// DOM Strings
const _DS = {
	// Main Fields
	header: 			"header",			// Header Identifier
    plotArea: 			"plot_area",		// Plot Area
	plotDIV: 			"plot_0",			// Plot DIV
	// Inputs
	fileInput: 			"input",			// File Input Field
	// Controls
	undoZoom: 			"undo_zoom",		// Undo Zoom
	redoZoom: 			"redo_zoom",		// Redo Zoom
	verticalFit: 		"vert_fit",			// Fit Graph Vertically
	// Options
	yAxisType: 			"yAxisType",		// [1,1] Y Axis Type 
	graphType: 			"graphType",		// [1,2] Graph Type
	xAxisType:			"xAxisType",		// [1,3] X Axis Type 
	resolution:			"resolution",		// [2,1] Resolution Selection
	typicalType:		"typicalType",		// [2,2] Typical Type Selection
	trimData: 			"trimData",			// [2,3] Trim Data Type
}

module.exports = {
	_HTMLClasses	: _HTMLClasses,
	_DS				: _DS,
}