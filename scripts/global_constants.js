// Typical Price Types
// These must be tied to the HTML Files
const TypicalTypes = [
	'HLC',
	'HL',
];
const defaultTypicalType = TypicalTypes[0];

// Resolution Types and Sequence
// These must be tied to the HTML Files
// This list also indicates the sequence from shortest timeframe to largest timeframe
const ResolutionSequence = [
	'_M1',
	'_H1',
	'_D1',
	'_W1',
];

// Resolution Duration in Seconds
// Keep the same Sequence as 'ResolutionSequence'
const ResolutionDuration = {
	_M1: 60000,
	_H1: 60000*60,
	_D1: 60000*60*24,
	_W1: 60000*60*24*7,
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
	TypicalTypes		:	TypicalTypes,
	defaultTypicalType	:	defaultTypicalType,
	ResolutionSequence	:	ResolutionSequence,
	CriticalHeaderList	:	CriticalHeaderList,
	HeaderList			:	HeaderList,
	ResolutionDuration	:	ResolutionDuration,
}