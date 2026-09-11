import { useEffect, useRef, useState } from 'react';

export default function MovementScanner({ onCode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [scanBounds, setScanBounds] = useState(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
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

  const showDetectedArea = result => {
    const points = result.getResultPoints?.() || [];
    const video = videoRef.current;
    if (!video || points.length < 2 || !video.videoWidth || !video.videoHeight) {
      setScanBounds({ left: 15, top: 35, width: 70, height: 30 });
      return;
    }
    const xs = points.map(point => point.getX?.() ?? point.x);
    const ys = points.map(point => point.getY?.() ?? point.y);
    const left = Math.max(0, Math.min(...xs) / video.videoWidth * 100);
    const top = Math.max(0, Math.min(...ys) / video.videoHeight * 100);
    setScanBounds({
      left,
      top,
      width: Math.min(100 - left, Math.max(12, (Math.max(...xs) - Math.min(...xs)) / video.videoWidth * 100)),
      height: Math.min(100 - top, Math.max(12, (Math.max(...ys) - Math.min(...ys)) / video.videoHeight * 100)),
    });
  };

  const startCamera = async () => {
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
      const reader = new BrowserMultiFormatReader();
      let readingLocked = false;
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        videoRef.current,
        result => {
          if (!result || readingLocked) return;
          readingLocked = true;
          const code = result.getText().trim();
          const selected = onCode(code);
          showDetectedArea(result);
          audioRef.current?.play().catch(() => {});
          setMessage(selected ? `${selected.name} selecionado pelo SKU ${code}.` : `Nenhum produto cadastrado com o SKU ${code}.`);
          timerRef.current = setTimeout(() => {
            stopCamera();
            setScanBounds(null);
          }, 1700);
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
    <audio ref={audioRef} src="/scanner-beep.mp3" preload="auto" />
    {message && <p role="status">{message}</p>}
  </div>;
}
