export default function (name, opts = {}) {
    return (
        new Promise(resolve => {
            var e = new Event('trigger', {bubbles: false, cancelable: false});
            e.name = name;
            e.opts = opts;
            e.opts.respond = data => {
                resolve(data);
            };
            window.dispatchEvent(e);
        })
    );
}
