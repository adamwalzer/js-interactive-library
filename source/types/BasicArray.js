/**
 * Base object type for 'array like' objects.
 * @module
 * @requires module:util
 * @requires module:types/Basic
 */
import util from 'util';
import Basic from 'types/Basic';

/**
 * <span class="important">NOTE:</span> This is NOT a constructor. use `BasicArray.create()` to get a new instance.
 * @classdesc A base object type for 'array like' object.
 * @class
 * @extends external:Array
 * @extends module:types/Basic~Basic
 * @mixes module:types/Basic~Basic
 */
var BasicArray = (function () {
	/**
	 * Objects with this as an own property will be identified as the root object.
	 * @memberof module:types/BasicArray~BasicArray
	 * @readonly
	 * @default
	 */
	this.baseType = 'TYPE_BASIC_ARRAY';
	
	util.mixin(this, Basic);

	return this;

}).call([]);

export default BasicArray;