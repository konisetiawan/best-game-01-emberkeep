export const SOUND_NAMES = [
  'ensure', 'shoot', 'hit', 'explode', 'pickup', 'hurt', 'waveHorn',
  'victory', 'defeat', 'click', 'startMusic', 'stopMusic', 'toggleMuted'
];

export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;
  let musicTimer = null;
  let nextNoteTime = 0;
  let noteIndex = 0;
  const notes = [220, 261.63, 329.63, 392];

  function ensure() {
    if (!context) {
      const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextClass) return false;
      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.22;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume();
    return true;
  }

  function tone(frequency, duration, type = 'sine', gain = 0.18, delay = 0) {
    if (!context || !master) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(volume);
    volume.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function noise(duration = 0.12, gain = 0.12, delay = 0) {
    if (!context || !master) return;
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    const volume = context.createGain();
    const start = context.currentTime + delay;
    source.buffer = buffer;
    volume.gain.setValueAtTime(gain, start);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(volume);
    volume.connect(master);
    source.start(start);
  }

  function startMusic() {
    if (!context || musicTimer) return;
    nextNoteTime = context.currentTime + 0.05;
    const schedule = () => {
      if (!context) return;
      const horizon = context.currentTime + 0.35;
      while (nextNoteTime < horizon) {
        const frequency = notes[noteIndex % notes.length];
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, nextNoteTime);
        volume.gain.setValueAtTime(0.0001, nextNoteTime);
        volume.gain.exponentialRampToValueAtTime(0.055, nextNoteTime + 0.025);
        volume.gain.exponentialRampToValueAtTime(0.0001, nextNoteTime + 0.48);
        oscillator.connect(volume);
        volume.connect(master);
        oscillator.start(nextNoteTime);
        oscillator.stop(nextNoteTime + 0.5);
        noteIndex += 1;
        nextNoteTime += 0.58;
      }
    };
    schedule();
    musicTimer = globalThis.setInterval(schedule, 100);
  }

  function stopMusic() {
    if (musicTimer) globalThis.clearInterval(musicTimer);
    musicTimer = null;
  }

  function toggleMuted() {
    if (!context || !master) return muted;
    muted = !muted;
    master.gain.setTargetAtTime(muted ? 0 : 0.22, context.currentTime, 0.025);
    return muted;
  }

  return {
    ensure,
    shoot: () => tone(660, 0.07, 'square', 0.07),
    hit: () => { tone(180, 0.1, 'triangle', 0.14); noise(0.06, 0.05); },
    explode: () => { tone(95, 0.32, 'sawtooth', 0.19); noise(0.28, 0.16); },
    pickup: () => { tone(660, 0.1, 'sine', 0.12); tone(990, 0.14, 'sine', 0.12, 0.08); },
    hurt: () => { tone(130, 0.24, 'sawtooth', 0.2); noise(0.12, 0.1); },
    waveHorn: () => { tone(220, 0.38, 'triangle', 0.16); tone(293.66, 0.42, 'triangle', 0.16, 0.28); },
    victory: () => [0, 0.13, 0.26, 0.45].forEach((delay, i) => tone([261.63, 329.63, 392, 523.25][i], 0.35, 'triangle', 0.15, delay)),
    defeat: () => [0, 0.22, 0.44].forEach((delay, i) => tone([220, 196, 164.81][i], 0.4, 'triangle', 0.16, delay)),
    click: () => tone(520, 0.045, 'sine', 0.09),
    startMusic,
    stopMusic,
    toggleMuted
  };
}
