import classNames from 'classnames';
import Component from './component';

class Randomizer extends Component {
    getAll() {
        return _.shuffle(this.props.bin);
    }

    get(amount = 1) {
        var items;
        var bin = [];

        if (this.props.remain && this.state.bin) {
            bin = this.state.bin;
        }

        while (bin.length < amount) {
            bin = bin.concat(_.shuffle(this.props.bin));
        }

        items = bin.splice(0, amount);

        if (this.props.remain) {
            this.setState({bin});
        }

        return items;
    }

    getClassNames() {
        return classNames('randomizer', super.getClassNames());
    }

    renderBin() {
        return _.map(this.props.bin, (li, key) => {
            var ref = li.ref || (li.props && li.props['data-ref']) || key;
            return (
                <li.type
                    {...li.props}
                    data-ref={ref}
                    ref={ref}
                    key={key}
                />
            );
        });
    }

    render() {
        return (
            <ul className={this.getClassNames()}>
                {this.renderBin()}
            </ul>
        );
    }
}

Randomizer.defaultProps = _.defaults({
    bin: [],
    remain: false,
    shouldComponentUpdate: () => false,
    shouldStart: false,
}, Component.defaultProps);

export default Randomizer;
