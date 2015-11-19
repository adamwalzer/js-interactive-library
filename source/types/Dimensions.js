/*
*  dimensions.js
*
*  Author: Micah Rolon <functionmicah@gmail.com>
*  Created: 11/12/14
*
*  This file contains objects for containing values about a plane. i.e. x or width.
*  Adds the convenience of keeping these values paired to passed around your application.
*  It also includes methods which you perform on the values and returns a new object
*  so the original values are maintained.
*
*  Usage:
*
*  New instances can be created by calling the create method.
*  cursorLocation = Point.create();
*
*  Then call set() to apply your values.
*  cursorLocation.set(event.clientX, event.clientY);
*
*  Then you can use the calculation methods to perform transformations.
*  relativeCursor = cursorLocation.scale(zoom);
*
*
*  DEVELOPER NOTES
*
*  If you want to change the value of one plane DO NOT just set the property.
*  Dimensional objects are also arrays so they need their indexs set as well.
*  i.e. point.width = 20; // DONT DO THIS, point[0] will not be set.
*
*  Use the setter. point.set('width', 10);
*
*
*  When adding new methods make sure you are returning a new instance.
*  Dimensional objects are meant to be immutable.
*
*  Follow this pattern:
*
*  this.method = function () {
*      // set with your calculated values.
*      return this.create().set( ... )
*  }
*/

/*jslint browser: true, eqeq: true, nomen: true, sloppy: true, white: true */

import BasicArray from 'types/BasicArray';

var Dimension, Size, Point;

// Base class for dimensional objects consisting of 2 planes.
Dimension = BasicArray.extend(function () {
	var originalMap;

	originalMap = this.map;

	this[0] = this[1] = 0;
	this.planeMap = null,
	this.length = 2;

	// Incerement each plane by a value or specify each plane.
	this.inc = function (_val, _plane2) {
		var a,b;

		if (_val.length === 2) {
			a = _val[0];
			b = _val[1];
		}

		else if (_plane2 != null) {
			a = _val;
			b = _plane2;
		}

		else {
			a = b = _val;
		}

		return this.create().set(
			this[0] + a,
			this[1] + b
		);
	};

	// Decerement each plane by a value or specify each plane.
	this.dec = function (_val, _plane2) {
		var a,b;

		if (_val.length === 2) {
			a = _val[0];
			b = _val[1];
		}

		else if (_plane2 != null) {
			a = _val;
			b = _plane2;
		}

		else {
			a = b = _val;
		}

		return this.create().set(
			this[0] - a,
			this[1] - b
		);
	};

	// Multiply each plane by a value or specify each plane.
	this.scale = function (_scale, _plane2) {
		return this.create().set(
			this[0] * _scale,
			this[1] * (_plane2 != null ? _plane2 : _scale)
		);
	};

	// Perfom a Math function on each plane
	// _fun: a string of the function name in the JS Math object,
	// followed by the whatever arguments the function take after first
	// since the first argument is the plane value.
	this.math = function (_fun) {
		var args = [].slice.call(arguments, 1);

		return this.create().set(
			Math[_fun].apply(Math, [this[0]].concat(args)),
			Math[_fun].apply(Math, [this[1]].concat(args))
		);
	};

	this.parseInt = function () {
		return this.create().set(
			parseInt(this[0]),
			parseInt(this[1])
		);
	};

	this.parseFloat = function () {
		return this.create().set(
			parseFloat(this[0]),
			parseFloat(this[1])
		);
	};

	this.planeOf = function (_index) {
		if (isNaN(parseInt(_index))) return null;
		return this.planeMap[_index];
	};

	this.map = function (_handler) {
		return originalMap.call(this, _handler).to(Object.getPrototypeOf(this));
	};
});

