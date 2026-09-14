import { useEffect, useRef, useState } from 'react';
import { prepareScannerSound, playScannerSound } from './scannerSound.js';
import { scannerBounds } from './scannerBounds.js';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

function extractData(value) {
  const quantity = value.match(/(?:quantidade|qtd|qtde)\s*[:=;-]?\s*(\d+(?:[.,]\d+)?)/i)?.[1];
  const sku = value.match(/(?:sku|c[oó]digo|produto)\s*[:=;-]?\s*([a-z0-9._/-]+)/i)?.[1];
  return { quantity: quantity?.replace(',', '.'), sku };
}

const numberValue = value => Number(String(value || '').replace(/\./g, '').replace(',', '.')) || 0;

function inferClassification(name) {
  const value = name.toLowerCase();
  if (/caixa|copo|sacola|embalagem|guardanapo|canudo/.test(value)) return { itemType: 'packaging', category: 'Embalagens' };
  if (/queijo|farinha|carne|molho|tomate|cebola|p[aã]o|massa|ingrediente/.test(value)) return { itemType: 'ingredient', category: 'Ingredientes' };
  if (/vinho|cerveja|refrigerante|[aá]gua|suco|bebida/.test(value)) return { itemType: 'resale', category: 'Bebidas' };
  return { itemType: 'resale', category: 'Importados do PDF' };
}

function parseProductLine(line) {
  const quantityMatch = line.match(/(?:quantidade|qtd|qtde)\s*[:=;-]?\s*(\d+(?:[.,]\d+)?)/i);
  if (!quantityMatch) return null;
  const skuMatch = line.match(/(?:^|\s)([A-Z0-9]{2,}(?:[-./][A-Z0-9]+)+)(?=\s|$)/i);
  const priceMatches = [...line.matchAll(/R\$\s*([\d.]+(?:,\d{1,2})?)/gi)];
  const unitMatch = line.match(new RegExp(`${quantityMatch[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(un|kg|g|l|ml|caixa|pacote|fardo|d[uú]zia)?`, 'i'));
  const start = skuMatch ? line.indexOf(skuMatch[1]) + skuMatch[1].length : 0;
  const end = quantityMatch.index;
  const name = line.slice(start, end).trim().replace(/^[-–—|:]+|[-–—|:]+$/g, '').trim();
  if (!name) return null;
  const quantityReceived = quantityMatch[1].replace(',', '.');
  const lotPrice = priceMatches.length ? numberValue(priceMatches.at(-1)[1]) : 0;
  const classification = inferClassification(name);
  return {
    name, sku: skuMatch?.[1] || '', quantityReceived,
    unit: unitMatch?.[1]?.toLowerCase() || 'un', lotPrice: String(lotPrice),
    unitPrice: String(lotPrice && Number(quantityReceived) ? Number((lotPrice / Number(quantityReceived)).toFixed(2)) : 0),
    minStock: '0', lostQuantity: '0', ...classification,
  };
}

function groupPdfLines(items) {
  const rows = [];
  for (const item of items) {
    if (!item.str?.trim()) continue;
    const y = Math.round(item.transform?.[5] || 0);
    let row = rows.find(candidate => Math.abs(candidate.y - y) <= 2);
    if (!row) { row = { y, cells: [] }; rows.push(row); }
    row.cells.push({ x: item.transform?.[4] || 0, text: item.str.trim() });
  }
  return rows.sort((a, b) => b.y - a.y).map(row => row.cells.sort((a, b) => a.x - b.x).map(cell => cell.text).join(' '));
}

