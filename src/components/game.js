import React from 'react';

import Component from 'components/component';
import Screen from 'components/screen';

class Game extends Component {
  constructor(config) {
    super();

    this.config = config;

    this.screens = [
      Screen
    ];

    this.state = {
      currentScreenIndex: 0,
      playingSFX: [],
      playingVO: [],
      playingBKG: [],
      loading: true,
    };

    play.trigger = this.trigger.bind(this);
    play.getState = this.getState.bind(this);

    window.addEventListener('load', window.focus);
    window.addEventListener('focus', function() {
      this.resume();
    }.bind(this));
    window.addEventListener('blur', function() {
      this.pause();
    }.bind(this));
    window.addEventListener('resize', function() {
      this.scale();
    }.bind(this));
    window.addEventListener('keydown', function(e) {
      this.onKeyUp(e);
    }.bind(this));
  }

  getState() {
    return new Object(this.state);
  }

  demo() {
    var demo = !this.state.demo;
    this.setState({
      demo
    });
  }

  onKeyUp(e) {
    if (e.keyCode === 39) { // right
      this.goto({index:this.state.currentScreenIndex+1});
    } else if (e.keyCode === 37) { // left
      this.goto({index:this.state.currentScreenIndex-1});
    } else if (e.altKey && e.ctrlKey && e.keyCode === 68) { // alt + ctrl + d
      this.demo()
    }
  }

  componentWillMount() {
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

    firstScreen = this.refs['screen-'+this.state.currentScreenIndex];
    secondScreen = this.refs['screen-'+this.state.currentScreenIndex+1];

    if (firstScreen) firstScreen.load();
    if (secondScreen) secondScreen.load();

    setTimeout(() => {
      self.checkReady();
    }, 0);
  }

  ready() {
    this.setState({
      ready: true,
    });
    this.goto({
      index: this.state.currentScreenIndex,
    })
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
      audio[fn](pause);
    });

    this.state.playingVO.map(audio => {
      audio[fn](pause);
    });

    this.state.playingBKG.map(audio => {
      audio[fn](pause);
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

  iOS() {
    var iDevices = [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ];

    if (!!navigator.platform) {
      while (iDevices.length) {
        if (navigator.platform === iDevices.pop()){ return true; }
      }
    }

    return false;
  }

  mobileOrTablet() {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  }

  goto(opts) {
    var oldScreen, oldIndex, currentScreenIndex, newScreen, nextScreen;

    oldIndex = this.state.currentScreenIndex;
    oldScreen = this.refs['screen-'+oldIndex];
    currentScreenIndex = Math.min(this.screens.length-1,Math.max(0,opts.index));
    newScreen = this.refs['screen-'+currentScreenIndex]
    nextScreen = this.refs['screen-'+(currentScreenIndex+1)];

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
    });

    this.playBackground();
  }

  getBackgroundIndex() {
    return 0;
  }

  playBackground() {
    var index, self = this;

    index = this.getBackgroundIndex();

    if (this.state.playingBKG[0] === this.audio.background[index]) {
      if (this.state.playingBKG[0].audio.playState === 'playSucceeded') {
        return;
      }
    }

    if (self.state.playingBKG[0]) {
      self.state.playingBKG[0].stop();
    }

    if (this.audio.background[index]) {
      setTimeout(() => {
        self.audio.background[index].play();
      }, 500);
    }
  }

  scale() {
    this.setState({
      scale: window.innerWidth / this.config.dimensions.width,
    });
  }

  trigger(event,opts) {
    var events, fn;

    events = {
      goto: 'goto',
      audioPlay: 'audioPlay',
      audioStop: 'audioStop',
      demo: 'demo',
    }

    fn = this[events[event]];
    if (typeof fn === 'function') {
      this[event](opts);
    }
  }

  audioPlay(opts) {
    var playingSFX, playingVO, playingBKG;

    playingSFX = this.state.playingSFX || [];
    playingVO = this.state.playingVO || [];
    playingBKG = this.state.playingBKG || [];

    switch(opts.audio.props.type) {
      case 'sfx':
        playingSFX.push(opts.audio);
        break;
      case 'voiceOver':
        playingVO.push(opts.audio);
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

    switch(opts.audio.props.type) {
      case 'sfx':
        playingSFX.splice(opts.audio,1);
        break;
      case 'voiceOver':
        playingVO.splice(opts.audio,1);
        break;
      case 'background':
        playingBKG.splice(opts.audio,1);
        break;
    }

    this.setState({
      playingSFX,
      playingVO,
      playingBKG,
    });
  }

  getClassNames() {
    var classNames = '';

    if (this.state.iOS) classNames += ' iOS';
    if (this.state.mobile) classNames += ' MOBILE';
    if (this.state.playingSFX.length) classNames += ' SFX';
    if (this.state.playingVO.length) classNames += ' VOICE-OVER';
    if (this.state.paused) classNames += ' PAUSED';
    if (this.state.loading) classNames += ' LOADING';
    if (this.state.demo) classNames += ' DEMO';

    return classNames;
  }

  getStyles() {
    var transformOrigin = '50% 0px 0px';

    if (this.state.scale < 1) {
      transformOrigin = '0px 0px 0px';
    }

    return {
      transform: 'scale3d('+this.state.scale+','+this.state.scale+',1)',
      transformOrigin,
    }
  }

  renderLoader() {
    return null;
  }

  renderAssets() {
    return null;
  }

  renderScreens() {
    return this.screens.map((Screen, key) => {
      return (
        <Screen key={key} index={key} ref={'screen-'+key} />
      );
    });
  }

  render() {
    return (
      <div className={"pl-game"+this.getClassNames()} style={this.getStyles()}>
        {this.renderLoader()}
        {this.renderAssets()}
        {this.renderScreens()}
      </div>
    )
  }
}

export default Game;
