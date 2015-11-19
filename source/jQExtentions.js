import { Point, Size } from 'types/Dimensions';
import Matrix from 'lib/matrix';

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


		return this.attr('id') || this.attr('pl-id') || this.attr('pl-component');
	};

	this.address = function () {
		var tag, id, classes;

		tag = this[0].nodeName.toLowerCase();
		id = this.attr('id');
		classes = this.attr('class') ? '.'+this.attr('class').split(' ').join('.') : '';
		
		return tag+(id ? '#'+id : '')+classes;
	};

	this.state = function (_test) {
		var classes;

		if (_test) return this.hasClass(_test);

		classes = (this.attr('class') || '').match(/[0-9A-Z]+(?:-[0-9A-Z]+)?/g);

		return classes && (classes.length === 1 ? classes[0] : classes);
	};

	this.absolutePosition = function () {
		var offset;

		if (!arguments.length) {
			offset = this.offset();

			return Point.create().set(offset.left, offset.top);
		}

		else {
			offset = Point.set.apply(Point.create(), arguments);
			
			this.css({
				position: 'absolute',
				top: offset.y,
				left: offset.x
			});

			return offset;
		}
	};

	this.transform = function () {
		var t, matrix, is3d;
		
		matrix = new Matrix();
		
		if (!arguments.length) {
			t = this.css('transform');
			is3d = !!~t.indexOf('matrix3d');

			if (t !== 'none') {
				t = ((t.match(/\(([,\d\.\s\-]+)\)/) || [])[1] || '').split(/\s*,\s*/);
				if (is3d) {
					t = (function (_matrix) {
						var i, result;

						result = [];

						for (i=0; i < _matrix.length; i+=4) {
							result = result.concat(_matrix.slice(i, i+2))
						}
						return result;
					}(t));
				}

				t = t.map(parseFloat);

				matrix.setTransform.apply(matrix, t);

				return matrix;
			}

			return t;
		}

		matrix.setTransform.apply(matrix, arguments);

		this.css('transform', matrix.toCSS());

		return matrix;
	};

	this.transformPosition = function () {
		var matrix, point;
		
		matrix = this.transform();
		point = Point.create();

		if (matrix !== 'none') {
			if (!arguments.length) {
				point.set(matrix.e, matrix.f);
			}
			
			else{
				matrix = new Matrix();

				point.set.apply(point, arguments);
				matrix.translate(point.x, point.y);

			}
		}

		return point;
	};

}).call($.fn);