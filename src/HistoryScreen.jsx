const labels = {
  create: { text: 'Cadastro', style: 'bg-green-50 text-green-700 border-green-200' },
  edit: { text: 'Edição', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  delete: { text: 'Exclusão', style: 'bg-red-50 text-red-700 border-red-200' },
  movement: { text: 'Movimentação', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  import: { text: 'Importação', style: 'bg-violet-50 text-violet-700 border-violet-200' },
};

export default function HistoryScreen({ activities, onUndo }) {
  const latestUndoable = activities.find(activity => !activity.undone);
  return <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-slate-800">Histórico de atividades</h1>
      <p className="text-sm text-slate-500 mt-0.5">Acompanhe as atividades salvas no banco de dados.</p>
    </div>
    <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">Desfaça da atividade mais recente para a mais antiga. Registros antigos sem cópia completa ficam disponíveis apenas para consulta.</div>
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      {activities.length === 0 ? <div className="px-5 py-12 text-center"><p className="text-sm font-medium text-slate-600">Nenhuma atividade registrada.</p><p className="mt-1 text-xs text-slate-400">Cadastros, importações, edições, exclusões e movimentações aparecerão aqui.</p></div> : activities.map((activity, index) => {
        const badge = labels[activity.kind] || labels.edit;
        const canUndo = latestUndoable?.id === activity.id && activity.undoable;
        return <article key={activity.id} className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center ${index < activities.length - 1 ? 'border-b border-slate-100' : ''} ${activity.undone ? 'bg-slate-50 opacity-70' : ''}`}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge.style}`}>{badge.text}</span>{activity.undone && <span className="text-xs font-medium text-slate-500">Desfeita</span>}</div>
            <p className={`mt-2 text-sm font-medium ${activity.undone ? 'line-through text-slate-500' : 'text-slate-700'}`}>{activity.description}</p>
            <time className="mt-1 block text-xs text-slate-400">{new Date(activity.createdAt).toLocaleString('pt-BR')}</time>
          </div>
          {onUndo && !activity.undone && <button type="button" disabled={!canUndo} onClick={() => onUndo(activity.id)} title={canUndo ? 'Desfazer esta atividade' : 'Desfaça primeiro as atividades mais recentes'} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Desfazer</button>}
        </article>;
      })}
    </div>
  </div>;
}
