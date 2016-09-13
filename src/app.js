import Component from 'components/component';
import Screen from 'components/screen';
import Game from 'components/game';
import Image from 'components/image';
import Audio from 'components/audio';
import Video from 'components/video';
import MediaSequence from 'components/media_sequence';
import ListItem from 'components/list_item';

import start from 'methods/start';
import trigger from 'methods/trigger';
import util from 'methods/util';

// Keeping window.play for now as to not break games.
// Once the games are fixed, I will remove this.
// TDOD - AW 2016-06-25
window.play = window.skoash = {
  Component,
  Screen,
  Game,
  Image,
  Audio,
  MediaSequence,
  Video,
  ListItem,
  start,
  trigger,
  util,
};

export default window.skoash;
