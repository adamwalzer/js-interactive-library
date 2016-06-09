import Component from './component.js';

class ListItem extends Component {
  constructor() {
    super();
  }

  componentWillMount() {
    if (!this.props.correct) {
      this.complete();
    }
  }

  checkComplete() {
    // list items should not check for being complete
  }

  render() {
    return (
      <li {...this.props}></li>
    );
  }
}

export default ListItem;
