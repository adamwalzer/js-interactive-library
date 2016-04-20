/**
 * 
 * @module
 * @version 1.1
 * @author Micah Rolon <functionmicah@gmail.com>
 * @requires module:types/BasicArray~BasicArray
 *
 * @desc *Created: 11/12/14*
 *
 * This file contains objects for containing values about a plane. i.e. x or width.
 * Adds the convenience of keeping these values paired to passed around your application.
 * It also includes methods which you perform on the values and returns a new object
 * so the original values are maintained.
 *
 * #### Usage
 *
 * New instances can be created by calling the create method.
 * ```
 * cursorLocation = Point.create();
 * ```
 *
 * Then call `set()` to apply your values.
 * ```
 * cursorLocation.set(event.clientX, event.clientY);
 * ```
 *
 * Then you can use the calculation methods to perform transformations.
 * ```
 * relativeCursor = cursorLocation.scale(zoom);
 * ```
 *
 * #### Developer Notes
 *
 * When adding new methods make sure you are returning a new instance.
 * Dimensional objects are meant to be immutable.
 *
 * Follow this pattern:
 * ```
 * this.method = function () {
 *     // set with your calculated values.
 *     return this.create().set( ... )
 * }
 * ```
 *
 * #### Change Log
 * *v1.1 - 12/13/15*
 * - Defined setter/getter properties for unique planes keys. You can now do `point.width = 10`.
 */

/*jslint browser: true, eqeq: true, nomen: true, sloppy: true, white: true */

import BasicArray from 'types/BasicArray';

var Dimension, Size, Point;

/**
 * The native Array
 * @external Array
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array}
 */

/**
 * Array prototype extension
 * Creates an instance of `_Thing` and passes the array to its set function as its arguments.
 * @function external:Array#to
 * @arg {Point|Size|string} _Thing - A Dimension object or one the strings 'point'/'size'
 * @example
 * somePoint = [10, 10].to(Point);
 * somePoint = [10, 10].to('point');
 */
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

/**
 * <span class="important">NOTE:</span> This is NOT a constructor. use `Dimension.create()` to get a new instance.
 * @class
 * @classdesc Base class for dimensional objects consisting of 2 planes.<br>
 * <span class="important">NOTE:</span> This is an immutable class. Methods return a new object with the original as its prototype.
 * @extends module:types/BasicArray~BasicArray
 */
Dimension = BasicArray.extend(function () {
  var originalMap;

  originalMap = this.map;

  this[0] = this[1] = 0;
  this.planeMap = null,
  this.length = 2;

  /**
   * Provides a new instance.
   * @arg {array} _argumentsArray - Create a new instace with an arguments array.
   * @returns {Dimension}
   */
  this.create = function (_argumentsArray) {
    var instance;

    instance = this.proto();

    if (_argumentsArray) instance.set.apply(instance, _argumentsArray);

    return instance;
  };

  /**
   * Incerement each plane by a value or specify each plane.
   * @arg {number} _val - plane a of (a,b)
   * @arg {number} [_plane2] - plane b of (a,b)
   * @returns {Dimension}
   */
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

  /**
   * Decerement each plane by a value or specify each plane.
   * @arg {number} _val - plane a of (a,b)
   * @arg {number} [_plane2] - plane b of (a,b)
   * @returns {Dimension}
   */
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

  /**
   * Multiply each plane by a value or specify each plane.
   * @arg {number} _scale - plane a of (a,b)
   * @arg {number} [_plane2] - plane b of (a,b)
   * @returns {Dimension}
   */
  this.scale = function (_scale, _plane2) {
    return this.create().set(
      this[0] * _scale,
      this[1] * (_plane2 != null ? _plane2 : _scale)
    );
  };

  /**
   * Perfom a Math function on each plane
   * @arg {string} _fun - a string of the function name in the JS Math object,
   * followed by the whatever arguments the function takes after its first
   * since the first argument is the plane value.
   * @returns {Dimension}
   */
  this.math = function (_fun) {
    var args = [].slice.call(arguments, 1);

    return this.create().set(
      Math[_fun].apply(Math, [this[0]].concat(args)),
      Math[_fun].apply(Math, [this[1]].concat(args))
    );
  };

  /**
   * Takes each plane value and passes it to parseInt().
   * @returns {Dimension}
   */
  this.parseInt = function () {
    return this.create().set(
      parseInt(this[0]),
      parseInt(this[1])
    );
  };

  /**
   * Takes each plane value and passes it to parseFloat().
   * @returns {Dimension}
   */
  this.parseFloat = function () {
    return this.create().set(
      parseFloat(this[0]),
      parseFloat(this[1])
    );
  };

  /**
   * Resolves the name of the plane at the given index.
   * @arg {number} _index - The index of the plane.
   * @returns {string}
   */
  this.planeOf = function (_index) {
    if (isNaN(parseInt(_index))) return null;
    return this.planeMap[_index];
  };

  /**
   * Make a new array by iterating over each plane.<br>
   * See [`Array.prototype.map()`]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map}
   * @arg {function} _handler - handler for each index.
   * @override
   * @returns {Dimension}
   */
  this.map = function (_handler) {
    return originalMap.call(this, _handler).to(Object.getPrototypeOf(this));
  };

  /**
   * Multiplies the planes.
   * @returns {number}
   */
  this.product = function () {
    return this[0] * this[1];
  };

  /**
   * Divides the planes.
   * @returns {number}
   */
  this.ratio = function () {
    return this[0] / this[1];
  };

  this.quotient = function () {
    return Math.floor(this[0] / this[1]);
  };

  this.remainder = function () {
    return this[0] % this[1];
  };
  
});

