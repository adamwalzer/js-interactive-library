import Component from 'components/component';
import Screen from 'components/screen';
import Game from 'components/game';
import Image from 'components/image';
import Audio from 'components/audio';
import Video from 'components/video';
import ListItem from 'components/list_item';

import start from 'methods/start';
import util from 'methods/util';

// Keeping window.play for now as to not break games.
// Once the games are fixed, I will remove this.
window.play = window.skoash = {
  Component,
  Screen,
  Game,
  Image,
  Audio,
  Video,
  ListItem,
  start,
  util,
};

export default window.play;
