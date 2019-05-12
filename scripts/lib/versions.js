const Plotly				= require('plotly.js-dist');

class Versions {
	constructor () {
		this.Plotly = Plotly.version;
		this.PapaParse = "4.6.1";
	}

	printToConsole () {
		console.log(`PapaParse\tv: ${this.PapaParse}`);
		console.log(`Plot.ly\t\tv: ${this.Plotly}`);
	}
}

module.exports = Versions;