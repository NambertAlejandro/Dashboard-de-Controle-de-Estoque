import { statusFor, hoje } from './inventory.js';

const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export async function request(path, method = 'GET', dados) {
  let resposta;
  try {
    resposta = await fetch(base + path, { method, headers: dados === undefined ? {} : { 'Content-Type': 'application/json' }, body: dados === undefined ? undefined : JSON.stringify(dados) });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Confira se o backend está ligado.');
  }
  if (resposta.status === 204) return null;
  const texto = await resposta.text();
  let resultado;
  try { resultado = JSON.parse(texto); } catch { throw new Error('O servidor não respondeu como esperado. Confira o endereço da API.'); }
  if (!resposta.ok) throw new Error(resultado.erro || 'Não foi possível concluir a operação.');
  return resultado;
}

export async function carregarEstoque() {
  const [produtos, movimentos, categorias, unidades, lotes, fornecedores, locais, historico] = await Promise.all([
    request('/produtos'), request('/movimentacoes-estoque'), request('/categorias'), request('/unidades-medida'),
    request('/lotes'), request('/fornecedores'), request('/locais-estoque'), request('/historico-atividades')
  ]);
  const products = produtos.map(produto => {
    const lote = lotes.find(l => l.produto_id === produto.id);
    const quantity = Number(movimentos.filter(m => m.produto_id === produto.id).reduce((saldo, m) => saldo + (m.tipo === 'Entrada' ? Number(m.quantidade) : -Number(m.quantidade)), 0).toFixed(3));
    return { ...produto, quantity, minStock: Number(produto.minStock), price: Number(produto.unitPrice), unitPrice: Number(produto.unitPrice),
      category: categorias.find(c => c.id === produto.categoria_id)?.nome || '', unit: unidades.find(u => u.id === produto.unidade_medida_id)?.simbolo || 'un',
      loteId: lote?.id, quantityReceived: Number(lote?.quantityReceived || 0), lostQuantity: Number(lote?.lostQuantity || 0), lotPrice: Number(lote?.lotPrice || 0),
      lotNumber: lote?.lotNumber || '', expirationDate: lote?.espirationDate?.slice(0,10) || '',
      supplier: fornecedores.find(f => f.id === lote?.fornecedor_id)?.nome || '', location: locais.find(l => l.id === lote?.local_estoque_id)?.nome || '',
      status: statusFor(quantity, Number(produto.minStock)) };
  });
  return {
    products,
    movements: movimentos.map(m => ({ id:m.id, productId:m.produto_id, product:produtos.find(p => p.id === m.produto_id)?.name || 'Produto removido', type:m.tipo, quantity:Number(m.quantidade), date:m.data_movimentacao.slice(0,10) })),
    activities: historico.map(a => ({ id:a.id, kind:a.tipo_acao === 'movimentacao' ? 'movement' : a.tipo_acao, description:a.descricao, createdAt:a.criado_em, undone:a.desfeita, undoable:a.produtos_antes?.versao === 1 }))
  };
}

async function encontrarOuCadastrar(path, campo, texto) {
  if (!texto?.trim()) return null;
  const lista = await request(path);
  const atual = lista.find(item => item[campo] === texto.trim());
  if (atual) return atual.id;
  try { return (await request(path, 'POST', { [campo]: texto.trim() })).id; }
  catch (erro) {
    // Outra pessoa pode ter cadastrado o mesmo nome enquanto enviávamos.
    const atualizado = (await request(path)).find(item => item[campo] === texto.trim());
    if (atualizado) return atualizado.id;
    throw erro;
  }
}
export async function salvarProduto(data, atual) {
  const categoria_id = await encontrarOuCadastrar('/categorias','nome',data.category);
  const unidade_medida_id = await encontrarOuCadastrar('/unidades-medida','simbolo',data.unit || 'un');
  const dados = { name:data.name, sku:data.sku, itemType:data.itemType, unitPrice:Number(data.unitPrice), minStock:Number(data.minStock), notes:data.notes, categoria_id, unidade_medida_id };
  if (data.itemType !== 'prepared') {
    const fornecedor_id = await encontrarOuCadastrar('/fornecedores','nome',data.supplier);
    const local_estoque_id = await encontrarOuCadastrar('/locais-estoque','nome',data.location);
    dados.lote = { data_movimentacao: hoje(), id:atual?.loteId, quantityReceived:Number(data.quantityReceived || 0), lostQuantity:Number(data.lostQuantity || 0), lotPrice:Number(data.lotPrice || 0), lotNumber:data.lotNumber, expirationDate:data.expirationDate, fornecedor_id, local_estoque_id };
  }
  return await request(atual ? '/produtos/' + atual.id : '/produtos', atual ? 'PUT' : 'POST', dados);
}
