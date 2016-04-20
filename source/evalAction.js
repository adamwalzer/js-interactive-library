/**
 * @module evalAction
 */

/**
 * Performs `eval()` on the value of an `action` attribute on an HTML element.
 * @arg {string} _source - JavaScript source code.
 * @arg {Scope} _scope - The context in which to run the source.
 * @returns {*} The result of the evaluated source.
 */
function evalAction (_source, _scope) {
  var error;

  function target (_selector) {
    if (_scope.event) {
      return _selector ? $(_scope.event.target).closest(_selector) : $(_scope.event.target);
    }
  }
  
  // expose members of the object as if they were local variables.
  // NOTE: methods still retain their "this" binding to the object! :D
  return eval("with (_scope) { try {"+_source+";} catch (error) { console.error('Error:', error.message, 'evaluating action', _source, 'in', _scope.id() || _scope.address()); } }");
}

export default evalAction;
