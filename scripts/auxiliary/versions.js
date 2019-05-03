class Versions {
	constructor () {
		this.JSZip = JSZip.version;
		this.Plotly = Plotly.version;
		this.PapaParse = "4.6.1";
	}

	printToConsole () {
		console.log(`PapaParse\tv: ${this.PapaParse}`);
		console.log(`Plot.ly\t\tv: ${this.Plotly}`);
		console.log(`JSZip\t\tv: ${this.JSZip}`);
	}
}

module.exports = Versions;