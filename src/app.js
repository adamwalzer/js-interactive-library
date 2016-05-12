import Component from 'components/component';
import Screen from 'components/screen';
import Game from 'components/game';
import Image from 'components/image';
import Audio from 'components/audio';

import start from 'methods/start';

import React from 'react';

window.React = React;

window.play = {
  Component,
  Screen,
  Game,
  Image,
  Audio,
  start,
  createElement: React.createElement,
};

export default window.play;
