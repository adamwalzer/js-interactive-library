import { default as type, Basic } from 'types/Basic';

/**
*  @desc Contains all the jQuery methods targeted towards a property which references a jQuery object.
*  @proto Basic
*/
export default type('jQProxy', function () {
	var method, exclude;

	/**
	*  @desc Creates a function with a proxy to the jQuery method.
	*  @param _name (String) The name of the method being proxied.
	*  @return (jQuery|*) Either a jQuery object or whatever the original method returns.
	*  @private
	*/
	function createProxyFunction (_name) {
		return function () {
			var response;

			// This makes sure your not calling any jQuery methods before initialization.
			if (!this.$els) {
				console.error('ReferenceError: Unable to invoke', _name, 'because the scope is not initialized.');
				return;
			}

			response = $.fn[_name].apply(this.$els, arguments);

			if (response === this.$els || (response && response.jquery && response.is(this.$els))) {
				return this;
			}

			return response;
		};
	}

	// We don't want jQuery methods overridding our base type's methods.
	exclude = ['constructor'].concat(Object.keys(Basic));

	this.$els = null;

	for (method in $.fn) {
		if (!$.fn.hasOwnProperty(method) || ~exclude.indexOf(method)) continue;
		this[method] = createProxyFunction(method);
	}
});
