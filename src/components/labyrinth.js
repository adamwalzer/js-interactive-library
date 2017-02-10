import classNames from 'classnames';

import Component from 'components/component';

const MAP = 'map';
const CANVAS = 'canvas';
const IMAGE = 'image';
const PLAYER = 'player';
const BUFFER = 'buffer';
const CONTEXT = 'context';

class Labyrinth extends Component {
    constructor(props) {
        super(props);

        this.update = _.throttle(this.update.bind(this), 10);
        this.playCollideSound = _.throttle(this.playCollideSound.bind(this), 500);
    }

    onReady() {
        this[IMAGE] = ReactDOM.findDOMNode(this.refs[IMAGE]);
        this[MAP] = ReactDOM.findDOMNode(this.refs[MAP]);
        this[PLAYER] = ReactDOM.findDOMNode(this.refs[PLAYER]);
        this[BUFFER] = ReactDOM.findDOMNode(this.refs[CANVAS]);

        this[CONTEXT] = this[BUFFER].getContext('2d');

        this.setState({
            playerX: this.props.startX,
            playerY: this.props.startY,
        });

        this.items = [];
        this.enemies = [];
        _.each(this.refs, (ref, key) => {
            if (!key.indexOf('items-')) {
                this.items.push(ref);
            } else if (!key.indexOf('enemies-')) {
                this.enemies.push(ref);
            }
        });
    }

    start() {
        super.start();

        this.setState({
            playerX: this.props.startX,
            playerY: this.props.startY,
        });

        this.incompleteRefs();

        _.each(this.items, item => item.enable());
        _.each(this.enemies, enemy => enemy.enable());
    }

    update() {
        var hasTrue;
        var enemy;
        var item;
        var playerX = this.state.playerX;
        var playerY = this.state.playerY;

        if (!this[PLAYER]) return;

        if (this.props.input.up) playerY -= this.props.speed;
        if (this.props.input.down) playerY += this.props.speed;
        if (this.props.input.left) playerX -= this.props.speed;
        if (this.props.input.right) playerX += this.props.speed;

        hasTrue = _.some(this.props.input, v => v);
        enemy = this.getCollidingObject(this.enemies, playerX, playerY);
        item = this.getCollidingObject(this.items, playerX, playerY);

        if (this.isColliding(playerX, playerY)) {
            this.playCollideSound();
            this.props.onCollide.call(this);
        } else if (enemy) {
            this.props.onCollideEnemy.call(this, enemy);
        } else {
            if (item) {
                this.props.onCollideItem.call(this, item);
            }
            this.setState({
                playerX,
                playerY,
            }, () => {
                if (hasTrue) window.requestAnimationFrame(this.update);
            });
        }
    }

    isColliding(x, y) {
        var offset;
        var playerOffset;
        offset = this[IMAGE].getBoundingClientRect();
        playerOffset = this[PLAYER].getBoundingClientRect();

        this[BUFFER].width = offset.width / this.props.scale;
        this[BUFFER].height = offset.height / this.props.scale;

        if (!this[BUFFER].width || !this[BUFFER].height) return false;

        this[CONTEXT].clearRect(0, 0, this[BUFFER].width, this[BUFFER].height);
        this[CONTEXT].drawImage(this[MAP], 0, 0, this[BUFFER].width, this[BUFFER].height);

        return (
            // top
            !this[CONTEXT].getImageData(x + (playerOffset.width / this.props.scale / 2), y, 1, 1).data[0] ||
            // right
            !this[CONTEXT].getImageData(x + (playerOffset.width / this.props.scale), y +
                (playerOffset.width / this.props.scale / 2), 1, 1).data[0] ||
            // bottom
            !this[CONTEXT].getImageData(x + (playerOffset.width / this.props.scale / 2), y +
                (playerOffset.height / this.props.scale), 1, 1).data[0] ||
            // left
            !this[CONTEXT].getImageData(x, y + (playerOffset.height / this.props.scale / 2), 1, 1).data[0]
        );
    }

    playCollideSound() {
        this.playMedia('collide');
    }

    getCollidingObject(objects, playerX, playerY) {
        var offset = {
            width: this[PLAYER].offsetWidth,
            height: this[PLAYER].offsetHeight,
        };

        if (!offset.width || !offset.height) return;

        return _.find(objects, i => i.canInteract() && this.doIntersect(playerX, playerY, offset, i));
    }

    doIntersect(playerX, playerY, offset, item) {
        var itemOffset = {
            left: item.DOM.offsetLeft,
            top: item.DOM.offsetTop,
            width: item.DOM.offsetWidth,
            height: item.DOM.offsetHeight,
        };

        return skoash.util.doIntersect([
            {x: playerX, y: playerY},
            {x: playerX + offset.width, y: playerY},
            {x: playerX + offset.width, y: playerY + offset.height},
            {x: playerX, y: playerY + offset.height},
        ], [
            {x: itemOffset.left, y: itemOffset.top},
            {x: (itemOffset.left + itemOffset.width), y: itemOffset.top},
            {x: (itemOffset.left + itemOffset.width), y: (itemOffset.top + itemOffset.height)},
            {x: itemOffset.left, y: (itemOffset.top + itemOffset.height)},
        ]);
    }

    getPlayerStyle() {
        return {
            left: this.state.playerX,
            top: this.state.playerY,
        };
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        window.requestAnimationFrame(this.update);
    }

    getClassNames() {
        return classNames('labyrinth', super.getClassNames());
    }

    render() {
        return (
            <div {...this.props} className={this.getClassNames()}>
                <canvas
                    ref={CANVAS}
                    className={CANVAS}
                />
                <skoash.Image
                    ref={MAP}
                    className={MAP}
                    src={this.props.map}
                    crossOrigin="Anonymous"
                />
                <skoash.Image
                    ref={IMAGE}
                    className={IMAGE}
                    src={this.props.img}
                    crossOrigin="Anonymous"
                />
                {this.renderContentList('assets')}
                {this.renderContentList('items')}
                {this.renderContentList('enemies')}
                <div
                    ref={PLAYER}
                    className={PLAYER}
                    style={this.getPlayerStyle()}
                />
            </div>
        );
    }
}

Labyrinth.defaultProps = _.defaults({
    img: '',
    map: '',
    input: {},
    startX: 0,
    startY: 0,
    speed: 1,
    scale: 1,
    items: [],
    enemies: [],
    onCollide: _.noop,
    onCollideEnemy: function (enemy) {
        enemy.interact();
    },
    onCollideItem: function (item) {
        item.interact();
    },
}, Component.defaultProps);

export default Labyrinth;
