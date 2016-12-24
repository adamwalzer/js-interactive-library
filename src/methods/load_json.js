import loadFile from './load_file.js';

export default function (file, callback) {
    return loadFile(file, data => {
        callback(JSON.parse(data));
    });
}
