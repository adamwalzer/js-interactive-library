import _ from 'lodash';

import Component from './component.js';

class ListItem extends Component {
  componentWillMount() {
    if (!this.props.correct) {
      this.complete();
    }
  }
}

ListItem.defaultProps = _.defaults({
  checkComplete: false,
  type: 'li',
}, Component.defaultProps);

export default ListItem;
