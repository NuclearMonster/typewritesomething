import Vector from './utils/Vector';
import { Cursor } from './Cursor';
import { Character } from './Character';
import {
  container,
  cursorCtx,
  textCtx,
  textInput,
} from './helpers/getElements';
import debounce from './utils/debounce';
import positionElem from './utils/positionElem';

const FONT_SIZE = 26;
const TEXT_COLOR = '#150904';
const CURSOR_COLOR = '#4787ea';
const GLOBAL_ALPHA = 0.72;
const letterSize = parseInt(
  String(Math.min(FONT_SIZE, window.innerWidth / 17)),
  10
);

interface TypeWriterClass {
  canvasOffset: Vector;
  containerScale: number;
  chars: Character[];
  addCharacter(_chars: string): void;
  redraw(): void;
  resetCanvases(): void;
  reposition(vec?: Vector | UIEvent): void;
  debouncedReposition(this: unknown, vec?: Vector | UIEvent): void;
  reset(): void;
  emptyText(): void;
  focusText(): void;
  cursor: Cursor;
}

export class TypeWriter implements TypeWriterClass {
  static _instance: TypeWriterClass;

  canvasOffset = new Vector(0, 0);

  containerScale = 1;

  chars: Character[] = [];

  cursor = new Cursor();

  constructor() {
    if (TypeWriter._instance) {
      return TypeWriter._instance;
    }

    TypeWriter._instance = this;

    // add events
    window.addEventListener('resize', this.debouncedReposition);
  }

  addCharacter = (_chars: string): void => {
    for (let i = 0, len = _chars.length; i < len; i += 1) {
      const {
        position: { x, y },
      } = this.cursor;
      const char = _chars[i];

      this.chars.push(new Character(this, char, x, y));
      this.cursor.moveright();
    }
  };

  redraw = (): void => {
    this.chars.forEach((char) => char.draw());
  };

  resetCanvases = (): void => {
    [textCtx, cursorCtx].forEach((ctx) => {
      const { canvas } = ctx!;
      const { devicePixelRatio = 1, innerWidth, innerHeight } = window;

      ctx!.setTransform(1, 0, 0, 1, 0, 0);

      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;

      ctx!.scale(devicePixelRatio, devicePixelRatio);

      ctx!.globalAlpha = GLOBAL_ALPHA;
    });

    // reset contexts, because resizing wipes them
    textCtx!.font = `${letterSize}px Special Elite, serif`;
    textCtx!.textBaseline = 'top';
    textCtx!.fillStyle = TEXT_COLOR;

    cursorCtx.fillStyle = CURSOR_COLOR;
    cursorCtx.scale(this.containerScale, this.containerScale);
  };

  /**
   * offset characters for given x/y
   * useful for moving/dragging
   * useful for redrawing (b/c needs resetting)
   */
  reposition = (vec?: Vector | UIEvent): void => {
    if (vec instanceof Vector) {
      this.canvasOffset._add(vec);
    }

    positionElem(container, { x: 0, y: 0 });

    this.resetCanvases();
    this.redraw();
  };

  debouncedReposition = debounce(this.reposition, 100);

  /**
   * back to original blank canvas
   */
  reset = () => {
    this.chars = [];
    this.cursor.reset();
    this.canvasOffset = new Vector(0, 0);
    this.containerScale = 1;
    container.setAttribute('style', '');

    this.reposition();
    this.cursor.draw();
    this.emptyText();
    this.focusText();
  };

  emptyText = () => {
    textInput.innerHTML = '';
  };

  focusText = () => {
    textInput.focus();
  };
}
