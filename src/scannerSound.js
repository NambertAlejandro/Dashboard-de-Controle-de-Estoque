import originalSoundUrl from './assets/market-beep.wav';

let context;
let bufferPromise;
let originalAudio;

// Called directly by the camera button, before any asynchronous camera work.
export function prepareScannerSound() {
  if (!originalAudio) {
    originalAudio = new Audio(originalSoundUrl);
    originalAudio.preload = 'auto';
  }
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

export async function playScannerSound(direct = false) {
  try {
    if (direct) {
      if (!originalAudio) originalAudio = new Audio(originalSoundUrl);
      originalAudio.currentTime = 0;
      await originalAudio.play();
      return true;
    }
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
    originalAudio.muted = false;
    originalAudio.currentTime = 0;
    await originalAudio.play();
    return true;
  } catch (error) {
    console.warn('Não foi possível reproduzir o bip:', error);
    return false;
  }
}
