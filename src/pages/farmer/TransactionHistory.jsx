import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api/axios';
import { History, Download, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';

export default function TransactionHistory() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: transactions = [], isLoading: loading } = useQuery({
    queryKey: ['farmer-transactions'],
    queryFn: async () => {
      const res = await api.get('/farmer/transactions');
      return res.data;
    }
  });

  const filtered = transactions.filter(t => {
    const matchFilter = filter === 'all' || t.direction === filter;
    const matchSearch = !search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.transaction_id?.includes(search) || t.invoice_number?.includes(search);
    return matchFilter && matchSearch;
  });

  const totalCredit = transactions.filter(t => t.direction === 'credit').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalDebit = transactions.filter(t => t.direction === 'debit').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const downloadCSV = () => {
    const header = 'Date,Type,Description,UPI ID,Transaction ID,Invoice,Amount,Status\n';
    const rows = filtered.map(t =>
      `${new Date(t.created_at).toLocaleDateString('en-IN')},${t.direction},${t.description || ''},${t.upi_id || ''},${t.transaction_id || ''},${t.invoice_number || ''},${t.amount},${t.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
  };

  const downloadInvoice = (tx) => {
    const content = `AGRIFLOW ERP INVOICE\n\nInvoice Number: ${tx.invoice_number}\nDate: ${new Date(tx.created_at).toLocaleString('en-IN')}\nDescription: ${tx.description}\nType: ${tx.direction}\nAmount: ${tx.amount}\nStatus: ${tx.status}\n\nThank you for using AgriFlow!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Invoice_${tx.invoice_number}.txt`; a.click();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">{t('transaction_history')}</h1><p className="page-subtitle">{t('transaction_history_desc')}</p></div>
        <button onClick={downloadCSV} className="btn-secondary flex items-center gap-2"><Download size={16} />{t('export_csv')}</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon bg-green-500"><ArrowUpCircle size={22} /></div>
          <div><p className="stat-value text-green-600">₹{totalCredit.toLocaleString('en-IN')}</p><p className="stat-label">{t('total_earned')}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red-500"><ArrowDownCircle size={22} /></div>
          <div><p className="stat-value text-red-500">₹{totalDebit.toLocaleString('en-IN')}</p><p className="stat-label">{t('total_spent')}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-500"><History size={22} /></div>
          <div><p className="stat-value">{transactions.length}</p><p className="stat-label">{t('total_transactions')}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_tx_placeholder')} className="input-field pl-10" />
        </div>
        <div className="tab-nav w-auto mb-0 flex-shrink-0">
          {['all', 'credit', 'debit'].map(f => (
            <button key={f} className={`tab-btn capitalize ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead><tr>
              <th>{t('date')}</th><th>{t('type')}</th><th>{t('description')}</th><th>{t('upi_id')}</th><th>{t('transaction_id')}</th><th>{t('invoice')}</th><th>{t('amount')}</th><th>{t('status')}</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">{t('no_transactions_found')}</td></tr>
                : filtered.map(tx => (
                  <tr key={tx.id}>
                    <td className="text-xs">{new Date(tx.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tx.direction === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.direction === 'credit' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                        {tx.direction}
                      </span>
                    </td>
                    <td className="text-xs max-w-[180px] truncate">{tx.description || '-'}</td>
                    <td className="text-xs">{tx.upi_id || '-'}</td>
                    <td className="text-xs">{tx.transaction_id || '-'}</td>
                    <td>{tx.invoice_number ? (
                      <button onClick={() => downloadInvoice(tx)} className="badge-blue text-[10px] flex items-center gap-1 hover:bg-blue-200 transition-colors">
                        {tx.invoice_number} <Download size={10} />
                      </button>
                    ) : '-'}</td>
                    <td className={`font-bold ${tx.direction === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.direction === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td><span className={`badge ${tx.status === 'completed' ? 'badge-green' : tx.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>{tx.status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
