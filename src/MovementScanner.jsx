import { useEffect, useRef, useState } from 'react';
import { prepareScannerSound, playScannerSound } from './scannerSound.js';
import { scannerBounds } from './scannerBounds.js';

export default function MovementScanner({ onCode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [scanBounds, setScanBounds] = useState(null);
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const timerRef = useRef(null);

  const stopCamera = () => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    controlsRef.current?.stop();
    controlsRef.current = null;
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(track => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => () => stopCamera(), []);

  const close = () => {
    stopCamera();
    setOpen(false);
    setScanBounds(null);
  };


  const startCamera = async () => {
    prepareScannerSound();
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('A câmera não está disponível neste navegador.');
      return;
    }
    try {
      stopCamera();
      setOpen(true);
      setMessage('Aponte a câmera para o código SKU do produto.');
      await new Promise(resolve => requestAnimationFrame(resolve));
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 100, delayBetweenScanSuccess: 100 });
      let lastCode = '';
      let lastSeen = 0;
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        videoRef.current,
        result => {
          if (!result) return;
          setScanBounds(scannerBounds(result, videoRef.current));
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setScanBounds(null), 650);
          const now = Date.now();
          const repeated = result.getText() === lastCode && now - lastSeen < 1500;
          lastSeen = now;
          if (repeated) return;
          lastCode = result.getText();
          const code = result.getText().trim();
          const selected = onCode(code);
          void playScannerSound().then(played => {
            if (!played) setMessage(current => current + ' Não foi possível reproduzir o bip. Confira a permissão de som do navegador.');
          });
          setMessage(selected ? `${selected.name} selecionado pelo SKU ${code}.` : `Nenhum produto cadastrado com o SKU ${code}.`);
           setScanBounds(null);
        },
      );
    } catch {
      stopCamera();
      setMessage('Não foi possível acessar a câmera. Confira a permissão do navegador.');
    }
  };

  return <div className="movement-scanner">
    <div className="movement-scanner-actions">
      <span>Encontre o produto pelo código SKU</span>
      <button type="button" onClick={open ? close : startCamera}>{open ? 'Fechar câmera' : 'Ler SKU com a câmera'}</button>
    </div>
    {open && <div className="camera-preview movement-camera">
      <video ref={videoRef} muted playsInline className="cam" />
      <div className="camera-guide" aria-hidden="true"><span /></div>
      {scanBounds && <div className="scanner-box" style={{ left: `${scanBounds.left}%`, top: `${scanBounds.top}%`, width: `${scanBounds.width}%`, height: `${scanBounds.height}%` }} />}
    </div>}
    {message && <p role="status">{message}</p>}
  </div>;
}
