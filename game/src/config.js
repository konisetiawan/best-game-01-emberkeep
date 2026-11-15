export const FIELD = Object.freeze({ width: 1280, height: 720 });
export const STEP = 1 / 60;

export const PLAYER = Object.freeze({ speed: 300, radius: 16, hearts: 3 });
export const HEARTH = Object.freeze({
  maxHp: 100,
  x: FIELD.width / 2,
  y: FIELD.height / 2,
});

export const ENEMIES = Object.freeze({
  cinder: Object.freeze({ speed: 70, hp: 1, points: 10 }),
  emberbat: Object.freeze({ speed: 150, hp: 1, points: 20 }),
  brute: Object.freeze({ speed: 45, hp: 6, points: 50 }),
  boss: Object.freeze({ name: 'Cinderlord', hp: 120, speed: 42, points: 250 }),
});

export const WAVES = 10;
export const BULLET = Object.freeze({ speed: 620, damage: 1 });
export const DASH_COOLDOWN = 2.5;
export const COMBO_WINDOW = 3;
export const PALETTE = Object.freeze({
  background: '#0d1026',
  ember: '#ff9a3c',
  gold: '#ffd166',
  teal: '#4ecdc4',
});
export const FONT = 'system-ui';
export const BEST_KEY = 'emberkeep.best';
