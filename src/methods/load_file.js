export default function (file, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType('application/json');
    xobj.open('GET', file, true);
    xobj.onreadystatechange = function () {
        /* eslint-disable eqeqeq */
        if (xobj.readyState == 4 && xobj.status == '200') {
            callback(xobj.responseText);
        }
        /* eslint-enable eqeqeq */
    };
    xobj.send(null);
}
