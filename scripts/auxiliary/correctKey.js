function correctKey (name)  {
	var newName = name.replace(/[^0-9a-zA-Z]/g,"").toLowerCase();
	if (newName === 'tickvol') {
		newName = 'TickVolume';
	} else if (newName === 'vol') {
		newName = 'Volume';
	} else {
		newName = newName.charAt(0).toUpperCase() + newName.substr(1);
	}
	return newName;
}

module.exports = correctKey;