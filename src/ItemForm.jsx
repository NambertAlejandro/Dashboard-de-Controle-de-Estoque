import { useMemo, useState } from 'react';
import { ITEM_TYPES } from './inventory.js';
import StockCapture from './StockCapture.jsx';

const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400';

function Field({ id, label, children, hint }) {
  return <div><label htmlFor={id} className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>{children}{hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}</div>;
}

export default function ItemForm({ item, enabledTypes, categories, onCancel, onSave, onImportMany }) {
  const [form, setForm] = useState(() => ({
    name: item?.name || '', sku: item?.sku || `ITEM-${String(Date.now()).slice(-6)}`, category: item?.category || '',
    itemType: item?.itemType || enabledTypes[0] || '', unit: item?.unit || 'un',
    quantityReceived: String(item ? (item.quantityReceived ?? item.quantity) : 0),
    lostQuantity: String(item?.lostQuantity ?? 0),
    lotPrice: String(item?.lotPrice ?? (item ? item.quantity * item.price : 0)),
    unitPrice: String(item?.unitPrice ?? item?.price ?? 0), minStock: String(item?.minStock ?? 0),
    lotNumber: item?.lotNumber || '', expirationDate: item?.expirationDate || '',
    supplier: item?.supplier || '', location: item?.location || '', notes: item?.notes || '',
  }));
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('simplified');
  const type = ITEM_TYPES.find(option => option.id === form.itemType);
  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }));
  const available = useMemo(() => Math.max(0, Number(form.quantityReceived || 0) - Number(form.lostQuantity || 0)), [form.quantityReceived, form.lostQuantity]);
  const submit = event => {
    event.preventDefault();
    if (!type || !form.name.trim() || !form.sku.trim() || !form.category.trim()) { setActiveTab('simplified'); return setError('Preencha o nome, o código/SKU, a categoria e o tipo do item.'); }
    const numbers = type.stock ? [form.quantityReceived, form.lostQuantity, form.lotPrice, form.unitPrice, form.minStock] : [form.unitPrice];
    if (numbers.some(value => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) { setActiveTab('simplified'); return setError('Informe valores válidos, iguais ou maiores que zero.'); }
    if (type.stock && Number(form.lostQuantity) > Number(form.quantityReceived)) { setActiveTab('simplified'); return setError('A quantidade perdida não pode ser maior que a quantidade recebida.'); }
    onSave({
      name: form.name.trim(), sku: form.sku.trim(), category: form.category.trim(), itemType: form.itemType,
      unit: form.unit.trim() || 'un', quantity: type.stock ? (item ? item.quantity : available) : 0,
      quantityReceived: type.stock ? Number(form.quantityReceived) : 0, lostQuantity: type.stock ? Number(form.lostQuantity) : 0,
      lotPrice: type.stock ? Number(form.lotPrice) : 0, unitPrice: Number(form.unitPrice), price: Number(form.unitPrice),
      minStock: type.stock ? Number(form.minStock) : 0, lotNumber: form.lotNumber.trim(),
      expirationDate: form.expirationDate, supplier: form.supplier.trim(), location: form.location.trim(), notes: form.notes.trim(),
    });
  };

  return <form onSubmit={submit} className="space-y-5">
    <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Etapas do cadastro">
      <button type="button" role="tab" aria-selected={activeTab === 'simplified'} onClick={() => setActiveTab('simplified')} className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'simplified' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Cadastro simplificado<span className="mt-0.5 block text-[10px] font-normal">Campos obrigatórios</span></button>
      <button type="button" role="tab" aria-selected={activeTab === 'specifications'} onClick={() => setActiveTab('specifications')} className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'specifications' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Especificações<span className="mt-0.5 block text-[10px] font-normal">Campos opcionais</span></button>
    </div>

    {activeTab === 'simplified' && <div role="tabpanel" className="space-y-5">
    <section><h3 className="text-sm font-semibold text-slate-700 mb-3">Identificação</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field id="item-name" label="Nome do item"><input id="item-name" required maxLength={120} autoFocus value={form.name} onChange={set('name')} className={inputClass} placeholder="Ex.: Refrigerante, queijo ou caixa" /></Field>
      <Field id="item-sku" label="Código / SKU"><input id="item-sku" required maxLength={50} value={form.sku} onChange={set('sku')} className={inputClass} placeholder="Ex.: BEB-001" /></Field>
      <Field id="item-type" label="Tipo de item" hint={`${type?.description || ''}${item ? ' O tipo é preservado após o cadastro.' : ''}`}><select id="item-type" required value={form.itemType} onChange={set('itemType')} className={inputClass} disabled={!!item}><option value="" disabled>Selecione um tipo</option>{ITEM_TYPES.filter(option => enabledTypes.includes(option.id)).map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></Field>
      <Field id="item-category" label="Categoria"><input id="item-category" required maxLength={80} list="item-categories" value={form.category} onChange={set('category')} className={inputClass} placeholder="Selecione ou escreva" /><datalist id="item-categories">{categories.map(category => <option key={category} value={category} />)}</datalist></Field>
    </div></section>

    {!type?.stock && type && <p className="bg-green-50 border border-green-100 text-green-800 rounded-lg p-3 text-sm">Este item é feito sob preparo e fica no catálogo, sem saldo próprio ou alerta de reposição.</p>}

    {type?.stock && <section><h3 className="text-sm font-semibold text-slate-700 mb-3">Recebimento e saldo</h3>
      {!item && <div className="mb-3"><StockCapture onQuantity={quantityReceived => setForm(current => ({ ...current, quantityReceived }))} onSku={sku => setForm(current => ({ ...current, sku }))} onImportData={data => setForm(current => ({ ...current, ...data }))} onImportMany={onImportMany} /></div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field id="item-unit" label="Unidade de medida"><input id="item-unit" required list="measurement-units" value={form.unit} onChange={set('unit')} className={inputClass} placeholder="un, kg, L, caixa..." /><datalist id="measurement-units"><option value="un" /><option value="kg" /><option value="g" /><option value="L" /><option value="ml" /><option value="caixa" /><option value="pacote" /></datalist></Field>
      <Field id="item-minimum" label="Estoque mínimo"><input id="item-minimum" type="number" min="0" step="any" required value={form.minStock} onChange={set('minStock')} className={inputClass} /></Field>
      <Field id="item-received" label={item ? 'Quantidade recebida neste lote' : 'Quantidade recebida'}><input id="item-received" type="number" min="0" step="any" required value={form.quantityReceived} onChange={set('quantityReceived')} readOnly={!!item} className={inputClass} /></Field>
      <Field id="item-lost" label="Quantidade perdida" hint="Quebras, avarias ou itens inutilizados no recebimento."><input id="item-lost" type="number" min="0" step="any" required value={form.lostQuantity} onChange={set('lostQuantity')} readOnly={!!item} className={inputClass} /></Field>
    </div><div className="mt-3 flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm"><span className="text-green-800">Saldo aproveitável</span><strong className="text-green-700">{available.toLocaleString('pt-BR')} {form.unit || 'un'}</strong></div>
    {item && <p className="text-xs text-slate-500 mt-2">O recebimento e as perdas iniciais ficam preservados. Novas alterações de saldo devem ser registradas em Movimentações.</p>}</section>}

    <section><h3 className="text-sm font-semibold text-slate-700 mb-3">Valores</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {type?.stock && <Field id="item-lot-price" label="Preço do lote (R$)" hint="Valor total pago pelo lote recebido."><input id="item-lot-price" type="number" min="0" step="0.01" required value={form.lotPrice} onChange={set('lotPrice')} className={inputClass} /></Field>}
      <Field id="item-unit-price" label="Preço da unidade (R$)" hint="Valor de custo ou venda por unidade controlada."><input id="item-unit-price" type="number" min="0" step="0.01" required value={form.unitPrice} onChange={set('unitPrice')} className={inputClass} /></Field>
    </div></section>
    </div>}

    {activeTab === 'specifications' && <div role="tabpanel" className="space-y-5">
    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">Você pode concluir o cadastro sem preencher esta aba e editar essas informações depois.</div>
    {type?.stock && <section><h3 className="text-sm font-semibold text-slate-700 mb-3">Rastreabilidade <span className="font-normal text-slate-400">(opcional)</span></h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field id="item-lot" label="Número do lote"><input id="item-lot" maxLength={60} value={form.lotNumber} onChange={set('lotNumber')} className={inputClass} placeholder="Ex.: LT-2026-045" /></Field>
      <Field id="item-expiration" label="Data de validade"><input id="item-expiration" type="date" value={form.expirationDate} onChange={set('expirationDate')} className={inputClass} /></Field>
      <Field id="item-supplier" label="Fornecedor"><input id="item-supplier" maxLength={120} value={form.supplier} onChange={set('supplier')} className={inputClass} placeholder="Nome do fornecedor" /></Field>
      <Field id="item-location" label="Localização"><input id="item-location" maxLength={80} value={form.location} onChange={set('location')} className={inputClass} placeholder="Ex.: Depósito A, prateleira 2" /></Field>
    </div></section>}

    <Field id="item-notes" label="Observações (opcional)"><textarea id="item-notes" rows="3" maxLength={300} value={form.notes} onChange={set('notes')} className={inputClass} placeholder="Informações úteis sobre o item ou recebimento" /></Field>
    </div>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {!enabledTypes.length && <p className="text-sm text-amber-700">Ative um tipo em “Tipos de item do negócio” para cadastrar.</p>}
    <div className="sticky -bottom-5 -mx-6 flex flex-col-reverse sm:flex-row gap-3 border-t border-slate-100 bg-white px-6 pt-4 pb-1"><button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">Cancelar</button><button type="submit" disabled={!enabledTypes.length} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white">{item ? 'Salvar alterações' : 'Cadastrar item'}</button></div>
  </form>;
}