// Array prototype extension
// Creates an instance of _Thing and passes the array to _Things set function as its arguments
// Example: somePoint = [10, 10].to(Point);
// Example: somePoint = [10, 10].to('point');
// 
Array.prototype.to = function (_Thing) {
	var map;

	map = {
		point: Point,
		size: Size
	};

	if (typeof _Thing === 'string') {
		return map[_Thing.toLowerCase()].create().set(this);
	}
	
	else if (typeof _Thing === 'object' && ~[Point.set, Size.set].indexOf(_Thing.set)) {
		if (!_Thing.isPrototypeOf(this)) {
			return _Thing.set.apply(_Thing.create(), this);	
		}
	}
		
	return this;
}

// 2 Dimensional object containing width and height.
Size = Dimension.extend(function () {

	this.planeMap = ['width', 'height'];
	this.width = this.height = 0;

	this.set = function (_width, _height) {
		if (arguments.length === 1) {
			if (_width.width !== undefined && _width.height !== undefined) {
				this.width = this[0] = parseFloat(_width.width);
				this.height = this[1] = parseFloat(_width.height);
			}

			else if (_width.length === 2) {
				this.width = this[0] = parseFloat(_width[0]);
				this.height = this[1] = parseFloat(_width[1]);
			}
		}

		else {
			if (typeof _width === 'string' && ~['width', 'height'].indexOf(_width)) {
				this[_width] = parseFloat(_height);

				if (_width === 'width') {
					this[0] = parseFloat(_height);
				}

				else {
					this[1] = parseFloat(_height);
				}
			}

			else {
				this.width = this[0] = parseFloat(_width);
				this.height = this[1] = parseFloat(_height);
			}
		}
		
		return this;
	};

	this.hypotenuse = function () {
		return Math.floor(Math.sqrt(Math.pow(this.width, 2) + Math.pow(this.height, 2)));
	};

	this.applyTo = function (_object) {
		if (_object.nodeType === document.ELEMENT_NODE) {
			if (!(_object.width !== undefined || _object.height !== undefined)) {
				_object.style.width = this.width;
				_object.style.height = this.height;

				return this;
			}
		}

		_object.width = this.width;
		_object.height = this.height;

		return this;
	};

});

// Object containing coordinates on 2 dimensional cartesian plane.
Point = Dimension.extend(function () {

	this.planeMap = ['x', 'y'];
	this.x = this.y = 0;

	this.set = function (_x, _y) {
		if (arguments.length === 1) {
			if (_x.x !== undefined && _x.y !== undefined) {
				this.x = this[0] = parseFloat(_x.x);
				this.y = this[1] = parseFloat(_x.y);
			}

			else if (_x.length === 2) {
				this.x = this[0] = parseFloat(_x[0]);
				this.y = this[1] = parseFloat(_x[1]);
			}
		}

		else {
			if (typeof _x === 'string' && ~['x', 'y'].indexOf(_x)) {
				this[_x] = _y;

				if (_x === 'x') {
					this[0] = parseFloat(_y);
				}

				else {
					this[1] = parseFloat(_y);
				}
			}
			
			else {
				this.x = this[0] = parseFloat(_x);
				this.y = this[1] = parseFloat(_y);
			}
		}
		
		return this;
	};

	this.distance = function (_point) {
		if (_point.x !== undefined && _point.y !== undefined) {
			return Size.create().set(
				_point.x - this.x,
				_point.y - this.y
			);
		}

		return null;
	};

	this.applyTo = function (_object) {
		if (_object.nodeType === document.ELEMENT_NODE) {
			_object.style.left = this.x;
			_object.style.top = this.y;
		}

		else {
			_object.x = this.x;
			_object.y = this.y;
		}

		return this;
	};

	this.rotate = function (_origin, _angle) {
		var x, y, rad;

		rad = _angle * (Math.PI/180);

		x = this.x - _origin.x;
		y = this.y - _origin.y;

		return this.create().set(
			(Math.sin(rad) * x - Math.cos(rad) * y) + _origin.x,
			(Math.cos(rad) * x + Math.sin(rad) * y) + _origin.y
		);
	};

});

export default { Dimension, Size, Point };