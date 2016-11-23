import Component from './component.js';

class ListItem extends Component {}

ListItem.defaultProps = _.defaults({
    checkComplete: false,
    completeIncorrect: true,
    type: 'li',
}, Component.defaultProps);

export default ListItem;
