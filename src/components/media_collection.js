import Component from 'components/component';

class MediaCollection extends Component {
    play(ref) {
        if (this.refs[ref]) {
            this.refs[ref].play();
            this.props.onPlay.call(this, ref);
        }
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);

        if (props.play && props.play !== this.props.play) {
            props.play.split(' ').forEach(this.play.bind(this));
        }
    }
}

MediaCollection.defaultProps = _.defaults({
    onPlay: _.noop,
}, Component.defaultProps);

export default MediaCollection;
