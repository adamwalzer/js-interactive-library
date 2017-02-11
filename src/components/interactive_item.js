import classNames from 'classnames';

import Component from 'components/component';

/*
 * InteractiveItem is meant to be used whenever you have one item colliding with another.
 * Colliding with an InteractiveItem will be considering interacting with it.
 * Interacting with it will invoke it's onInteract prop.
 * This item's ability to interact can be disabled and enabled.
 * A canInteract prop can also be passed into this component.
 */
class InteractiveItem extends Component {
    constructor(props) {
        super(props);

        this.state = _.defaults({
            enabled: true,
        }, this.state);
    }

    enable() {
        if (this.state.enabled) return;
        this.setState({enabled: true});
        if (this.media.enable) this.media.enable.play();
        return this.props.onEnable.call(this);
    }

    disable() {
        if (!this.state.enabled) return;
        this.setState({enabled: false});
        if (this.media.disable) this.media.disable.play();
        return this.props.onDisable.call(this);
    }

    interact(opts = {}) {
        if (this.canInteract()) {
            this.props.onInteract.call(this, opts);
            if (this.media.interact) this.media.interact.play();
        }
    }

    canInteract() {
        return this.state.enabled && this.props.canInteract.call(this);
    }

    bootstrap() {
        super.bootstrap();

        this.DOM = ReactDOM.findDOMNode(this);
    }

    getClassNames() {
        return classNames('interactive-item', {
            ENABLED: this.state.enabled,
        }, super.getClassNames());
    }
}

InteractiveItem.defaultProps = _.defaults({
    onEnable: _.noop,
    onDisable: _.noop,
    onInteract: _.noop,
    canInteract: () => true,
}, Component.defaultProps);

export default InteractiveItem;
