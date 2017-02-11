import Component from 'components/component';

class Repeater extends Component {
    renderContentList(listName = 'children') {
        var a = [];
        for (let i = 0; i < this.props.amount; i++) {
            a.push(
                <this.props.item.type
                    key={i}
                    ref={_.get(this, `props.refs.${i}`, listName + '-' + i)}
                    {...this.props.item.props}
                    {...this.props.props[i]}
                />
            );
        }
        return a;
    }
}

Repeater.defaultProps = _.defaults({
    amount: 1,
    item: <div />,
    props: [],
}, Component.defaultProps);

export default Repeater;
