import originalSoundUrl from './assets/scanner-beep.mp3?url';

let context;
let bufferPromise;

// Called directly by the camera button, before any asynchronous camera work.
export function prepareScannerSound() {
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
    if (!context) return;
    const buffer = await bufferPromise;
    if (context.state !== 'running') await context.resume();
    if (buffer) {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.onended = () => source.disconnect();
      source.start();
    }
  } catch (error) {
    console.warn('Não foi possível reproduzir o bip:', error);
  }
}
