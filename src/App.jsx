import { carregarEstoque, salvarProduto, request, trocarSenha } from './api.js';
import { useState, useEffect, useRef } from 'react';
import ItemForm from './ItemForm.jsx';
import HistoryScreen from './HistoryScreen.jsx';
import MovementScanner from './MovementScanner.jsx';
import { ITEM_TYPES, isStockItem, statusFor, hoje } from './inventory.js';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
const itemLabel = type => ITEM_TYPES.find(t => t.id === type)?.label || 'Revenda';
const PIE_COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9'];
// ─── Icons ────────────────────────────────────────────────────────────────────
const IconBox = ({ active }) => (<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={active ? '#16a34a' : '#64748b'} strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
  </svg>);
const IconArrows = ({ active }) => (<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={active ? '#16a34a' : '#64748b'} strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
  </svg>);
const IconBell = ({ active }) => (<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={active ? '#16a34a' : '#64748b'} strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
  </svg>);
const IconChart = ({ active }) => (<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={active ? '#16a34a' : '#64748b'} strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
  </svg>);
const IconHistory = ({ active }) => (<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={active ? '#16a34a' : '#64748b'} strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.8 2.8L3 8m0-5v5h5M12 7v5l3 2"/>
  </svg>);
const IconEdit = () => (<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>);
const IconEye = () => (<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/>
    <circle cx="12" cy="12" r="2.5"/>
  </svg>);
const IconTrash = () => (<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>);
const IconSearch = () => (<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
  </svg>);
const IconPlus = () => (<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>);
const IconWarning = () => (<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
  </svg>);
// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const styles = {
        Normal: 'bg-green-50 text-green-700 border border-green-200',
        Baixo: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        Crítico: 'bg-red-50 text-red-600 border border-red-200',
    };
    return (<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>);
};
// ─── Modal Base ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
    const overlayRef = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape')
            onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);
    return (<div role="dialog" aria-modal="true" aria-label={title} ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)' }} onMouseDown={e => { if (e.target === overlayRef.current)
        onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button aria-label="Fechar formulário" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>);
}

function TrocarSenhaModal({ onClose }) {
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmacao, setConfirmacao] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [salvando, setSalvando] = useState(false);
    const enviar = async event => {
        event.preventDefault();
        setMensagem('');
        if (novaSenha !== confirmacao) return setMensagem('As novas senhas precisam ser iguais.');
        setSalvando(true);
        try {
            const resultado = await trocarSenha(senhaAtual, novaSenha);
            setMensagem(resultado.mensagem);
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmacao('');
        } catch (erro) {
            setMensagem(erro.message);
        } finally {
            setSalvando(false);
        }
    };
    return <Modal title="Trocar senha" onClose={onClose}>
      <form className="password-form" onSubmit={enviar}>
        <label htmlFor="senha-atual">Senha atual</label>
        <input id="senha-atual" type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} autoComplete="current-password" required autoFocus />
        <label htmlFor="nova-senha">Nova senha</label>
        <input id="nova-senha" type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} autoComplete="new-password" minLength="6" required />
        <label htmlFor="confirmar-nova-senha">Confirmar nova senha</label>
        <input id="confirmar-nova-senha" type="password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} autoComplete="new-password" minLength="6" required />
        <p className="password-help">Use pelo menos 6 caracteres e evite senhas conhecidas, como adm1.</p>
        {mensagem && <p className="password-message" role="status">{mensagem}</p>}
        <div className="password-actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar senha'}</button>
        </div>
      </form>
    </Modal>;
}

function DeleteItemModal({ product, onClose, onConfirm }) {
    const products = Array.isArray(product) ? product : [product];
    const multiple = products.length > 1;
    return <Modal title="Excluir item" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <IconTrash />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{multiple ? `Tem certeza que deseja excluir ${products.length} itens?` : 'Tem certeza que deseja excluir este item?'}</p>
            <p className="mt-1 text-sm text-slate-600">
              {multiple ? 'Todos os itens selecionados serão removidos do estoque.' : <><strong>{products[0].name}</strong> será removido do estoque.</>}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500">Os lotes e as movimentações destes itens também serão removidos. Você poderá desfazer esta ação pelo Histórico.</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} autoFocus className="px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">
            {multiple ? `Excluir ${products.length} itens` : 'Excluir item'}
          </button>
        </div>
      </div>
    </Modal>;
}

