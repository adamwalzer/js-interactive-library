/**
*  Collection
*  @desc Contains...
*  @proto Array, Basic
*/

import util from 'util';
import Basic from 'types/Basic';

var BasicArray = (function () {

	this.baseType = 'TYPE_BASIC_ARRAY';
	
	util.mixin(this, Basic);

	return this;

}).call([]);

export default BasicArray;