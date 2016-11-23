import 'react-fastclick';

import Component from 'components/component';
import Screen from 'components/screen';
import Game from 'components/game';
import Image from 'components/image';
import Font from 'components/font';
import Audio from 'components/audio';
import Video from 'components/video';
import MediaSequence from 'components/media_sequence';
import ListItem from 'components/list_item';

import start from 'methods/start';
import trigger from 'methods/trigger';
import util from 'methods/util';

window.skoash = {
    Component,
    Screen,
    Game,
    Image,
    Font,
    Audio,
    MediaSequence,
    Video,
    ListItem,
    start,
    trigger,
    util,
};

export default window.skoash;
