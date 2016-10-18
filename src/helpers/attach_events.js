export default function () {
  window.addEventListener('load', window.focus);
  window.addEventListener('focus', () => {
    this.resume();
  });
  window.addEventListener('blur', () => {
    var node = document.activeElement.parentNode;
    while (node != null) {
      if (node === this.DOMNode) {
        return;
      }
      node = node.parentNode;
    }
    this.pause();
  });

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
}
