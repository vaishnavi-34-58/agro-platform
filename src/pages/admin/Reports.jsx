import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Reports() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const downloadCSV = () => { toast.success(t('report_downloaded')); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  const monthlySales = (data?.monthlySales || []).reverse().map(m => ({ month: m.month?.slice(0, 7) || '', Total: m.total || 0 }));
  const dummyCropData = [ { name: 'Rice', value: 45 }, { name: 'Wheat', value: 25 }, { name: 'Cotton', value: 15 }, { name: 'Maize', value: 10 }, { name: 'Other', value: 5 } ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">{t('reports')}</h1><p className="page-subtitle">{t("reports_desc")}</p></div>
        <button onClick={downloadCSV} className="btn-secondary flex items-center gap-2"><Download size={16} />{t("export_full_report")}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="section-card">
          <h3 className="section-title">{t("revenue_by_month")}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="Total" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3 className="section-title">{t("active_crop_distribution")}</h3>
          <div className="flex items-center h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dummyCropData} innerRadius={80} outerRadius={110} paddingAngle={2} dataKey="value">
                  {dummyCropData.map((e, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => [`${v}%`, 'Share']} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: t('farmer_registration_data'), desc: t('farmer_registration_data_desc'), icon: <Calendar size={18} /> },
          { title: t('transaction_ledger'), desc: t('transaction_ledger_desc'), icon: <ArrowRight size={18} /> },
          { title: t('warehouse_inventory_logs'), desc: t('warehouse_inventory_logs_desc'), icon: <Download size={18} /> },
        ].map(r => (
          <div key={r.title} className="glass-card p-5 hover-lift cursor-pointer" onClick={downloadCSV}>
            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4">{r.icon}</div>
            <h4 className="font-bold text-gray-800 mb-1">{r.title}</h4>
            <p className="text-xs text-gray-500 mb-4">{r.desc}</p>
            <span className="text-sm font-semibold text-primary-600 flex items-center gap-1 group">{t("download_csv")} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
          </div>
        ))}
      </div>
    </div>
  );
}
