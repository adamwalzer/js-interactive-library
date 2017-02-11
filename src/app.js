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
import MediaCollection from 'components/media_collection';
import Randomizer from 'components/randomizer';
import Repeater from 'components/repeater';
import Reveal from 'components/reveal';
import Score from 'components/score';
import ScrollArea from 'components/scroll_area';
import Selectable from 'components/selectable';
import Slider from 'components/slider';
import Sprite from 'components/sprite';
import SpriteAnimation from 'components/sprite_animation';
import Timer from 'components/timer';

// new data components
import Data from 'components/data';
import JSON from 'components/json';


//methods
import start from 'methods/start';
import trigger from 'methods/trigger';
import util from 'methods/util';
import mixins from 'mixins/mixins';

window.$k = window.skoash = {
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
    MediaCollection,
    Randomizer,
    Repeater,
    Reveal,
    Score,
    ScrollArea,
    Selectable,
    Slider,
    Sprite,
    SpriteAnimation,
    Timer,
    // new data components
    Data,
    JSON,
    //methods
    start,
    trigger,
    util,
    mixins,
};

export default window.skoash;
