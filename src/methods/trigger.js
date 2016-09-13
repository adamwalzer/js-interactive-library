var trigger = function (name, opts) {
  return (
    new Promise(resolve => {
      var e = new Event('trigger');
      e.name = name;
      e.opts = opts;
      e.respond = data => {
        resolve(data);
      };
      window.dispatchEvent(e);
    })
  );
};

export default trigger;
