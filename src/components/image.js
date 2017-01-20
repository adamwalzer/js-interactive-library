import Asset from './asset.js';

class Image extends Asset {
    bootstrap() {
        this.setState({
            complete: this.props.complete
        });
    }

    render() {
        return (
            <img
                {...this.props}
                className={this.getClassNames()}
                onLoad={this.ready}
                onError={this.error}
                draggable={false}
            />
        );
    }
}

Image.defaultProps = _.defaults({
    complete: true,
}, Asset.defaultProps);

export default Image;
