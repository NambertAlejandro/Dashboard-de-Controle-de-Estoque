export const ITEM_TYPES = [
  { id: 'resale', label: 'Produto de revenda', description: 'Comprado pronto para vender.', stock: true },
  { id: 'ingredient', label: 'Ingrediente', description: 'Utilizado no preparo de outros itens.', stock: true },
  { id: 'intermediate', label: 'Preparação intermediária', description: 'Massa, molho ou outra base produzida.', stock: true },
  { id: 'prepared', label: 'Produto preparado', description: 'Pizza, hambúrguer ou outro item feito sob preparo.', stock: false },
  { id: 'packaging', label: 'Embalagem', description: 'Caixas, copos e materiais de entrega.', stock: true },
];
export const isStockItem = item => item.itemType !== 'prepared';
export const statusFor = (quantity, minimum) => quantity <= 0 || quantity < minimum * .5 ? 'Crítico' : quantity < minimum ? 'Baixo' : 'Normal';
export function applyMovement(products, movement) {
  const product = products.find(p => p.id === movement.productId);
  if (!product || !isStockItem(product)) throw new Error('Selecione um item com controle de estoque.');
  if (!['Entrada', 'Saída'].includes(movement.type)) throw new Error('Tipo de movimentação inválido.');
  if (!Number.isFinite(movement.quantity) || movement.quantity <= 0) throw new Error('Informe uma quantidade maior que zero.');
  if (movement.type === 'Saída' && movement.quantity > product.quantity) throw new Error(`Saldo insuficiente. Disponível: ${product.quantity}.`);
  return products.map(p => {
    if (p.id !== product.id) return p;
    const quantity = p.quantity + (movement.type === 'Entrada' ? movement.quantity : -movement.quantity);
    return { ...p, quantity, status: statusFor(quantity, p.minStock) };
  });
}

// Data do aparelho, sem adiantar o dia por causa do fuso UTC.
export function hoje() {
  const data = new Date();
  return [data.getFullYear(), String(data.getMonth() + 1).padStart(2, '0'), String(data.getDate()).padStart(2, '0')].join('-');
}
