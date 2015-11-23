/**
*  @desc 
*/
export default function evalAction (_source, _scope) {
	var error;

	function target (_selector) {
		if (_scope.event) {
			return _selector ? $(_scope.event.target).closest(_selector)[0] : $(_scope.event.target);
		}
	}
	
	// expose members of the object as if they were local variables.
	// NOTE: methods still retain their "this" binding to the object! :D
	return eval("with (_scope) { try {"+_source+";} catch (error) { console.error('Error:', error.message, 'evaluating action', _source, 'in', _scope.id() || _scope.address()); } }");
}