/**
 * <span class="important">NOTE:</span> This is NOT a constructor. use `Size.create()` to get a new instance.
 * @class
 * @extends module:types/Dimensions~Dimension
 * @classdesc 2 Dimensional object containing width and height.<br>
 * <span class="important">NOTE:</span> This is an immutable class. Methods return a new object with the original as its prototype.
 * @prop {number} width - The width.
 * @prop {number} height - The height.
 */
Size = Dimension.extend(function () {
  /**
   * Maps the names of the indexes.<br>
   * See [Dimension#planeOf]{@link module:types/Dimensions~Dimension#planeOf} for resolving plane name.
   * @protected
   * @default ['width', 'height']
   */
  this.planeMap = ['width', 'height'];

  Object.defineProperties(this, {
    width: {
      get: function () {
        return this[0];
      },

      set: function (_val) {
        this[0] = Number(_val);
      }
    },

    height: {
      get: function () {
        return this[1];
      },

      set: function (_val) {
        this[1] = Number(_val);
      }
    }
  });

  /**
   * Define the size with an object. (overloaded)
   * @function module:types/Dimensions~Size#set
   * @arg {object} _size - A size object {width, height}.
   * @returns {Size}
   */

  /**
   * Define the size with an array. (overloaded)
   * @function module:types/Dimensions~Size#set
   * @arg {array} _size - A size array [width, height].
   * @returns {Size}
   */

  /**
   * Define the size.
   * @arg {number} _width - The width.
   * @arg {number} _height - The height.
   * @returns {Size}
   */
  this.set = function (_width, _height) {
    if (arguments.length === 1) {
      if (_width.width !== undefined && _width.height !== undefined) {
        this[0] = Number(_width.width);
        this[1] = Number(_width.height);
      }

      else if (_width.length === 2) {
        this[0] = Number(_width[0]);
        this[1] = Number(_width[1]);
      }
    }

    else {
      this[0] = Number(_width);
      this[1] = Number(_height);
    }
    
    return this;
  };

  /**
   * Calculates the hypotenuse.
   * @see {@link https://en.wikipedia.org/wiki/Hypotenuse}
   * @returns {number}
   */
  this.hypotenuse = function () {
    return Math.sqrt(Math.pow(this.width, 2) + Math.pow(this.height, 2));
  };

  /**
   * Sets width and height properties on the given object. If the object is an HTML node then it will be set on the nodes style object.
   * @arg {object|HTMLElement} - The object or DOM node.
   * @returns {this}
   */
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

/**
 * <span class="important">NOTE:</span> This is NOT a constructor. use `Point.create()` to get a new instance.
 * @class
 * @extends module:types/Dimensions~Dimension
 * @classdesc Object containing coordinates on a 2-dimensional cartesian plane.<br>
 * <span class="important">NOTE:</span> This is an immutable class. Methods return a new object with the original as its prototype.
 * @prop {number} x - The x coordinate.
 * @prop {number} y - The y coordinate.
 */
Point = Dimension.extend(function () {
  /**
   * Maps the names of the indexes.<br>
   * See [Dimension#planeOf]{@link module:types/Dimensions~Dimension#planeOf} for resolving plane name.
   * @protected
   * @default ['x', 'y']
   */
  this.planeMap = ['x', 'y'];

  Object.defineProperties(this, {
    x: {
      get: function () {
        return this[0];
      },

      set: function (_val) {
        this[0] = Number(_val);
      }
    },

    y: {
      get: function () {
        return this[1];
      },

      set: function (_val) {
        this[1] = Number(_val);
      }
    }
  });

  /**
   * Define the point with an object. (overloaded)
   * @function module:types/Dimensions~Point#set
   * @arg {object} _point - A point object {x, y}.
   * @returns {Point}
   */

  /**
   * Define the point with an array. (overloaded)
   * @function module:types/Dimensions~Point#set
   * @arg {array} _point - A point array [x, y].
   * @returns {Point}
   */

  /**
   * Define the point.
   * @arg {number} _x - The x.
   * @arg {number} _y - The y.
   * @returns {Point}
   */
  this.set = function (_x, _y) {
    if (arguments.length === 1) {
      if (_x.x !== undefined && _x.y !== undefined) {
        this[0] = Number(_x.x);
        this[1] = Number(_x.y);
      }

      else if (_x.length === 2) {
        this[0] = Number(_x[0]);
        this[1] = Number(_x[1]);
      }
    }

    else {
      this[0] = Number(_x);
      this[1] = Number(_y);
    }
    
    return this;
  };

  /**
   * Calculates the distance between the insatnce and a point object.
   * @arg {Point} _point - A point object {x,y}.
   * @returns {Size}
   */
  this.distance = function (_point) {
    if (_point.x !== undefined && _point.y !== undefined) {
      return Size.create().set(
        _point.x - this.x,
        _point.y - this.y
      );
    }

    return null;
  };

  /**
   * Sets x and y properties on the given object. If the object is an HTML node then the left and top properties will be set on the nodes style object.
   * @arg {object|HTMLElement} - The object or DOM node.
   * @returns {this}
   */
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

  /**
   * Rotate the point based on an origin point and an angle in degrees.
   * @arg {Point} _origin - A point object {x,y}.
   * @arg {number} _angle - The angle of rotation in degrees.
   * @returns {this}
   */
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
