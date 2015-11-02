import play from 'play';

function run () {
	play.game.run();
}

// export namespace to global object;
window.play = window.pl = play;

/**
*  @desc Resolves the scope for each of the set of matched elements.
*  @return (Scope|Array) Returns the scope for 1 result and an array of scopes for multiple elements.
*/
$.fn.scope = function () {
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

document.addEventListener('DOMContentLoaded', run, false);