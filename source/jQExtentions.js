/**
*  @desc Extentions for jQuery objects.
*/
(function () {
	/**
	*  @desc Resolves the scope for each of the set of matched elements.
	*  @return (Scope|Array) Returns the scope for 1 result and an array of scopes for multiple elements.
	*/
	this.scope = function () {
		var result;

		result = [];

		this.each(function () {
			var $node, scope;

			$node = $(this)
			scope = $node.data('pl-scope');
			
			if (!scope) {
				scope = $node.closest('.pl-scope').data('pl-scope');
			}

			if (scope) result.push(scope);
		});

		return (result.length > 1) ? result : result[0];
	};

	this.id = function (_set) {
		if (_set !== undefined) {
			// Remove attribute.
			if (~['', null].indexOf(_set)) {
				this.attr('id', null);
				return this;
			}

			// If document already has the id defined then set as a 'play' id.
			if ($(_set).length) {
				this.attr('pl-id', _set);
			}

			else {
				this.attr('id', _set);
			}
		}

		return this.attr('id') || this.attr('pl-id');
	};

}).call($.fn);