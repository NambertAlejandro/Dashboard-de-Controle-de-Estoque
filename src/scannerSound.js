import originalSoundUrl from './assets/scanner-beep.mp3?url';

let context;
let bufferPromise;
let originalAudio;
let unlockPromise;

// Called directly by the camera button, before any asynchronous camera work.
export function prepareScannerSound() {
  if (!originalAudio) {
    originalAudio = new Audio(originalSoundUrl);
    originalAudio.preload = 'auto';
  }
  // Unlock the same original recording for browsers that cannot decode Web Audio.
  originalAudio.muted = true;
  const unlock = originalAudio.play();
  unlockPromise = unlock?.then(() => {
    originalAudio.pause();
    originalAudio.currentTime = 0;
    originalAudio.muted = false;
  }).catch(() => { originalAudio.muted = false; });
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!context || context.state === 'closed') {
      context = new AudioContext();
      bufferPromise = null;
    }
    void context.resume().catch(error => console.warn('Não foi possível habilitar o som:', error));
    if (!bufferPromise) {
      bufferPromise = fetch(originalSoundUrl)
        .then(response => {
          if (!response.ok) throw new Error('Áudio indisponível');
          return response.arrayBuffer();
        })
        .then(data => context.decodeAudioData(data))
        .catch(error => {
          bufferPromise = null;
          console.warn('Não foi possível carregar o áudio original:', error);
          return null;
        });
    }
  } catch (error) {
    console.warn('Não foi possível preparar o som:', error);
  }
}

export async function playScannerSound() {
  try {
    const buffer = await bufferPromise;
    if (buffer && context?.state === 'running') {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.onended = () => source.disconnect();
      source.start();
      return true;
    }
    if (!originalAudio) originalAudio = new Audio(originalSoundUrl);
    await unlockPromise;
    originalAudio.muted = false;
    originalAudio.currentTime = 0;
    await originalAudio.play();
    return true;
  } catch (error) {
    console.warn('Não foi possível reproduzir o bip:', error);
    return false;
  }
}
