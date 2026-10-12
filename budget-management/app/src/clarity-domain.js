/* Presentation rules: keep the original records intact. */
function historicalItem(s, item) {
  const observations = item.observations || [];
  const bought = s.receipts.some(r => (!s.trackingStart||r.date>=s.trackingStart) && r.lines.some(l => l.itemId === item.id));
  const stocked = s.lots.some(l => l.itemId === item.id && (!s.trackingStart||l.purchased>=s.trackingStart));
  return !bought && !stocked && (item.referenceOnly || observations.length > 0 && observations.every(o => s.trackingStart&&o.date<s.trackingStart));
}
function catalogueScope(s, mode = 'current') {
  if (mode === 'all') return s;
  return {...s, items: s.items.filter(i => mode === 'history' ? historicalItem(s, i) : !historicalItem(s, i))};
}
function transactionRows(s, rows) {
  const out = [], seen = new Map();
  for (const x of rows) {
    const receipt = !x.refund && x.receiptId && s.receipts.find(r => r.id === x.receiptId);
    const key = receipt ? 'receipt:' + receipt.id : x.refund && x.groupId ? 'refund:' + x.groupId : null;
    if (key && seen.has(key)) {
      const g = seen.get(key);
      g.amount = Math.round(g.amount * 100 + x.amount * 100) / 100;
      if (g.fors) g.fors.push(x.forNote);
      if (g.expenseIds) g.expenseIds.push(x.id);
      continue;
    }
    const row = receipt ? {...x, id:key, receiptId:receipt.id, receiptTotal:true,
      note:receipt.merchant || 'Receipt', itemCount:receipt.lines.length, expenseIds:[x.id], place:receipt.place || ''}
      : x.refund ? {...x, fors:[x.forNote]} : {...x};
    if (key) seen.set(key, row);
    out.push(row);
  }
  return out;
}
function transactionDialog(x) {
  return {type:x.receiptTotal ? 'receipt-detail' : x.refund ? 'refund-detail' : 'expense-detail', id:x.receiptTotal ? x.receiptId : x.id};
}
