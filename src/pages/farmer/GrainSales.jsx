import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api/axios';
import { Wheat, Plus, X, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const GRAIN_TYPES = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Groundnut', 'Sugarcane'];
const GRADES = ['A', 'B', 'C'];

export default function GrainSales() {
  const { t } = useTranslation();
  const [sales, setSales] = useState([]);
  const [crops, setCrops] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    crop_id: '', grain_type: 'Rice', grade: 'A',
    raw_material_kg: '', wastage_kg: '', good_material_kg: ''
  });

  const load = async () => {
    const [s, c, r] = await Promise.all([api.get('/farmer/grain-sales'), api.get('/farmer/crops'), api.get('/farmer/market-rates')]);
    setSales(s.data); setCrops(c.data.filter(c => c.status === 'growing' || c.status === 'harvested')); setRates(r.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const getRate = (grain, grade) => rates.find(r => r.crop_type === grain && r.grade === grade)?.price_per_kg || 0;
  const estimated = form.good_material_kg ? (parseFloat(form.good_material_kg) * getRate(form.grain_type, form.grade)).toFixed(2) : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.good_material_kg) return toast.error(t('enter_good_material'));
    setSaving(true);
    try {
      const { data } = await api.post('/farmer/grain-sale', {
        crop_id: form.crop_id || null,
        grain_type: form.grain_type, grade: form.grade,
        raw_material_kg: parseFloat(form.raw_material_kg) || 0,
        wastage_kg: parseFloat(form.wastage_kg) || 0,
        good_material_kg: parseFloat(form.good_material_kg),
      });
      toast.success(`Grain sale submitted! Estimated: ₹${data.estimated_amount.toFixed(2)}`);
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Submission failed'); }
    finally { setSaving(false); }
  };

  const statusBadge = (s) => ({ pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', paid: 'badge-blue' }[s] || 'badge-gray');

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">{t('grain_sales')}</h1><p className="page-subtitle">{t('grain_sales_desc')}</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />{t('new_sale')}</button>
      </div>

      {/* Market Rates Quick View */}
      <div className="glass-card p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Info size={16} className="text-blue-500" />{t('todays_market_rates')}</h3>
        <div className="flex flex-wrap gap-3">
          {[...new Set(rates.map(r => r.crop_type))].slice(0, 5).map(ct => {
            const gradeA = rates.find(r => r.crop_type === ct && r.grade === 'A');
            return (
              <div key={ct} className="flex items-center gap-2 bg-primary-50 px-3 py-2 rounded-xl">
                <span className="text-sm font-medium text-gray-700">{ct}</span>
                <span className="badge-green text-[11px]">A: ₹{gradeA?.price_per_kg}/kg</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sales Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{t('my_grain_sales')}</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr>
              <th>{t('grain_type')}</th><th>{t('grade')}</th><th>{t('raw_material')} (kg)</th><th>{t('wastage')} (kg)</th>
              <th>{t('good_material')} (kg)</th><th>{t('price_per_kg')}</th><th>{t('amount')}</th><th>{t('status')}</th><th>{t('date')}</th>
            </tr></thead>
            <tbody>
              {sales.length === 0
                ? <tr><td colSpan={9} className="text-center py-10 text-gray-400">{t('no_grain_sales_yet')}</td></tr>
                : sales.map(s => (
                  <tr key={s.id}>
                    <td><p className="font-semibold">{s.grain_type}</p></td>
                    <td><span className={`badge ${s.grade === 'A' ? 'badge-green' : s.grade === 'B' ? 'badge-yellow' : 'badge-gray'}`}>Grade {s.grade}</span></td>
                    <td>{s.raw_material_kg} kg</td>
                    <td className="text-red-500">{s.wastage_kg} kg</td>
                    <td className="text-green-600 font-semibold">{s.good_material_kg} kg</td>
                    <td>₹{s.price_per_kg || 'TBD'}</td>
                    <td className="font-bold">₹{(s.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td className="text-xs">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sale Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><Wheat size={20} className="text-amber-600" /></div>
                <div><h3 className="font-bold text-gray-800">{t('submit_grain_sale')}</h3><p className="text-xs text-gray-500">{t('good_material_counts_desc')}</p></div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('grain_type')} *</label>
                  <select value={form.grain_type} onChange={e => setForm(f => ({ ...f, grain_type: e.target.value }))} className="input-field">
                    {GRAIN_TYPES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('grade')} *</label>
                  <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} className="input-field">
                    {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">{t('link_to_crop')}</label>
                <select value={form.crop_id} onChange={e => setForm(f => ({ ...f, crop_id: e.target.value }))} className="input-field">
                  <option value="">-- None --</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.crop_type} ({c.acres} acres, sowed {c.sowing_date})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">{t('raw_material')}</label>
                  <input type="number" value={form.raw_material_kg} onChange={e => setForm(f => ({ ...f, raw_material_kg: e.target.value }))}
                    className="input-field" placeholder="0" min="0" step="0.1" />
                </div>
                <div>
                  <label className="label">{t('wastage')}</label>
                  <input type="number" value={form.wastage_kg} onChange={e => setForm(f => ({ ...f, wastage_kg: e.target.value }))}
                    className="input-field" placeholder="0" min="0" step="0.1" />
                </div>
                <div>
                  <label className="label">{t('good_material')} *</label>
                  <input type="number" value={form.good_material_kg} onChange={e => setForm(f => ({ ...f, good_material_kg: e.target.value }))}
                    className="input-field" placeholder="0" min="0" step="0.1" required />
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{t('estimated_payment')}</p>
                    <p className="text-xs text-gray-500">{form.good_material_kg || 0} kg × ₹{getRate(form.grain_type, form.grade)}/kg (Grade {form.grade})</p>
                  </div>
                  <p className="text-2xl font-bold text-agro-green">₹{estimated}</p>
                </div>
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><Info size={12} />{t('wastage_note')}</p>
              </div>
            </form>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-ghost">{t('cancel')}</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-gold flex items-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}
                {saving ? t('submitting') : t('submit_sale_request')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
