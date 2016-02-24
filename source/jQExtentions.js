/**
 * Extentions to jQuery used by the library.
 * 
 * @module
 * @author Micah Rolon <micah@ginasink.com>
 *
 * @requires types/Dimensions
 * @requires Matrix
 */
import { Point, Size } from 'types/Dimensions';
import Matrix from 'lib/matrix';

/**
 * jQuery's prototype
 * @external jQuery
 * @see {@link http://api.jquery.com/}
 */

(function () {
	var original;

	original = {
		position: this.position
	};

	/**
	 * Resolves the scope for each of the set of matched nodes.
	 * @function external:jQuery#scope
	 * @returns {Scope|array} Scope - for 1 result. array - for multiple.
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

	/**
	 * Resolves the id on the first node in the collection. The id can be sourced from a node's 'id', 'pl-id' or 'pl-component' arguments.
	 * @function external:jQuery#id
	 * @arg {string} [_set] Name to set as the node's id.
	 * @returns {string} The resolved id.
	 */
	this.id = function (_set) {
		if (_set !== undefined) {
			// Remove attribute.
			if (~['', null].indexOf(_set)) {
				this.attr('id', null);
			}

			// If document already has the id defined then set as a unique library id.
			if ($('#'+_set).length) {
				this.attr('pl-id', _set);
			}

			else {
				this.attr('id', _set);
			}
			
			return this;
		}

		return this.attr('id') || this.attr('pl-id') || this.attr('pl-component');
	};

	/**
	 * Provides the 'relative' CSS selector for the first node in the collection.
	 * @function external:jQuery#address
	 * @returns {string}
	 *
	 * @example
	 * // HTML: <div id="sweater" class="wide"></div>
	 * $('#sweater').address() // div#sweater.wide
	 */
	this.address = function () {
		var tag, id, classes;

		tag = this[0].nodeName.toLowerCase();
		id = this.attr('id');
		classes = this.attr('class') ? '.'+this.attr('class').split(' ').join('.') : '';
		
		return tag+(id ? '#'+id : '')+classes;
	};

	/**
	 * Provides a node's UPPER CASE class names. Given '_test' it will check if the node has the class.
	 * @function external:jQuery#state
	 * @arg {string} [_test] The UPPER CASE class name to test on the first node in the collection.
	 * @returns {string|array|boolean} string - for one result. array - for multiple. boolean - for tests.
	 */
	this.state = function (_test) {
		var classes;

		if (_test) return this.hasClass(_test.toUpperCase());

		classes = (this.attr('class') || '').match(/[0-9A-Z]+(?:-[0-9A-Z]+)?/g);

		return classes && (classes.length === 1 ? classes[0] : classes);
	};

	this.size = function () {
		var size;

		if (!arguments.length) {
			size = Size.create().set(this.width(), this.height());	
		} else {
			size = Size.create(arguments);
			this.css(size);
		}

		return size;
	};

	this.position = function () {
		var pos;

		if (!arguments.length) {
			pos = original.position.call(this);
			pos = Point.create().set(pos.left, pos.top);
		} else {
			pos = Point.create(arguments);

			this.css({
				position: 'relative',
				left: pos.x,
				top: pos.y
			});
		}

		return pos;
	};

	/**
	 * Provides the jQuery offset for the first node in the collection.
	 * Given a point, all nodes in the collection will get {position: absolute;} to the corrdinates.
	 * @function external:jQuery#absolutePosition
	 * @returns {Point}
	 */
	this.absolutePosition = function () {
		var offset;

		if (!arguments.length) {
			offset = this.offset();

			return Point.create().set(offset.left, offset.top);
		}

		else {
			offset = Point.create(arguments);

			this.css({
				position: 'absolute',
				top: offset.y,
				left: offset.x
			});

			return offset;
		}
	};
	
	/**
	 * Sets a CSS matrix transform on all nodes in the collection. (overloaded)
	 * @function external:jQuery#transform
	 * @arg {number} [_scaleX] - scale x
	 * @arg {number} [_shearY] - shear y
	 * @arg {number} [_shearX] - shear x
	 * @arg {number} [_scaleY] - scale y
	 * @arg {number} [_translateX] - translate x
	 * @arg {number} [_translateY] - translate y
	 * @returns {Matrix}
	 */

	/**
	 * Provides the CSS matrix transform for the first node in the collection.
	 * @function external:jQuery#transform
	 * @returns {Matrix}
	 */
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

	/**
	 * Getter/Setter for the CSS transform translation. (overloaded)
	 * @function external:jQuery#transformPosition
	 * @arg {Point} _point - A point object {x,y}
	 * @returns {Point}
	 */

	/**
	 * Getter/Setter for the CSS transform translation.
	 * @function external:jQuery#transformPosition
	 * @arg {number} _x - x coordinate
	 * @arg {number} _y - y coordinate
	 * @returns {Point}
	 */
	this.transformPosition = function () {
		var matrix, point;
		
		matrix = this.transform();
		point = Point.create().set(0,0);

		if (!arguments.length) {
			if (matrix !== 'none') point.set(matrix.e, matrix.f);
		} else {
			if (matrix === 'none') matrix = new Matrix();

			point.set.apply(point, arguments);
			matrix.translate(point.x, point.y);
			this.css('transform', matrix.toCSS());
		}

		return point;
	};

	/**
	 * Getter for the CSS transform scale. (overloaded)
	 * @function external:jQuery#transformPosition
	 * @returns {Point}
	 */

	/**
	 * Setter for the CSS transform scale. (overloaded)
	 * @function external:jQuery#transformPosition
	 * @arg {Point} _point - A point object {x,y}
	 * @returns {Point}
	 */

	/**
	 * Setter for the CSS transform scale.
	 * @function external:jQuery#transformPosition
	 * @arg {number} _x - x coordinate
	 * @arg {number} _y - y coordinate
	 * @returns {Point}
	 */
	this.transformScale = function () {
		var matrix, scale;
		
		matrix = this.transform();
		scale = Point.create().set(1,1);

		if (!arguments.length) {
			if (matrix !== 'none') scale.set(matrix.a, matrix.d);
		} else {
			if (matrix === 'none') matrix = new Matrix();

			scale.set.apply(scale, arguments);
			matrix.scale(scale.x, scale.y);
			this.css('transform', matrix.toCSS());
		}

		return scale;
	};

	/**
	 * Accessor method for `pl` attributes.
	 */
	this.pl = function (_name, _value) {
		var args;
		args = ['pl-'+_name];
		if (typeof _value !== 'undefined') args.push(_value);

		if (_value === null) {
			this.removeAttr('pl-'+_name);
			return this;
		}

		return this.attr.apply(this, args);
	};

}).call($.fn);
