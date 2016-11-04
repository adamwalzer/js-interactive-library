export default function () {
  var onblur, onfocusout, hidden;

  window.addEventListener('resize', () => {
    this.scale();
  });
  window.addEventListener('orientationchange', () => {
    window.dispatchEvent(new Event('resize'));
  });
  if (window.parent) {
    window.parent.addEventListener('orientationchange', () => {
      window.dispatchEvent(new Event('orientationchange'));
    });
  }

  window.addEventListener('keydown', e => {
    this.onKeyDown(e);
  });

  window.addEventListener('platform-event', e => {
    this.trigger(e.name, e.gameData);
  });

  window.addEventListener('trigger', e => {
    this.trigger(e.name, e.opts);
  });

  window.addEventListener('load', window.focus);
  window.addEventListener('focus', () => {
    this.resume();
  });

  onblur = () => {
    var node = document.activeElement.parentNode;
    while (node != null) {
      if (node === this.DOMNode) {
        return;
      }
      node = node.parentNode;
    }
    this.pause();
  };

  onfocusout = () => {
    this.pause();
  };

  window.addEventListener('blur', onblur);

  // code from http://stackoverflow.com/questions/1060008/is-there-a-way-to-detect-if-a-browser-window-is-not-currently-active
  hidden = 'hidden';

  // Standards:
  if (hidden in document) {
    document.addEventListener('visibilitychange', onfocusout);
  } else if ((hidden = 'mozHidden') in document) {
    document.addEventListener('mozvisibilitychange', onfocusout);
  } else if ((hidden = 'webkitHidden') in document) {
    document.addEventListener('webkitvisibilitychange', onfocusout);
  } else if ((hidden = 'msHidden') in document) {
    document.addEventListener('msvisibilitychange', onfocusout);
  } else if ('onfocusin' in document) {
    // IE 9 and lower:
    document.onfocusin = document.onfocusout = onfocusout;
  } else {
    // All others:
    window.onpageshow = window.onpagehide
    = window.onfocus = window.onblur = onfocusout;
  }
}
