function renameProperty (object, oldKey, newKey)  {
	// Do nothing if the key names are the same
	if (oldKey !== newKey) {
		Object.defineProperty(
			object,
			newKey,
			Object.getOwnPropertyDescriptor(object, oldKey)
		);
		delete object[oldKey];
	}
}

module.exports = renameProperty;