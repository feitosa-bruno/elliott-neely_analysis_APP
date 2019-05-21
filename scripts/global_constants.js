// Data Types
// OHLC Information is stored into these data types
const DataTypes = [
	"full",			// OHLCT Data with complete trade information
	"noRNmwVector",	// Monowave Vector without Rule of Neutrality Applied
	"mwVector",		// Monowave Vector with Rule of Neutrality Applied
	"simple",		// OHLCT Data trimmed without Rule of Neutrality
	"Neely",		// OHLCT Data trimmed from Monowave Vector
]

// Typical Price Types
// These must be tied to the HTML Files
const TypicalTypes = [
	'HLC',		// High Low and Close Average
	'HL',		// High and Close Average
];
const defaultTypicalType = TypicalTypes[0];

// Resolution Types and Sequence
// These must be tied to the HTML Files
// This list also indicates the sequence from shortest timeframe to largest timeframe
const ResolutionSequence = [
	'_M1',		// 1 Minute
	'_H1',		// 1 Hour
	'_D1',		// 1 Day
	// '_W1',		// 1 Week
];

// Resolution Duration in Seconds
// Keep the same Sequence as 'ResolutionSequence'
const ResolutionDuration = {
	_M1: 1000*60,			// 1 Minute
	_H1: 1000*60*60,		// 1 Hour
	_D1: 1000*60*60*24,		// 1 Day
	// _W1: 1000*60*60*24*7,	// 1 Week
};

// Critical Header List
// These are the minimum headers that must be included in a OHLC Data file
const CriticalHeaderList = [
	"Date",
	"Open",
	"Close",
	"High",
	"Low",
];

// Header List
// These are the standard headers that are available from Metatrader 5
const HeaderList = [
	...CriticalHeaderList,
	"TickVolume",
	"Volume",
	"Spread"
];


module.exports = {
	DataTypes			:	DataTypes,
	TypicalTypes		:	TypicalTypes,
	defaultTypicalType	:	defaultTypicalType,
	ResolutionSequence	:	ResolutionSequence,
	CriticalHeaderList	:	CriticalHeaderList,
	HeaderList			:	HeaderList,
	ResolutionDuration	:	ResolutionDuration,
}