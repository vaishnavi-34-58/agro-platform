import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api/axios';
import { ShoppingCart, X, CheckCircle, Search, Tag, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const GRAIN_PHOTOS = {
  Rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
  Wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400',
  Maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=400',
  Cotton: '/cotton-seeds.png',
  Soybean: '/soybean-seeds.png',
  Sugarcane: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=400',
  Groundnut: 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&q=80&w=400',
  default: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?auto=format&fit=crop&q=80&w=400'
};

export default function SeedPurchase() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ quantity_kg: '', payment_method: 'upi', upi_id: '', transaction_id: '' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('browse');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState(10000);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data: seeds = [], isLoading: seedsLoading } = useQuery({
    queryKey: ['farmer-seeds'],
    queryFn: async () => { const res = await api.get('/farmer/seeds'); return res.data; }
  });
  
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['farmer-seed-purchases'],
    queryFn: async () => { const res = await api.get('/farmer/seed-purchases'); return res.data; }
  });

  const loading = seedsLoading || purchasesLoading;

  const openBuy = (seed) => { setSelected(seed); setForm({ quantity_kg: '', payment_method: 'upi', upi_id: '', transaction_id: '' }); setShowModal(true); };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!form.quantity_kg || parseFloat(form.quantity_kg) <= 0) return toast.error(t('enter_valid_quantity'));
    if (form.payment_method === 'upi') {
      if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(form.upi_id)) return toast.error(t('invalid_upi_id') || 'Invalid UPI ID format');
      if (!/^\d{12}$/.test(form.transaction_id)) return toast.error(t('invalid_transaction_id') || 'Transaction ID must be exactly 12 digits');
    }
    setSaving(true);
    try {
      const { data } = await api.post('/farmer/seed-purchase', {
        seed_id: selected.id,
        quantity_kg: parseFloat(form.quantity_kg),
        payment_method: form.payment_method,
        upi_id: form.payment_method === 'upi' ? form.upi_id : null,
        transaction_id: form.payment_method === 'upi' ? form.transaction_id : null,
      });
      toast.success(`Purchase successful! Invoice: ${data.invoice_number} | Amount: ₹${data.total_amount.toFixed(2)}`);
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['farmer-seeds'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-seed-purchases'] });
    } catch (err) { toast.error(err.response?.data?.error || 'Purchase failed'); }
    finally { setSaving(false); }
  };

  const downloadInvoice = (p) => {
    const content = `AGRIFLOW ERP INVOICE\n\nInvoice Number: ${p.invoice_number}\nDate: ${new Date(p.created_at).toLocaleString('en-IN')}\nSeed Name: ${p.seed_name} (${p.variety})\nQuantity: ${p.quantity_kg} kg\nPrice: ₹${p.price_per_kg}/kg\nTotal Amount: ₹${p.total_amount}\nStatus: ${p.payment_status}\n\nThank you for using AgriFlow!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Invoice_${p.invoice_number}.txt`; a.click();
  };

  // Derive filter data
  const maxPrice = seeds.length > 0 ? Math.ceil(Math.max(...seeds.map(s => s.price_per_kg))) : 1000;
  const cropTypes = [...new Set(seeds.map(s => s.name?.split(' ')[1] || s.name?.split(' ')[0] || 'default'))].filter(c => c !== 'default');

  // Filter logic
  const filtered = seeds.filter(s => {
    const cropName = s.name?.split(' ')[1] || s.name?.split(' ')[0] || 'default';
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.variety?.toLowerCase().includes(search.toLowerCase());
    const matchesCrop = selectedCrops.length === 0 || selectedCrops.includes(cropName);
    const matchesPrice = s.price_per_kg <= (maxPriceFilter === 10000 ? maxPrice : maxPriceFilter);
    const matchesStock = !inStockOnly || s.stock_kg > 0;
    return matchesSearch && matchesCrop && matchesPrice && matchesStock;
  });

  const total = form.quantity_kg && selected ? (parseFloat(form.quantity_kg) * selected.price_per_kg).toFixed(2) : '0.00';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">{t('seed_purchase')}</h1><p className="page-subtitle">{t('seed_purchase_desc')}</p></div>
      </div>

      <div className="tab-nav">
        <button className={`tab-btn ${tab === 'browse' ? 'active' : ''}`} onClick={() => setTab('browse')}>{t('browse_seeds')}</button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>{t('purchase_history')} ({purchases.length})</button>
      </div>

      {tab === 'browse' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex items-center justify-between mb-2">
            <button onClick={() => setShowFilters(!showFilters)} className="btn-ghost flex items-center gap-2">
              <Filter size={18} /> {t('filters') || 'Filters'}
            </button>
          </div>

          {/* Sidebar Filters */}
          <div className={`lg:w-64 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="glass-card p-5 space-y-6 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800">{t('filters') || 'Filters'}</h3>
                <button onClick={() => { setMaxPriceFilter(10000); setSelectedCrops([]); setInStockOnly(false); }} className="text-xs text-primary-600 hover:underline">
                  {t('clear_all') || 'Clear All'}
                </button>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('price_range') || 'Price Range'}</h4>
                <div className="space-y-4">
                  <input type="range" min="0" max={maxPrice} 
                    value={maxPriceFilter === 10000 ? maxPrice : maxPriceFilter} 
                    onChange={e => setMaxPriceFilter(Number(e.target.value))}
                    className="w-full accent-primary-600" />
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>₹0</span>
                    <span>₹{maxPriceFilter === 10000 ? maxPrice : maxPriceFilter}</span>
                  </div>
                </div>
              </div>

              {/* Crop Type Filter */}
              {cropTypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('crop_type') || 'Crop Type'}</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {cropTypes.map(crop => (
                      <label key={crop} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" 
                          checked={selectedCrops.includes(crop)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedCrops([...selectedCrops, crop]);
                            else setSelectedCrops(selectedCrops.filter(c => c !== crop));
                          }}
                          className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 transition-colors cursor-pointer" />
                        <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{crop}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability Filter */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('availability') || 'Availability'}</h4>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" 
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 transition-colors cursor-pointer" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{t('in_stock_only') || 'In Stock Only'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Main Content (Grid & Search) */}
          <div className="flex-1">
            <div className="relative mb-6">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_seeds_placeholder')} className="input-field pl-10" />
            </div>
            
            {filtered.length === 0 ? (
              <div className="glass-card p-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Search size={24} className="text-gray-400" /></div>
                <h3 className="font-bold text-gray-800 mb-2">{t('no_seeds_found') || 'No seeds found'}</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
                <button onClick={() => { setMaxPriceFilter(10000); setSelectedCrops([]); setInStockOnly(false); setSearch(''); }} className="btn-ghost mt-4">
                  {t('clear_all') || 'Clear All Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(seed => {
                  const cropName = seed.name?.split(' ')[1] || seed.name?.split(' ')[0] || 'default';
                  const photoUrl = GRAIN_PHOTOS[cropName] || GRAIN_PHOTOS.default;
                  return (
                    <div key={seed.id} className="glass-card overflow-hidden hover-lift flex flex-col group">
                      <div className="h-32 bg-gray-100 overflow-hidden relative">
                        <img src={photoUrl} alt={seed.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-bold text-gray-800 leading-tight">{seed.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{seed.variety}</p>
                          </div>
                          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full shrink-0">{t('in_stock')}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 flex-1 leading-relaxed">{seed.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-2xl font-bold text-agro-green">₹{seed.price_per_kg}<span className="text-sm text-gray-400 font-normal">/kg</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{t('available')}</p>
                            <p className="text-sm font-semibold text-gray-700">{seed.stock_kg.toLocaleString()} kg</p>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full mb-4 overflow-hidden">
                          <div className={`h-full rounded-full ${seed.stock_kg > 1000 ? 'bg-green-500' : seed.stock_kg > 500 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(100, (seed.stock_kg / 5000) * 100)}%` }} />
                        </div>
                        <button onClick={() => openBuy(seed)} disabled={seed.stock_kg <= 0}
                          className="btn-primary flex items-center justify-center gap-2 mt-auto">
                          <ShoppingCart size={16} />{seed.stock_kg > 0 ? t('purchase') : t('out_of_stock')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="glass-card overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead><tr>
                <th>{t('seed_name')}</th><th>{t('quantity')}</th><th>{t('price_per_kg')}</th><th>{t('total_amount')}</th>
                <th>{t('upi_id')}</th><th>{t('transaction_id')}</th><th>{t('invoice')}</th><th>{t('status')}</th><th>{t('date')}</th>
              </tr></thead>
              <tbody>
                {purchases.length === 0
                  ? <tr><td colSpan={9} className="text-center py-10 text-gray-400">{t('no_purchases_yet')}</td></tr>
                  : purchases.map(p => (
                    <tr key={p.id}>
                      <td><p className="font-semibold">{p.seed_name}</p><p className="text-xs text-gray-400">{p.variety}</p></td>
                      <td>{p.quantity_kg} kg</td>
                      <td>₹{p.price_per_kg}</td>
                      <td className="font-bold text-gray-800">₹{p.total_amount.toLocaleString('en-IN')}</td>
                      <td className="text-xs">{p.upi_id || '-'}</td>
                      <td className="text-xs">{p.transaction_id || '-'}</td>
                      <td>{p.invoice_number ? (
                        <button onClick={() => downloadInvoice(p)} className="badge-blue text-[10px] flex items-center gap-1 hover:bg-blue-200 transition-colors">
                          {p.invoice_number} <Download size={10} />
                        </button>
                      ) : '-'}</td>
                      <td>
                        <span className={`badge ${p.payment_status === 'paid' ? 'badge-green' : p.payment_status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>
                          {p.payment_status === 'pending' ? 'Pay at Warehouse' : p.payment_status}
                        </span>
                      </td>
                      <td className="text-xs">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showModal && selected && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-xl">🌱</div>
                <div><h3 className="font-bold text-gray-800">{t('purchase')} {selected.name}</h3><p className="text-xs text-gray-500">₹{selected.price_per_kg}/kg</p></div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handlePurchase} className="modal-body space-y-4">
              <div>
                <label className="label">{t('quantity_kg')} *</label>
                <input type="number" value={form.quantity_kg} onChange={e => setForm(f => ({ ...f, quantity_kg: e.target.value }))}
                  className="input-field" placeholder={t('quantity_kg_placeholder')} min="1" max={selected.stock_kg} step="0.5" required />
                <p className="text-xs text-gray-400 mt-1">{t('max_available')}: {selected.stock_kg} kg</p>
              </div>
              {form.quantity_kg && (
                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                  <p className="text-sm font-semibold text-gray-700">{t('order_summary')}</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-500">{form.quantity_kg} kg × ₹{selected.price_per_kg}</span>
                    <span className="font-bold text-agro-green text-lg">₹{total}</span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="label">Payment Method</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label className={`border rounded-xl p-3 flex items-center gap-2 cursor-pointer transition-all ${form.payment_method === 'upi' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="payment_method" value="upi" checked={form.payment_method === 'upi'} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className="text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm font-medium text-gray-800">Pay Now (UPI)</span>
                  </label>
                  <label className={`border rounded-xl p-3 flex items-center gap-2 cursor-pointer transition-all ${form.payment_method === 'warehouse' ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="payment_method" value="warehouse" checked={form.payment_method === 'warehouse'} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className="text-amber-600 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-gray-800">Pay at Warehouse</span>
                  </label>
                </div>
                {form.payment_method === 'warehouse' && (
                  <p className="text-xs text-amber-700 bg-amber-100 p-2 rounded-lg mt-2 font-medium">
                    ⚠️ Stock will be reserved for 24 hours. If not paid at the warehouse, the order will be cancelled.
                  </p>
                )}
              </div>

              {form.payment_method === 'upi' && (
                <>
                  <div>
                    <label className="label">{t('upi_id')} *</label>
                    <input value={form.upi_id} onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))}
                      className="input-field" placeholder="farmer@upi" required />
                  </div>
                  <div>
                    <label className="label">{t('transaction_id')} *</label>
                    <input value={form.transaction_id} onChange={e => setForm(f => ({ ...f, transaction_id: e.target.value.replace(/\D/g, '') }))}
                      className="input-field" placeholder="UPI Transaction ID (12 digits)" required maxLength={12} pattern="\d{12}" />
                  </div>
                </>
              )}
            </form>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-ghost">{t('cancel')}</button>
              <button onClick={handlePurchase} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}
                {saving ? t('processing') : `${t('confirm_purchase')} ₹${total}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
