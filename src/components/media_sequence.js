import Component from './component.js';

class MediaSequence extends Component {
    constructor(props) {
        super(props);

        this.playNext = this.playNext.bind(this);
    }

    start() {
        if (!this.props.silentOnStart && (!this.state.started || this.props.playMultiple)) this.play();
    }

    complete() {
        super.complete();
        this.setState({
            started: false
        });
    }

    play() {
        this.setState({
            started: true
        });

        if (this.refs[0]) {
            this.playingIndex = 0;
            this.refs[0].play();
        }

        if (this.props.checkComplete !== false) {
            this.checkComplete();
        }
    }

    playNext() {
        var next = this.refs[++this.playingIndex];
        if (next && this.state.started) next.play();
    }

    renderContentList() {
        var self = this;
        var children = [].concat(this.props.children);
        return children.map((component, key) =>
            <component.type
                {...component.props}
                ref={key}
                key={key}
                onComplete={function () {
                    self.playNext();
                    _.invoke(component, 'props.onComplete.call', this, this);
                }}
            />
        );
    }
}

MediaSequence.defaultProps = _.defaults({
    silentOnStart: false,
    // this prop toggles if the media sequence can be started while it is currently playing
    playMultiple: false,
}, Component.defaultProps);

export default MediaSequence;
