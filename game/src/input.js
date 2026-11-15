export const ACTION = Object.freeze({
  CONFIRM: 'Enter',
  PAUSE: 'KeyP',
  RESTART: 'KeyR',
  DASH: 'ShiftLeft',
  SHOOT: 'Space'
});

const FIELD_WIDTH = 1280;
const FIELD_HEIGHT = 720;
const PREVENT_SCROLL = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function createInput(canvas) {
  const down = new Set();
  const pressed = new Set();
  let mouseX = FIELD_WIDTH / 2;
  let mouseY = FIELD_HEIGHT / 2;
  let mouseDown = false;

  const onKeyDown = (event) => {
    if (PREVENT_SCROLL.has(event.code)) event.preventDefault();
    if (!down.has(event.code)) pressed.add(event.code);
    down.add(event.code);
  };
  const onKeyUp = (event) => down.delete(event.code);
  const updateMouse = (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width) * FIELD_WIDTH;
    mouseY = ((event.clientY - rect.top) / rect.height) * FIELD_HEIGHT;
  };
  const onMouseMove = (event) => updateMouse(event);
  const onMouseDown = (event) => {
    updateMouse(event);
    if (event.button === 0) mouseDown = true;
  };
  const onMouseUp = (event) => {
    updateMouse(event);
    if (event.button === 0) mouseDown = false;
  };
  const onBlur = () => { down.clear(); mouseDown = false; };

  globalThis.addEventListener('keydown', onKeyDown);
  globalThis.addEventListener('keyup', onKeyUp);
  globalThis.addEventListener('blur', onBlur);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  globalThis.addEventListener('mouseup', onMouseUp);

  return {
    get mouseX() { return mouseX; },
    get mouseY() { return mouseY; },
    get mouseDown() { return mouseDown; },
    isDown: (code) => down.has(code),
    wasPressed: (code) => pressed.has(code),
    update: () => pressed.clear(),
    destroy: () => {
      globalThis.removeEventListener('keydown', onKeyDown);
      globalThis.removeEventListener('keyup', onKeyUp);
      globalThis.removeEventListener('blur', onBlur);
      globalThis.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
    }
  };
}
