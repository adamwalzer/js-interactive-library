import _ from 'lodash';
import classNames from 'classnames';

import Component from 'components/component';
import Screen from 'components/screen';

class Game extends Component {
  constructor(config) {
    super();

    this.config = config;

    this.screens = {
      0: Screen
    };

    this.menus = {
      Screen
    };

    this.state = {
      currentScreenIndex: 0,
      highestScreenIndex: 0,
      playingSFX: [],
      playingVO: [],
      playingBKG: [],
      playingVideo: null,
      openMenus: [],
      loading: true,
    };

    play.trigger = this.trigger.bind(this);

    window.addEventListener('load', window.focus);
    window.addEventListener('focus', function () {
      this.resume();
    }.bind(this));
    window.addEventListener('blur', function () {
      this.pause();
    }.bind(this));
    window.addEventListener('resize', function () {
      this.scale();
    }.bind(this));
    window.addEventListener('keydown', function (e) {
      this.onKeyUp(e);
    }.bind(this));
  }

  getState() {
    return this.state;
  }

  demo() {
    var demo = !this.state.demo;
    this.setState({
      demo
    });
  }

  onKeyUp(e) {
    if (e.keyCode === 39) { // right
      this.goto({index: this.state.currentScreenIndex + 1});
    } else if (e.keyCode === 37) { // left
      this.goto({index: this.state.currentScreenIndex - 1});
    } else if (e.altKey && e.ctrlKey && e.keyCode === 68) { // alt + ctrl + d
      this.demo();
    }
  }

  componentWillMount() {
    this.emit({
      name: 'init',
      game: this.config.id,
    });
    this.detechDevice();
    this.scale();
  }

  bootstrap() {
    var self = this;

    if (!this.state.iOS) {
      this.state.currentScreenIndex = 1;
    }

    this.requireForReady = Object.keys(this.refs);
    this.requireForComplete = this.requireForReady.filter(key => {
      return !self.refs[key].state || !self.refs[key].state.complete;
    });

    this.collectMedia();
    this.loadScreens();
  }

  loadScreens() {
    var firstScreen, secondScreen, self = this;

    firstScreen = this.refs['screen-' + this.state.currentScreenIndex];
    secondScreen = this.refs['screen-' + this.state.currentScreenIndex + 1];

    if (firstScreen) firstScreen.load();
    if (secondScreen) secondScreen.load();

    setTimeout(() => {
      self.checkReady();
    }, 0);
  }

  ready() {
    this.emit({
      name: 'ready',
      game: this.config.id,
    });
    this.setState({
      ready: true,
    });
    this.goto({
      index: this.state.currentScreenIndex,
      silent: true,
    });
  }

  resume() {
    this.setPause(false);
  }

  pause() {
    this.setPause(true);
  }

  setPause(pause) {
    var fn = pause ? 'pause' : 'resume';

    this.setState({
      paused: pause
    });

    this.state.playingSFX.map(audio => {
      audio[fn]();
    });

    this.state.playingVO.map(audio => {
      audio[fn]();
    });

    this.state.playingBKG.map(audio => {
      audio[fn]();
    });
  }

  /**
   * Detects the device and adds the appropriate state classes.
   */
  detechDevice() {
    this.setState({
      iOS: this.iOS(),
      mobile: this.mobileOrTablet(),
    });
  }
   /**
    * this code came from http://stackoverflow.com/questions/9038625/detect-if-device-is-ios
    */
  iOS() {
    var iDevices = [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ];

    if (navigator.platform) {
      while (iDevices.length) {
        if (navigator.platform === iDevices.pop()){
          return true;
        }
      }
    }

    return false;
  }

