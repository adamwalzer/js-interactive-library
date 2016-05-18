import Component from 'components/component';
import Screen from 'components/screen';
import Game from 'components/game';
import Image from 'components/image';
import Audio from 'components/audio';
import Video from 'components/video';
import ListItem from 'components/list_item';

import start from 'methods/start';

import React from 'react';
import ReactDOM from 'react-dom';

window.React = React;
window.ReactDOM = ReactDOM;

window.play = {
  Component,
  Screen,
  Game,
  Image,
  Audio,
  Video,
  ListItem,
  start,
};

export default window.play;
