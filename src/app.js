import 'react-fastclick';

// components
import Component from 'components/component';
import Screen from 'components/screen';
import Game from 'components/game';
import Asset from 'components/asset';
import Image from 'components/image';
import Font from 'components/font';
import Media from 'components/media';
import Audio from 'components/audio';
import Video from 'components/video';
import MediaSequence from 'components/media_sequence';
import ListItem from 'components/list_item';

// new components
import DPad from 'components/d_pad';
import GameEmbedder from 'components/game_embedder';
import InteractiveItem from 'components/interactive_item';
import Labyrinth from 'components/labyrinth';
import Repeater from 'components/repeater';
import Reveal from 'components/reveal';
import Score from 'components/score';
import ScrollArea from 'components/scroll_area';
import Selectable from 'components/selectable';
import Slider from 'components/slider';
import SpriteAnimation from 'components/sprite_animation';
import Timer from 'components/timer';

//methods
import start from 'methods/start';
import trigger from 'methods/trigger';
import util from 'methods/util';

window.skoash = {
    // components
    Component,
    Screen,
    Game,
    Asset,
    Image,
    Font,
    Media,
    Audio,
    Video,
    MediaSequence,
    ListItem,
    // new components
    DPad,
    GameEmbedder,
    InteractiveItem,
    Labyrinth,
    Repeater,
    Reveal,
    Score,
    ScrollArea,
    Selectable,
    Slider,
    SpriteAnimation,
    Timer,
    //methods
    start,
    trigger,
    util,
};

export default window.skoash;
