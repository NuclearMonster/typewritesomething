import { Character } from './Character';

jest.mock('./helpers/getElements');

jest.useFakeTimers();

describe('Character', () => {
  const mockTypewriter = {
    canvasOffset: {
      x: 0,
      y: 0,
    },
  };

  it('has a position, but is not exact', () => {
    const x = 100;
    const y = 100;
    const char = new Character(mockTypewriter, 'A', x, y);

    expect(char.x).not.toBe(x);
    expect(char.y).not.toBe(y);

    expect(char.x).toBeCloseTo(x, 0);
    expect(char.y).toBeCloseTo(y, 0);
  });
});
