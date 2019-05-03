//  DOM Info

// DOM Classes
const _HTMLClasses = {
	inactive_button:	"inactive_btn",		// Correct this later: should be inactiveButton on left
	inactiveOption:		"inactive_option",
};


// DOM Strings
const _DS = {
	// 1. index.html Unique Identifiers
	OHLCModuleButton:		"module_OHLC_button",
	TypicalModuleButton:	"module_Typical_button",
	ElliotModuleButton:		"module_Elliot_button",
	moduleHeader:			"module_header",
	header: 				"header",
	
	// 2. Shared Module Identifiers
	// 2.a All Modules
	fileInput: 				"input",
    plotButton: 			"plot_btn",
	genButton: 				"gen_output",
    plotArea: 				"plot_area",
	yAxisType: 				"y-axis_type",
	genHyperLink: 			"gen_link",
	dateCheck: 				"date_check",
	// 2.b OHLC and Typical
	fileInfo: 				"file_info",
	// 2.c OHLC and Elliot
	graphType: 				"graph_type",
	
	// 3. OHLC Module Unique Identifiers
	rangeSliderCheck: 		"slider_check",
	
	// 4. Typical Module Unique Identifiers
	imageExtension: 		"img_extension",
	labelCheck: 			"label_check",
	
	// 5. Elliot Module Unique Identifiers
	trimCheck: 				"trim_check",
	plotDIV: 				"plot_0",
	undoZoom: 				"undo_zoom",
	redoZoom: 				"redo_zoom",
	verticalFit: 			"vert_fit",
	resolution:				"resolution",
	typicalType:			"typical_type",
	combinedTypical:		"combined"
}

module.exports = {
	_HTMLClasses	: _HTMLClasses,
	_DS				: _DS,
}