export default function StockCapture({ onQuantity, onSku, onImportData, onImportMany }) {
  const [mode, setMode] = useState('manual');
  const [message, setMessage] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [scanBounds, setScanBounds] = useState(null);
  const [detectedCode, setDetectedCode] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scannerControlsRef = useRef(null);
  const scanTimerRef = useRef(null);

  const stopCamera = () => {
    clearTimeout(scanTimerRef.current);
    scanTimerRef.current = null;
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => () => stopCamera(), []);

  const selectMode = nextMode => {
    stopCamera();
    setMode(nextMode);
    setMessage('');
    setCandidates([]);
    setSelected([]);
    setScanBounds(null);
    setDetectedCode('');
  };


  const startCamera = async () => {
    prepareScannerSound();
    if (!navigator.mediaDevices?.getUserMedia) return setMessage('A câmera não está disponível neste navegador.');
    try {
      stopCamera();
      setMessage('Aponte a câmera para um código de barras ou QR.');
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 100, delayBetweenScanSuccess: 100 });
      let lastCode = '';
      let lastSeen = 0;
      scannerControlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        videoRef.current,
        result => {
          if (!result) return;
          setScanBounds(scannerBounds(result, videoRef.current));
          clearTimeout(scanTimerRef.current);
          scanTimerRef.current = setTimeout(() => setScanBounds(null), 650);
          const now = Date.now();
          const repeated = result.getText() === lastCode && now - lastSeen < 1500;
          lastSeen = now;
          if (repeated) return;
          lastCode = result.getText();
          const raw = result.getText();
          const parsed = extractData(raw);
          onSku(parsed.sku || raw);
          if (parsed.quantity) onQuantity(parsed.quantity);
          setDetectedCode(parsed.sku || raw);
          void playScannerSound().then(played => {
            if (!played) setMessage(current => current + ' Não foi possível reproduzir o bip. Confira a permissão de som do navegador.');
          });
          setMessage(parsed.quantity ? `Código e quantidade ${parsed.quantity} identificados.` : `Código ${parsed.sku || raw} identificado e aplicado ao SKU.`);
           readingLocked = false;
        },
      );
      streamRef.current = videoRef.current?.srcObject;
    } catch {
      stopCamera();
      setMessage('Não foi possível acessar a câmera. Confira a permissão do navegador.');
    }
  };

  const readPdf = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage('Lendo o PDF...');
    setCandidates([]);
    setSelected([]);
    try {
      const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      let text = '';
      const lines = [];
      for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 20); pageNumber++) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        text += ` ${content.items.map(item => item.str).join(' ')}`;
        lines.push(...groupPdfLines(content.items));
      }
      let products = lines.map(parseProductLine).filter(Boolean);
      if (!products.length) {
        const parsed = parseProductLine(text);
        if (parsed) products = [parsed];
      }
      products = products.filter((product, index, list) => list.findIndex(other => `${other.sku}|${other.name}|${other.quantityReceived}` === `${product.sku}|${product.name}|${product.quantityReceived}`) === index).slice(0, 20);
      setCandidates(products);
      setSelected([]);
      if (products.length === 1) {
        onImportData(products[0]);
        setMessage(`Dados de ${products[0].name} preenchidos automaticamente. Confira antes de cadastrar.`);
      } else if (products.length > 1) {
        onImportData(products[0]);
        setMessage(`${products.length} produtos encontrados. O primeiro foi preenchido; escolha outro item abaixo se necessário.`);
      } else {
        setMessage('Não foi possível identificar produtos e quantidades. Use um PDF com texto selecionável ou preencha manualmente.');
      }
    } catch {
      setMessage('Não foi possível ler este PDF. Use um arquivo com texto selecionável ou informe a quantidade manualmente.');
    }
  };

  return <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
    <p className="text-xs font-semibold text-slate-600 mb-2">Como deseja acrescentar a quantidade?</p>
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Forma de informar a quantidade">
      {[['manual', 'Digitar'], ['camera', 'Câmera'], ['pdf', 'PDF']].map(([value, label]) => <button key={value} type="button" onClick={() => selectMode(value)} className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${mode === value ? 'border-green-500 bg-white text-green-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>{label}</button>)}
    </div>
    {mode === 'manual' && <p className="mt-2 text-xs text-slate-500">Preencha a quantidade recebida no campo abaixo.</p>}
    {mode === 'camera' && <div className="mt-3 space-y-2">
      <div className="camera-preview">
        <video ref={videoRef} muted playsInline className="cam" />
        <div className="camera-guide" aria-hidden="true"><span /></div>
        {scanBounds && <div className="scanner-box" style={{ left: `${scanBounds.left}%`, top: `${scanBounds.top}%`, width: `${scanBounds.width}%`, height: `${scanBounds.height}%` }} />}
        {detectedCode && scanBounds && <div className="scan-result">Código identificado: <strong>{detectedCode}</strong></div>}
      </div>
      <button type="button" onClick={startCamera} className="camera-start w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-900">Abrir câmera e ler código</button>
      <p className="text-xs text-slate-500">Use preferencialmente a câmera traseira. Compatível com EAN, UPC, Code 39, Code 128, ITF e QR Code.</p>
    </div>}
    {mode === 'pdf' && <div className="mt-3"><label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-green-300 bg-white px-4 py-4 text-center text-xs font-medium text-green-700 hover:bg-green-50"><input type="file" accept="application/pdf,.pdf" onChange={readPdf} className="sr-only" />Selecionar nota ou relatório em PDF</label></div>}
    {message && <p role="status" className="mt-2 text-xs text-slate-600">{message}</p>}
    {candidates.length > 1 && <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" className="accent-green-600" checked={selected.length === candidates.length} onChange={event => setSelected(event.target.checked ? candidates.map((_, index) => index) : [])} />Selecionar todos</label>
        <span className="text-xs text-slate-500">{selected.length} de {candidates.length} selecionados</span>
      </div>
      {candidates.map((product, index) => <div key={`${product.sku}-${product.name}-${index}`} className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2 ${selected.includes(index) ? 'border-green-400 ring-1 ring-green-100' : 'border-green-200'}`}>
        <input type="checkbox" aria-label={`Selecionar ${product.name}`} className="accent-green-600" checked={selected.includes(index)} onChange={() => setSelected(current => current.includes(index) ? current.filter(value => value !== index) : [...current, index])} />
        <div className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-700">{product.name}</span><span className="mt-0.5 block text-xs text-slate-500">{product.sku || 'Sem SKU'} · {product.quantityReceived} {product.unit} · lote R$ {Number(product.lotPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
        <button type="button" onClick={() => { onImportData(product); setMessage(`Dados de ${product.name} preenchidos automaticamente. Confira antes de cadastrar.`); }} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Preencher</button>
      </div>)}
      <button type="button" disabled={!selected.length} onClick={async () => { const resultado = await onImportMany(selected.map(index => candidates[index])); if (resultado !== true) setMessage(resultado); }} className="w-full rounded-lg bg-green-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">Importar selecionados ({selected.length})</button>
    </div>}
  </div>;
}
