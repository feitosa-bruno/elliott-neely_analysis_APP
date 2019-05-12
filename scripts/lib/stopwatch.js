class Stopwatch {
	constructor (name) {
		this.name = name;
		this.t0 = 0;
		this.t1 = 0;
		this.isRunning = false;
	}
	
	start () {
		if(!this.isRunning){
			this.t0 = performance.now();
			this.isRunning = true;
		} else {
			console.warn(`Stopwatch for '${this.name}' already running.`);
		}
	}

	stop () {
		if(this.isRunning){
			this.t1 = performance.now();
			console.log(`${this.name} took ${this.someTime((this.t1 - this.t0), 2)}`);
			this.isRunning = false;
		} else {
			console.warn(`Stopwatch for '${this.name}' is stopped.`);
		}
	}

	// Math can't round decimals by standard, so "I" hacked it
	// Kudos to http://www.jacklmoore.com/notes/rounding-in-javascript/
	someTime (value, decimals) {
		var howFast = "milliseconds";
		if (value > 1000) {
			value = value/1000;
			howFast = "seconds";
		}
		return `${Number(Math.round(value+'e'+decimals)+'e-'+decimals)} ${howFast}.`;	
	}
}

module.exports = Stopwatch;