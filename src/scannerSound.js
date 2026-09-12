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
      bufferPromise = fetch(`${import.meta.env.BASE_URL}scanner-beep.mp3`)
        .then(response => {
          if (!response.ok) throw new Error('Áudio indisponível');
          return response.arrayBuffer();
        })
        .then(data => context.decodeAudioData(data))
        .catch(error => {
          console.warn('Usando bip alternativo:', error);
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
    } else {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 1800;
      gain.gain.setValueAtTime(0.15, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start();
      oscillator.stop(context.currentTime + 0.16);
    }
  } catch (error) {
    console.warn('Não foi possível reproduzir o bip:', error);
  }
}
