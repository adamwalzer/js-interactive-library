import classNames from 'classnames';

import Component from 'components/component';

class Selectable extends Component {
    constructor(props) {
        super(props);

        this.state = {
            classes: {},
            selectFunction: this.select,
        };
    }

    start() {
        var selectFunction;
        var classes = this.state.classes;

        super.start();

        selectFunction = this.props.selectClass === 'HIGHLIGHTED' ? this.highlight : this.select;

        if (this.props.selectOnStart) {
            classes[this.props.selectOnStart] = this.props.selectClass;
        }

        this.setState({
            started: true,
            classes,
            selectFunction,
        });
    }

    bootstrap() {
        super.bootstrap();

        if (this.refs.bin) {
            this.setState({
                list: this.refs.bin.getAll()
            });
        }
    }

    selectHelper(e, classes) {
        var ref;
        var dataRef;
        var target;
        var isCorrect;

        if (typeof e === 'string') {
            dataRef = e;
        } else {
            target = e.target.closest('LI');

            if (!target) return;

            dataRef = target.getAttribute('data-ref');
        }

        ref = this.refs[dataRef];

        isCorrect = (ref && ref.props && ref.props.correct) ||
            (!this.props.answers || !this.props.answers.length ||
                this.props.answers.indexOf(dataRef) !== -1);

        if (this.props.allowDeselect && classes[dataRef]) {
            delete classes[dataRef];
        } else if (isCorrect) {
            classes[dataRef] = this.props.selectClass;
        }

        this.setState({
            classes,
        });

        this.props.onSelect.call(this, dataRef);

        if (this.props.chooseOne) this.complete();

        if (this.props.dataTarget) {
            this.updateScreenData({
                key: this.props.dataTarget,
                data: {
                    target: ref
                }
            });
        }

        if (this.props.completeListOnClick) {
            _.each(this.refs, (r, k) => {
                if (k === dataRef) _.invoke(r, 'complete');
            });
        }
    }

    select(e) {
        var classes = [];
        this.selectHelper(e, classes);
    }

    highlight(e) {
        var classes = this.state.classes;
        this.selectHelper(e, classes);
    }

    getClass(key, li) {
        return classNames(
            li.props.className,
            this.state.classes[key],
            this.state.classes[li.props['data-ref']],
            this.state.classes[li.props['data-key']]
        );
    }

    getClassNames() {
        return classNames('selectable', super.getClassNames());
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);

        if (props.select && props.select !== this.props.select) {
            this.state.selectFunction.call(this, props.select);
        }
    }

    renderBin() {
        if (!this.props.bin) return null;

        return (
            <this.props.bin.type
                {...this.props.bin.props}
                ref="bin"
            />
        );
    }

    renderList() {
        var list = this.props.list || this.state.list;
        return list.map((li, key) => {
            var dataRef = li.props['data-ref'] || key;
            var ref = li.ref || li.props.id || dataRef;
            var message = li.props.message || '' + key;
            return (
                <li.type
                    {...li.props}
                    type="li"
                    className={this.getClass(key, li)}
                    message={message}
                    data-message={message}
                    data-ref={dataRef}
                    ref={ref}
                    key={key}
                />
            );
        });
    }

    render() {
        return (
            <div>
                {this.renderBin()}
                <ul className={this.getClassNames()} onClick={this.state.selectFunction.bind(this)}>
                    {this.renderList()}
                </ul>
            </div>
        );
    }
}

Selectable.defaultProps = _.defaults({
    list: [
        <li></li>,
        <li></li>,
        <li></li>,
        <li></li>
    ],
    selectClass: 'SELECTED',
    completeListOnClick: true,
    onSelect: _.noop,
}, Component.defaultProps);

export default Selectable;
