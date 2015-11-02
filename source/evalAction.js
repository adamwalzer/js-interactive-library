/**
*  @desc 
*/
export default function evalAction (_source, _scope, _errorMessage) {
	var error;
	// expose members of the object as if they were local variables.
	// NOTE: methods still retain their "this" binding to the object! :D
	return eval("with (_scope) { try {"+_source+";} catch (error) { console.error('Error:', _errorMessage); } }");
}