function ProductDetailsModal({ product, onClose, onEdit }) {
    const empty = value => value === undefined || value === null || value === '' ? 'Não informado' : value;
    const money = value => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const date = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informada';
    const Detail = ({ label, value }) => <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-700">{value}</p></div>;
    return <Modal title="Detalhes do item" onClose={onClose}>
      <div className="space-y-5">
        <div><h3 className="text-lg font-semibold text-slate-800">{product.name}</h3><p className="mt-1 text-xs text-slate-500">{itemLabel(product.itemType)} · {product.sku || 'Sem SKU'}</p></div>
        <section><h4 className="mb-3 text-sm font-semibold text-slate-700">Cadastro e estoque</h4><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Detail label="Categoria" value={empty(product.category)}/><Detail label="Unidade" value={empty(product.unit)}/>
          <Detail label="Saldo atual" value={isStockItem(product) ? `${product.quantity} ${product.unit || 'un'}` : 'Item sob preparo'}/><Detail label="Estoque mínimo" value={isStockItem(product) ? `${product.minStock} ${product.unit || 'un'}` : 'Não se aplica'}/>
          <Detail label="Quantidade recebida" value={isStockItem(product) ? `${product.quantityReceived ?? product.quantity} ${product.unit || 'un'}` : 'Não se aplica'}/><Detail label="Quantidade perdida" value={isStockItem(product) ? `${product.lostQuantity || 0} ${product.unit || 'un'}` : 'Não se aplica'}/>
          <Detail label="Preço do lote" value={isStockItem(product) ? money(product.lotPrice) : 'Não se aplica'}/><Detail label="Preço da unidade" value={money(product.unitPrice ?? product.price)}/>
        </div></section>
        <section><h4 className="mb-3 text-sm font-semibold text-slate-700">Especificações</h4><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Detail label="Número do lote" value={empty(product.lotNumber)}/><Detail label="Validade" value={date(product.expirationDate)}/>
          <Detail label="Fornecedor" value={empty(product.supplier)}/><Detail label="Localização" value={empty(product.location)}/>
        </div><div className="mt-2"><Detail label="Observações" value={empty(product.notes)}/></div></section>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Fechar</button><button type="button" onClick={onEdit} className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">Editar item</button></div>
      </div>
    </Modal>;
}
// ─── Modal: Novo Produto ──────────────────────────────────────────────────────
// ─── Modal: Repor Estoque ─────────────────────────────────────────────────────
function ModalRepor({ product, onClose, onConfirm }) {
    const suggested = product.minStock - product.quantity + Math.round(product.minStock * 0.3);
    const [quantity, setQuantity] = useState(String(suggested > 0 ? suggested : 1));
    const handleSubmit = (e) => {
        e.preventDefault();
        const qty = Number(quantity);
        if (!qty || qty < 1)
            return;
        onConfirm(product.id, qty);
    };
    const newTotal = product.quantity + Number(quantity || 0);
    const willNormalize = newTotal >= product.minStock;
    return (<Modal title="Repor estoque" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Product info */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-slate-800">{product.name}</p>
          <p className="text-xs text-slate-500">{product.category}</p>
          <div className="flex gap-6 pt-1">
            <div>
              <p className="text-xs text-slate-400">Estoque atual</p>
              <p className={`text-lg font-semibold mt-0.5 ${product.status === 'Crítico' ? 'text-red-500' : 'text-amber-500'}`}>
                {product.quantity}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Estoque mínimo</p>
              <p className="text-lg font-semibold text-slate-600 mt-0.5">{product.minStock}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Déficit</p>
              <p className="text-lg font-semibold text-slate-800 mt-0.5">
                {Math.max(0, product.minStock - product.quantity)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Quantidade a repor</label>
          <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400" autoFocus/>
          <p className="text-xs text-slate-400 mt-1.5">Sugestão: {suggested} unidades para atingir 30% acima do mínimo</p>
        </div>

        {/* Preview */}
        {quantity && Number(quantity) > 0 && (<div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${willNormalize ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {willNormalize
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01"/>}
            </svg>
            {willNormalize
                ? `Novo estoque: ${newTotal} — status voltará para Normal`
                : `Novo estoque: ${newTotal} — ainda abaixo do mínimo (${product.minStock})`}
          </div>)}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors">
            Confirmar reposição
          </button>
        </div>
      </form>
    </Modal>);
}
// ─── Screen 1: Estoque ────────────────────────────────────────────────────────
function EstoqueScreen({ products, onDelete, onDeleteMany, onNewProduct, onEdit, onView, enabledTypes, onToggleType }) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Todas');
    const [itemType, setItemType] = useState('Todos');
    const [showTypes, setShowTypes] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const categories = ['Todas', ...new Set(products.map(p => p.category))];
    const filtered = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = category === 'Todas' || p.category === category;
        return matchSearch && matchCat && (itemType === 'Todos' || p.itemType === itemType);
    });
    const totalProducts = products.length;
    const lowStock = products.filter(p => isStockItem(p) && p.status !== 'Normal').length;
    const totalValue = products.filter(isStockItem).reduce((s, p) => s + p.quantity * p.price, 0);
    const allFilteredSelected = filtered.length > 0 && filtered.every(product => selectedIds.includes(product.id));
    const selectedProducts = products.filter(product => selectedIds.includes(product.id));
    const toggleSelectionMode = () => {
        setSelectionMode(current => !current);
        setSelectedIds([]);
    };
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Estoque</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie os itens do seu negócio</p>
        </div>
        <button onClick={onNewProduct} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><IconPlus /> Novo item</button>
      </div>

      <div className="mb-6">
        <button type="button" onClick={() => setShowTypes(v => !v)} aria-expanded={showTypes} className="text-sm font-medium text-green-700 underline underline-offset-4">Tipos de item do negócio</button>
        {showTypes && <fieldset className="mt-3 bg-white border border-slate-100 rounded-xl p-4">
          <legend className="text-sm font-semibold text-slate-700 px-1">Escolha os tipos que você utiliza</legend>
          <p className="text-xs text-slate-500 mb-3">Tipos com itens cadastrados permanecem ativos.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{ITEM_TYPES.map(t => {
                const inUse = products.some(p => p.itemType === t.id);
                return <label key={t.id} className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1 accent-green-600" checked={enabledTypes.includes(t.id)} disabled={inUse} onChange={() => onToggleType(t.id)}/><span>{t.label}<small className="block text-xs text-slate-500">{t.description}{inUse ? ' · Em uso' : ''}</small></span></label>;
            })}</div>
        </fieldset>}
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Itens cadastrados</p>
          <p className="text-3xl font-semibold text-slate-800 mt-2">{totalProducts}</p>
          <p className="text-xs text-slate-400 mt-1">itens cadastrados</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Estoque baixo</p>
          <p className="text-3xl font-semibold text-amber-500 mt-2">{lowStock}</p>
          <p className="text-xs text-slate-400 mt-1">produtos com alerta</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Valor em estoque</p>
          <p className="text-3xl font-semibold text-green-600 mt-2">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">estimativa total</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconSearch /></span>
          <input type="text" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"/>
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <label className="text-xs font-medium text-slate-500" htmlFor="filter-type">Tipo de item</label>
          <select id="filter-type" value={itemType} onChange={e => setItemType(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm max-w-full"><option value="Todos">Todos os tipos</option>{ITEM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
        </div>
        <button type="button" onClick={toggleSelectionMode} className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectionMode ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
          <span aria-hidden="true" className={`flex h-4 w-4 items-center justify-center rounded border ${selectionMode ? 'border-green-600 bg-green-600 text-white' : 'border-slate-400'}`}>{selectionMode ? '✓' : ''}</span>
          {selectionMode ? 'Cancelar seleção' : 'Selecionar itens'}
        </button>
      </div>
      {selectionMode && <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" className="accent-green-600" checked={allFilteredSelected} onChange={event => setSelectedIds(current => event.target.checked ? [...new Set([...current, ...filtered.map(product => product.id)])] : current.filter(id => !filtered.some(product => product.id === id)))} />Selecionar todos os itens exibidos</label>
        <div className="flex items-center gap-3"><span className="text-xs text-slate-500">{selectedProducts.length} selecionado{selectedProducts.length === 1 ? '' : 's'}</span><button type="button" disabled={!selectedProducts.length} onClick={() => onDeleteMany(selectedProducts)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">Excluir selecionados</button></div>
      </div>}
      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm inventory-table">
          <thead>
            <tr className="border-b border-slate-100">
              {selectionMode && <th className="w-10 px-3 py-3.5"><span className="sr-only">Selecionar</span></th>}
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Produto</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoria</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qtd</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Preço un.</th>
              <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (<tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                {selectionMode && <td className="px-3 py-3.5 text-center"><input type="checkbox" aria-label={`Selecionar ${p.name}`} className="accent-green-600" checked={selectedIds.includes(p.id)} onChange={() => setSelectedIds(current => current.includes(p.id) ? current.filter(id => id !== p.id) : [...current, p.id])} /></td>}
                <td className="px-5 py-3.5 font-medium text-slate-700">{p.name}<span className="block text-xs font-normal text-slate-500 mt-1">{itemLabel(p.itemType)}{p.sku ? ` · ${p.sku}` : ''}</span></td>
                <td className="px-5 py-3.5 text-slate-500">{p.category}</td>
                <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">{isStockItem(p) ? `${p.quantity} ${p.unit || 'un'}` : '—'}</td>
                <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
                  R$ {p.price.toFixed(2).replace('.', ',')}
                </td>
                <td className="px-5 py-3.5 text-center"><>{isStockItem(p) ? <StatusBadge status={p.status}/> : <span className="text-xs text-slate-500">Sob preparo</span>}</></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1.5 rounded-md hover:bg-blue-50 transition-colors" aria-label={`Ver mais sobre ${p.name}`} title="Ver mais" onClick={() => onView(p)}><IconEye /></button>
                    <button className="p-1.5 rounded-md hover:bg-slate-100 transition-colors" aria-label={`Editar ${p.name}`} title="Editar" onClick={() => onEdit(p)}><IconEdit /></button>
                    <button className="p-1.5 rounded-md hover:bg-red-50 transition-colors" aria-label={`Excluir ${p.name}`} title="Excluir" onClick={() => onDelete(p)}><IconTrash /></button>
                  </div>
                </td>
              </tr>))}
          </tbody>
        </table>
        {filtered.length === 0 && (<p className="text-center text-slate-400 py-10 text-sm">Nenhum produto encontrado.</p>)}
      </div>
    </div>);
}
// ─── Screen 2: Movimentações ──────────────────────────────────────────────────
function MovimentacoesScreen({ products, movements, onAdd }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        product: String(products[0]?.id ?? ''),
        type: 'Entrada',
        quantity: '',
        date: hoje(),
    });
    const [error, setError] = useState('');
    const selectProductBySku = code => {
        const product = products.find(item => item.sku?.trim().toLowerCase() === code.trim().toLowerCase());
        if (!product) return null;
        setForm(current => ({ ...current, product: String(product.id) }));
        setError('');
        return product;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.product || !form.quantity)
            return;
        const product = products.find(p => String(p.id) === form.product);
        const result = await onAdd({ productId: product?.id, type: form.type, quantity: Number(form.quantity), date: form.date });
        if (result !== true) {
            setError(result);
            return;
        }
        setError('');
        setShowForm(false);
        setForm(f => ({ ...f, quantity: '' }));
    };
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Movimentações</h1>
          <p className="text-sm text-slate-500 mt-0.5">Entradas e saídas de produtos</p>
        </div>
        <button disabled={!products.length} onClick={() => { setError(''); setShowForm(v => !v); }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <IconPlus /> Registrar movimentação
        </button>
      </div>

      {/* Form */}
      {showForm && (<div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-7">
          <h2 className="text-sm font-semibold text-slate-700 mb-5">Nova movimentação</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {error && <p role="alert" className="col-span-2 text-sm text-red-600">{error}</p>}
            <div className="col-span-2"><MovementScanner onCode={selectProductBySku} /></div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Produto</label>
              <select value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400">
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400">
                <option>Entrada</option>
                <option>Saída</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Quantidade</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Data</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"/>
            </div>
            <div className="col-span-2 flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors">
                Registrar
              </button>
            </div>
          </form>
        </div>)}

      {/* History */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Histórico recente</h2>
        </div>
        {movements.map((m, i) => (<div key={m.id} className={`flex items-center px-5 py-4 gap-4 hover:bg-slate-50/70 transition-colors ${i < movements.length - 1 ? 'border-b border-slate-50' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.type === 'Entrada' ? 'bg-green-50' : 'bg-red-50'}`}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={m.type === 'Entrada' ? '#16a34a' : '#ef4444'} strokeWidth={2.5}>
                {m.type === 'Entrada'
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{m.product}</p>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold ${m.type === 'Entrada' ? 'text-green-600' : 'text-red-500'}`}>
                {m.type === 'Entrada' ? '+' : '-'}{m.quantity}
              </span>
              <p className="text-xs text-slate-400 mt-0.5">{m.type}</p>
            </div>
          </div>))}
      </div>
    </div>);
}
// ─── Screen 3: Alertas ────────────────────────────────────────────────────────
function AlertasScreen({ products, onRepor }) {
    const lowProducts = products.filter(p => isStockItem(p) && p.status !== 'Normal');
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">Alertas</h1>
        <p className="text-sm text-slate-500 mt-0.5">Produtos que precisam de atenção</p>
      </div>

      {/* Warning Banner */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-7">
        <IconWarning />
        <p className="text-sm font-medium text-amber-800">
          <span className="font-bold">{lowProducts.length} produto{lowProducts.length !== 1 ? 's' : ''}</span> {lowProducts.length !== 1 ? 'precisam' : 'precisa'} de reposição no estoque.
        </p>
      </div>

      {/* Low Stock List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Produtos abaixo do mínimo</h2>
        </div>
        {lowProducts.length === 0 ? (<p className="text-center text-slate-400 py-10 text-sm">Nenhum alerta no momento.</p>) : lowProducts.map((p, i) => (<div key={p.id} className={`flex items-center px-5 py-4 gap-4 hover:bg-slate-50/70 transition-colors ${i < lowProducts.length - 1 ? 'border-b border-slate-50' : ''}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700">{p.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.category}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-slate-400 mb-0.5">Atual</p>
              <p className={`text-base font-semibold ${p.status === 'Crítico' ? 'text-red-500' : 'text-amber-500'}`}>{p.quantity}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-slate-400 mb-0.5">Mínimo</p>
              <p className="text-base font-semibold text-slate-600">{p.minStock}</p>
            </div>
            <div className="text-center px-2">
              <StatusBadge status={p.status}/>
            </div>
            <button onClick={() => onRepor(p)} className="ml-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors flex-shrink-0">
              Repor
            </button>
          </div>))}
      </div>
    </div>);
}
// ─── Screen 4: Relatórios ─────────────────────────────────────────────────────
function RelatoriosScreen({ products }) {
    // Aggregate by category
    const categoryMap = {};
    for (const p of products) {
        if (!categoryMap[p.category])
            categoryMap[p.category] = { count: 0, value: 0 };
        categoryMap[p.category].count++;
        categoryMap[p.category].value += isStockItem(p) ? p.quantity * p.price : 0;
    }
    const pieData = Object.entries(categoryMap).map(([name, d]) => ({ name, value: d.count }));
    const barData = Object.entries(categoryMap).map(([name, d]) => ({
        name,
        valor: Math.round(d.value * 100) / 100
    }));
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">Relatórios</h1>
        <p className="text-sm text-slate-500 mt-0.5">Visão geral do estoque por categoria</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Produtos por categoria</h2>
          <p className="text-xs text-slate-400 mb-6">Distribuição por número de itens</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {pieData.map((_, idx) => (<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]}/>))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v) => [`${v} produto${v !== 1 ? 's' : ''}`, '']}/>
              <Legend wrapperStyle={{ fontSize: 12 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Valor em estoque</h2>
          <p className="text-xs text-slate-400 mb-6">Total (R$) por categoria</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`}/>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v) => [`R$ ${v.toFixed(2).replace('.', ',')}`, 'Valor']}/>
              <Bar dataKey="valor" fill="#16a34a" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary table */}
      <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Resumo por categoria</h2>
        </div>
        <table className="w-full text-sm inventory-table">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoria</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Produtos</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(categoryMap).map(([cat, d], i, arr) => (<tr key={cat} className={`hover:bg-slate-50/70 transition-colors ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <td className="px-5 py-3 font-medium text-slate-700">{cat}</td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">{d.count}</td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-700 font-medium">
                  R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
// ─── Sidebar ──────────────────────────────────────────────────────────────────
const navItems = [
    { key: 'estoque', label: 'Estoque', Icon: IconBox },
    { key: 'movimentacoes', label: 'Movimentações', Icon: IconArrows },
    { key: 'alertas', label: 'Alertas', Icon: IconBell },
    { key: 'relatorios', label: 'Relatórios', Icon: IconChart },
    { key: 'historico', label: 'Histórico', Icon: IconHistory },
];
function Sidebar({ active, onNavigate, alertCount, onLogout, onChangePassword }) {
    return (<aside className="app-sidebar w-full lg:w-56 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col lg:h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 7.5M17 13l1.5 7.5M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-none">MercadoApp</p>
            <p className="text-xs text-slate-400 mt-0.5">Controle de estoque</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ key, label, Icon }) => {
            const isActive = active === key;
            return (<button key={key} onClick={() => onNavigate(key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}>
              <Icon active={isActive}/>
              <span>{label}</span>
              {key === 'alertas' && alertCount > 0 && (<span className="ml-auto text-xs font-semibold bg-amber-100 text-amber-700 rounded-full w-5 h-5 flex items-center justify-center">
                  {alertCount}
                </span>)}
            </button>);
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-100">
        <button type="button" onClick={onChangePassword} className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Trocar senha</button>
        <button type="button" onClick={onLogout} className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Sair</button>
        <p className="text-xs text-slate-400">Versão 1.0.0</p>
      </div>
    </aside>);
}
// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App({ onLogout }) {
    const [screen, setScreen] = useState('estoque');
    const [products, setProducts] = useState([]);
    const [movements, setMovements] = useState([]);
    const [enabledTypes, setEnabledTypes] = useState(ITEM_TYPES.map(t => t.id));
    const [editingProduct, setEditingProduct] = useState(null);
    const [deletingProduct, setDeletingProduct] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [showNovoProduto, setShowNovoProduto] = useState(false);
    const [showTrocarSenha, setShowTrocarSenha] = useState(false);
    const [reporProduct, setReporProduct] = useState(null);
    const [activities, setActivities] = useState([]);
    const [undoing, setUndoing] = useState(null);
    const alertCount = products.filter(p => isStockItem(p) && p.status !== 'Normal').length;
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState('');
    const saving = useRef(false);
    const recarregar = async () => {
        const dados = await carregarEstoque();
        setProducts(dados.products);
        setMovements(dados.movements);
        setActivities(dados.activities);
    };
    const iniciar = async () => {
        setLoading(true);
        setApiError('');
        try { await recarregar(); } catch (erro) { setApiError(erro.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { iniciar(); }, []);
    const executar = async (operacao) => {
        if (saving.current) return 'Aguarde a operação atual.';
        saving.current = true;
        setBusy(true);
        setApiError('');
        try {
            await operacao();
            // Não reenviar uma gravação bem-sucedida caso só a atualização da tela falhe.
            try { await recarregar(); } catch (erro) { setApiError('Salvo no banco, mas a tela não atualizou. ' + erro.message); }
            return true;
        } catch (erro) {
            try { await recarregar(); } catch {}
            setApiError(erro.message);
            return erro.message;
        } finally { saving.current = false; setBusy(false); }
    };
    const handleDelete = async () => {
        const targets = Array.isArray(deletingProduct) ? deletingProduct : [deletingProduct];
        const resultado = await executar(async () => {
            await request('/produtos/excluir-selecionados','POST',{ids:targets.map(produto => produto.id)});
        });
        if (resultado === true) setDeletingProduct(null);
    };
    const handleAddMovement = async m => await executar(() => request('/movimentacoes-estoque','POST', {
        produto_id:m.productId, quantidade:m.quantity, tipo:m.type, data_movimentacao:m.date
    }));
    const handleNovoProduto = async data => {
        const resultado = await executar(() => salvarProduto(data,editingProduct));
        if (resultado === true) { setEditingProduct(null); setShowNovoProduto(false); }
        return resultado;
    };
    const handleImportMany = async importedProducts => {
        let salvos = 0;
        const resultado = await executar(async () => {
            for (const data of importedProducts) {
                try { await salvarProduto(data); salvos++; }
                catch (erro) { throw new Error(salvos + ' item(ns) salvo(s). Falha em ' + data.name + ': ' + erro.message + ' Selecione apenas os itens restantes para tentar novamente.'); }
            }
        });
        if (resultado === true) { setShowNovoProduto(false); setScreen('estoque'); }
        return resultado;
    };
    const handleUndo = async () => {
        const resultado = await executar(() => request('/historico-atividades/' + undoing.id + '/desfazer','POST'));
        if (resultado === true) setUndoing(null);
    };
    const handleRepor = async (productId, quantity) => {
        const resultado = await handleAddMovement({ productId, quantity, type:'Entrada', date:hoje() });
        if (resultado === true) setReporProduct(null);
    };
    return (<div className="app-shell flex flex-col lg:flex-row h-dvh bg-slate-50 overflow-hidden">
      {busy && <div className="saving-overlay" role="status">Salvando…</div>}
      {apiError && <div className="api-error" role="alert">{apiError}<button onClick={() => { setApiError(''); iniciar(); }}>Atualizar dados</button><button onClick={() => setApiError('')}>Fechar</button></div>}
      <Sidebar active={screen} onNavigate={setScreen} alertCount={alertCount} onLogout={onLogout} onChangePassword={() => setShowTrocarSenha(true)}/>
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
        {loading && <p className="p-4" role="status">Carregando estoque…</p>}
        {!loading && screen === 'estoque' && <EstoqueScreen products={products} onDelete={setDeletingProduct} onDeleteMany={setDeletingProduct} onView={setViewingProduct} enabledTypes={enabledTypes} onToggleType={id => setEnabledTypes(ts => ts.includes(id) ? ts.filter(t => t !== id) : [...ts, id])} onEdit={p => { setEditingProduct(p); setShowNovoProduto(true); }} onNewProduct={() => { setEditingProduct(null); setShowNovoProduto(true); }}/>} 
        {screen === 'movimentacoes' && <MovimentacoesScreen products={products.filter(isStockItem)} movements={movements} onAdd={handleAddMovement}/>}
        {screen === 'alertas' && <AlertasScreen products={products} onRepor={setReporProduct}/>}
        {screen === 'relatorios' && <RelatoriosScreen products={products}/>}
        {screen === 'historico' && <HistoryScreen activities={activities} onUndo={id => setUndoing(activities.find(a => a.id === id))}/>}
      </main>

      {undoing && <Modal title="Desfazer atividade" onClose={() => setUndoing(null)}><p className="text-sm text-slate-600">Deseja desfazer: {undoing.description}? Os dados dos itens envolvidos voltarão ao estado anterior.</p><div className="flex gap-3 mt-5"><button className="px-4 py-2 border rounded-lg" onClick={() => setUndoing(null)}>Cancelar</button><button className="px-4 py-2 bg-green-600 text-white rounded-lg" onClick={handleUndo}>Confirmar desfazer</button></div></Modal>}
      {showNovoProduto && (<Modal title={editingProduct ? "Editar item" : "Novo item"} onClose={() => setShowNovoProduto(false)}><ItemForm item={editingProduct} enabledTypes={enabledTypes} categories={[...new Set(products.map(p => p.category))]} onCancel={() => setShowNovoProduto(false)} onSave={handleNovoProduto} onImportMany={handleImportMany}/></Modal>)}
      {deletingProduct && <DeleteItemModal product={deletingProduct} onClose={() => setDeletingProduct(null)} onConfirm={handleDelete}/>} 
      {viewingProduct && <ProductDetailsModal product={viewingProduct} onClose={() => setViewingProduct(null)} onEdit={() => { setEditingProduct(viewingProduct); setViewingProduct(null); setShowNovoProduto(true); }}/>} 
      {reporProduct && (<ModalRepor product={reporProduct} onClose={() => setReporProduct(null)} onConfirm={handleRepor}/>)}
      {showTrocarSenha && <TrocarSenhaModal onClose={() => setShowTrocarSenha(false)}/>}
    </div>);
}
