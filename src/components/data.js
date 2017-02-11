import Component from './component';
import util from 'methods/util';

class Data extends Component {
    constructor(props) {
        super(props);

        this.state.ready = false;

        this.loadFile = util.loadFile;
        this.loadData(props.src);
    }

    loadData(src) {
        this.loadFile(src, response => {
            this.data = response;
            this.ready();
        });
    }

    getData() {
        return this.data;
    }
}

Data.defaultProps = _.defaults({
    src: '',
    complete: true,
    checkReady: false,
    checkComplete: false,
    shouldRender: false,
}, Component.defaultProps);

export default Data;
