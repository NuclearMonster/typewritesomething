import MultiAudio from './utils/MultiAudio';
import NO_AUDIO from './helpers/NO_AUDIO';
import { TypeWriter } from './Typewriter';
import { container, textInput } from './helpers/getElements';
import positionElem from './utils/positionElem';
import getPositionFromEvent from './utils/getPositionFromEvent';

const keypressAudio = new MultiAudio('/static/audio/keypress.mp3', 5);
const newlineAudio = new MultiAudio('/static/audio/return.mp3', 2);

class App {
  mousemovedelay = 150;

  running = false;

  constructor() {
    this.typewriter = new TypeWriter();
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.typewriter.reset();
    this.events('on');
    this.typewriter.emptyText();
    this.typewriter.focusText();
    this.typewriter.cursor.draw();
  }

  stop() {
    if (!this.running) return;
    this.running = false;

    // kill events
    this.events('off');
    this.removeMoveEvent();
  }

  events = (onoff = 'on') => {
    const documentEvents = {
      mouseup: this.handleMouseUp,
      touchend: this.handleMouseUp,
      mousedown: this.handleMouseDown,
      touchstart: this.handleTouchStart,
    };
    const cursorEvents = {
      keydown: this.handleKeyDown,
      keyup: this.handleKeyUp,
      focus: this.focus,
      keypress: this.handleKeyPress,
    };

    let key;
    let fnc;
    const method = onoff === 'on' ? 'addEventListener' : 'removeEventListener';

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (key in documentEvents) {
      fnc = documentEvents[key];
      document[method](key, fnc);
    }

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (key in cursorEvents) {
      fnc = cursorEvents[key];
      textInput[method](key, fnc);
    }
  };

  /**
   * keydown handles audio
   * @param {KeyboardEvent} e
   */
  handleKeyDown = (e) => {
    const isMeta = e.altKey || e.ctrlKey || e.metaKey;
    const noAudio = NO_AUDIO[e.which] || isMeta;

    if (!noAudio) {
      if (e.key === 'Enter') {
        newlineAudio.play();
      } else {
        keypressAudio.play();
      }
      return true;
    }

    if (noAudio === 'TAB') {
      // refocus
      window.setTimeout(() => {
        textInput.focus();
      }, 10);
      e.preventDefault();
    }

    return false;
  };

  /**
   * HandleKeyPress
   * @param {KeyboardEvent} e
   */
  handleKeyPress = (e) => {
    const isMeta = e.altKey || e.ctrlKey || e.metaKey;
    const disable = e.key === 'Tab' || e.key === 'Enter';

    if (disable || isMeta) {
      e.preventDefault();
    }

    return !disable;
  };

  /**
   * keyup handles character input and navigation
   * @param {KeyboardEvent} e
   */
  handleKeyUp = (e) => {
    const { typewriter } = this;
    const { cursor } = typewriter;
    const isMeta = e.altKey || e.ctrlKey || e.metaKey;
    const value = e.key;
    const nav = cursor.navButtons[value];
    const ignoreKey = cursor.ignoreKeys[value];
    const letters = textInput.innerText;

    if (isMeta) {
      // ignore if user is refreshing or navigating or something
      typewriter.emptyText();

      return;
    }

    if (ignoreKey) {
      return;
    }

    if (nav) {
      nav();
    } else if (letters) {
      typewriter.addCharacter(letters);
    }

    typewriter.emptyText();
    typewriter.focusText();
  };

  focus = () => {
    this.typewriter.focusText();
  };

  /**
   * handleMouseDown
   * @param {MouseEvent} e
   */
  handleMouseDown = (e) => {
    // TODO: add menu somehow somewhere
    // ignore right click
    if (e.button === 2) return;

    // mousemove would be expensive, so we add it only after the mouse is down
    this.mouseuptimeout = window.setTimeout(() => {
      this.mouseDownStartPos = getPositionFromEvent(e);

      document.addEventListener('touchmove', this.handleMouseMove);
      document.addEventListener('mousemove', this.handleMouseMove);
    }, this.mousemovedelay);
  };

  /**
   * handleTouchStart
   * @param {TouchEvent} e
   */
  handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches && e.touches.length === 2) {
      // todo: work on zooming
      // (https://codepen.io/bozdoz/pen/xxEmJyx?editors=0011)
      return false;
    }
    return this.handleMouseDown(e);
  };

  /**
   * handleMouseMove
   * @param {MouseEvent} e
   */
  handleMouseMove = (e) => {
    const _position = getPositionFromEvent(e)._subtract(this.mouseDownStartPos);

    // fake canvas moving by cheaply altering css
    positionElem(container, _position);

    this.typewriter.cursor.clear();
  };

  /**
   * handleMouseUp
   * @param {MouseEvent} e
   */
  handleMouseUp = (e) => {
    this.removeMoveEvent();

    const position = getPositionFromEvent(e);

    if (this.mouseDownStartPos) {
      // reposition canvas if mouse moved
      position._subtract(this.mouseDownStartPos);

      this.typewriter.reposition(position);
      this.mouseDownStartPos = null;
    } else {
      // act as if it were just a click handler
      this.updateCursor(position);
    }
  };

  /**
   * Updates cursor to a given position
   * @param {Vector} position
   */
  updateCursor = (position) => {
    this.typewriter.cursor.moveToClick(position);
    this.typewriter.focusText();
  };

  removeMoveEvent = () => {
    window.clearTimeout(this.mouseuptimeout);
    document.removeEventListener('touchmove', this.handleMouseMove);
    document.removeEventListener('mousemove', this.handleMouseMove);
  };
}

export default App;
