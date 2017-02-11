import Data from './data';
import util from 'methods/util';

class JSON extends Data {
    constructor(props) {
        super(props);

        this.loadFile = util.loadJSON;
        this.loadData(props.src);
    }
}

export default JSON;
