var COMPONENTS;

export default function component (_name, _implementation) {
	if (!component.get(_name)) {
		COMPONENTS.push({
			name: _name,
			implementation: _implementation
		});
	}

	return this;
}

COMPONENTS = [];

component.get = function (_name) {
	var i, record;

	for (i=0; record = COMPONENTS[i]; i+=1) {
		if (record.name === _name) return record;
	}

	return null;
};

component.load = function (_path, _callback) {
	$.loadScript
	return this;
};
component.config = function () {};