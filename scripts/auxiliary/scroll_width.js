// Get the Scroll Width for "any" webpage on "any" operating system
// Adapted from https://davidwalsh.name/detect-scrollbar-width (Thanks David Walsh)
// Define behavior on object creation: 'silent' (no console warn) or anything else
// If silent argument is not included

class getScrollbarWidth {
	constructor (behavior) {
		this.scrollbarWidth = 0;
		this.behavior = behavior;
	}

	procedure () {
		// Create DIV element...
		var scrollDiv = document.createElement("div");
		scrollDiv.style.width		= "100px";
		scrollDiv.style.height		= "100px";
		scrollDiv.style.overflow	= "scroll";
		scrollDiv.style.position	= "absolute";
		scrollDiv.style.top			= "-9999px";	/* way the hell off screen */

		// Append to page
		document.body.appendChild(scrollDiv);

		// Get Scrollbar Width
		this.scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

		// Bark Scrollbar Width if not silent (standard is TO bark)
		if(this.behavior !== "silent")
			console.warn(`Scroll Width: ${this.scrollbarWidth}px`);

		// Remove DIV element from page
		document.body.removeChild(scrollDiv);
	}

	getValue () {
		this.procedure();
		return this.scrollbarWidth;
	}
}

module.exports = getScrollbarWidth;