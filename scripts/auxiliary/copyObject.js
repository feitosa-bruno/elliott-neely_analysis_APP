function copyObject (obj) {
	return JSON.parse(JSON.stringify(obj));
}

module.exports = copyObject;