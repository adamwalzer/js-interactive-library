export default function (file, callback) {
    let xobj;

    if (!skoash) skoash = {};
    if (!skoash._cache) skoash._cache = {};

    if (skoash._cache[file]) {
        callback(skoash._cache[file]);
        return;
    }

    xobj = new XMLHttpRequest();
    xobj.overrideMimeType('application/json');
    xobj.open('GET', file, true);
    xobj.onreadystatechange = function () {
        /* eslint-disable eqeqeq */
        if (xobj.readyState == 4) {
            if (xobj.status == '200') {
                skoash._cache[file] = xobj.responseText;
                callback(xobj.responseText);
            } else {
                console.log('Error', xobj.statusText); // eslint-disable-line no-console
            }
        }
        /* eslint-enable eqeqeq */
    };
    xobj.send(null);
}
