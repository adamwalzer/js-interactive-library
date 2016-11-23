import FontFaceObserver from 'fontfaceobserver';

import Asset from './asset.js';

class Font extends Asset {
    bootstrap() {
        this.font = new FontFaceObserver(this.props.name);
        this.font.load().then(this.ready).catch(this.error);

        if (this.props.complete) this.complete();
    }
}

Font.defaultProps = _.defaults({
    complete: true,
    shouldRender: false,
}, Asset.defaultProps);

export default Font;