  /**
   * this code came from http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
   */
  mobileOrTablet() {
    var check = false;
    /* eslint-disable */
    (function (a){ if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))check = true;})(navigator.userAgent || navigator.vendor || window.opera);
    /* eslint-enable */
    return check;
  }

  goto(opts) {
    var oldScreen, oldIndex, currentScreenIndex, newScreen, nextScreen, highestScreenIndex;

    oldIndex = this.state.currentScreenIndex;
    oldScreen = this.refs['screen-' + oldIndex];
    currentScreenIndex = Math.min(this.screensLength - 1, Math.max(0, opts.index));
    newScreen = this.refs['screen-' + currentScreenIndex];
    nextScreen = this.refs['screen-' + (currentScreenIndex + 1)];
    highestScreenIndex = Math.max(this.state.highestScreenIndex, currentScreenIndex);

    if (oldScreen.props.index < newScreen.props.index) {
      if (!this.state.demo && !oldScreen.state.complete) {
        return;
      }
    }

    if (oldScreen.props.index > newScreen.props.index) {
      if (newScreen.props.index === 0) {
        return;
      }
    }

    if (newScreen) {
      // this should never be dropped into
      if (!newScreen.state.load || !newScreen.state.ready) {
        this.loadScreens();
      }
      newScreen.open();
    }

    if (oldScreen && oldScreen !== newScreen) {
      if (oldScreen.props.index > newScreen.props.index) {
        oldScreen.close();
      } else {
        oldScreen.leave();
      }
    }

    if (nextScreen) {
      nextScreen.load();
    }

    this.setState({
      loading: false,
      currentScreenIndex,
      highestScreenIndex,
    });

    this.emit({
      name: 'save',
      game: this.config.id,
      screenIndex: highestScreenIndex,
    });

    if (!opts.silent && this.audio.button) {
      this.audio.button.play();
    }

    this.playBackground();
  }

  openMenu(opts) {
    var menu, openMenus;

    menu = this.refs['menu-' + opts.id];

    if (menu) {
      menu.open();
      openMenus = this.state.openMenus || [];
      openMenus.push(opts.id);
      this.setState({
        openMenus,
      });
    }
  }

  menuClose(opts) {
    var openMenus;

    openMenus = this.state.openMenus || [];
    openMenus.splice(opts.id, 1);
    this.setState({
      openMenus,
    });
  }

  getBackgroundIndex() {
    return 0;
  }

  playBackground() {
    var index, playingBKG, self = this;

    index = this.getBackgroundIndex();
    playingBKG = this.state.playingBKG;

    if (playingBKG[0] === this.audio.background[index]) {
      return;
    }

    if (playingBKG[0]) {
      playingBKG[0].stop();
      playingBKG.shift();
    }

    if (this.audio.background[index]) {
      setTimeout(() => {
        self.audio.background[index].play();
        playingBKG.push(self.audio.background[index]);
        self.setState({
          playingBKG,
        });
      }, 500);
    }
  }

  scale() {
    this.setState({
      scale: window.innerWidth / this.config.dimensions.width,
    });
  }

  trigger(event, opts) {
    var events, fn;

    events = {
      goto: this.goto,
      audioPlay: this.audioPlay,
      audioStop: this.audioStop,
      videoPlay: this.videoPlay,
      videoStop: this.videoStop,
      demo: this.demo,
      screenComplete: this.screenComplete,
      menuClose: this.menuClose,
      getState: this.getState,
      emit: this.emit,
      quit: this.quit,
    };

    fn = events[event];
    if (typeof fn === 'function') {
      return this[event](opts);
    }
  }

  emit(data) {
    return new Promise((resolve) => {
      var event;

      if (typeof data !== 'object') return;

      if (!data.game) {
        data.game = this.config.id;
      }

      event = new Event('game-event', {bubbles: true, cancelable: false});

      event.name = data.name;
      event.gameData = data;
      event.respond = gameData => {
        resolve(gameData);
      };

      if (window.frameElement) {
        window.frameElement.dispatchEvent(event);
      }
    });
  }

  quit() {
    this.emit({
      name: 'quit',
      game: this.config.id,
    });
  }

  audioPlay(opts) {
    var playingSFX, playingVO, playingBKG;

    playingSFX = this.state.playingSFX || [];
    playingVO = this.state.playingVO || [];
    playingBKG = this.state.playingBKG || [];

    switch (opts.audio.props.type) {
    case 'sfx':
      playingSFX.push(opts.audio);
      break;
    case 'voiceOver':
      playingVO.push(opts.audio);
      this.fadeBackground();
      break;
    case 'background':
      playingBKG.push(opts.audio);
      break;
    }

    this.setState({
      playingSFX,
      playingVO,
      playingBKG,
    });
  }

  audioStop(opts) {
    var playingSFX, playingVO, playingBKG;

    playingSFX = this.state.playingSFX || [];
    playingVO = this.state.playingVO || [];
    playingBKG = this.state.playingBKG || [];

    switch (opts.audio.props.type) {
    case 'sfx':
      playingSFX.splice(opts.audio, 1);
      break;
    case 'voiceOver':
      playingVO.splice(opts.audio, 1);
      this.raiseBackground();
      break;
    case 'background':
      playingBKG.splice(opts.audio, 1);
      break;
    }

    this.setState({
      playingSFX,
      playingVO,
      playingBKG,
    });
  }

  videoPlay(opts) {
    var playingVideo = this.state.playingVideo;

    if (playingVideo) {
      playingVideo.stop();
    }

    playingVideo = opts.video;

    this.fadeBackground(0);

    this.setState({
      playingVideo,
    });
  }

  videoStop() {
    this.raiseBackground(1);

    this.setState({
      playingVideo: null,
    });
  }

  fadeBackground(value) {
    if (typeof value === 'undefined') value = .25;
    this.state.playingBKG.map((bkg) => {
      bkg.setVolume(value);
    });
  }

  raiseBackground(value) {
    if (typeof value === 'undefined') value = 1;
    if (this.state.playingVO.length === 0) {
      this.state.playingBKG.map((bkg) => {
        bkg.setVolume(value);
      });
    }
  }

  screenComplete() {
    if (this.audio['screen-complete']) {
      this.audio['screen-complete'].play();
    }
  }

  getClassNames() {
    return classNames({
      iOS: this.state.iOS,
      MOBILE: this.state.mobile,
      SFX: this.state.playingSFX.length,
      'VOICE-OVER': this.state.playingVO.length,
      PAUSED: this.state.paused,
      LOADING: this.state.loading,
      MENU: this.state.openMenus.length,
      DEMO: this.state.demo,
    });
  }

  getStyles() {
    var transformOrigin = '50% 0px 0px';

    if (this.state.scale < 1) {
      transformOrigin = '0px 0px 0px';
    }

    return {
      transform: 'scale3d(' + this.state.scale + ',' + this.state.scale + ',1)',
      transformOrigin,
    };
  }

  renderLoader() {
    return null;
  }

  renderAssets() {
    return null;
  }

  renderMenu() {
    return (
      <div className="menu">
        <button className="close" onClick={this.openMenu.bind(this, {id: 'quit'})}></button>
      </div>
    );
  }

  renderScreens() {
    var screenKeys = Object.keys(this.screens);
    this.screensLength = screenKeys.length;
    return screenKeys.map((key, index) => {
      var Screen = this.screens[key]; // eslint-disable-line no-shadow
      return (
        <Screen key={key} index={index} ref={'screen-' + key} />
      );
    });
  }

  renderMenuScreens() {
    return _.map(this.menus, (index, key) => {
      var Menu = this.menus[key];
      return (
        <Menu key={key} index={index} ref={'menu-' + key} />
      );
    });
  }

  render() {
    return (
      <div className={'pl-game ' + this.getClassNames()} style={this.getStyles()}>
        {this.renderLoader()}
        {this.renderAssets()}
        {this.renderMenu()}
        {this.renderScreens()}
        {this.renderMenuScreens()}
      </div>
    );
  }
}

export default Game;
