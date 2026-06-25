import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import api from '../../services/api/axios';
import { Users, Search, MapPin, Eye } from 'lucide-react';

export default function AllFarmers() {
  const { t } = useTranslation();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Reusing the admin API to get all farmers
    api.get('/admin/farmers').then(r => { setFarmers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = farmers.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.phone.includes(search));
  const activeCount = farmers.filter(f => f.status === 'active').length;
  const pendingCount = farmers.filter(f => f.status === 'pending').length;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div><h1 className="text-3xl font-bold text-gray-900">{t("global_farmer_directory")}</h1><p className="text-gray-500 mt-1">{t("global_farmer_directory_desc")}</p></div>
        <div className="flex gap-4">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-center shadow-sm"><p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{t("active")}</p><p className="text-xl font-bold text-green-500">{activeCount}</p></div>
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-center shadow-sm"><p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{t("pending")}</p><p className="text-xl font-bold text-yellow-500">{pendingCount}</p></div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search_by_name_phone")} className="input-field pl-11 py-3" />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("farmer_details")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("contact")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("location_land")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("status")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("joined_date")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t("view")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={6} className="text-center py-10"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                : filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">{t("no_farmers_found")}</td></tr>
                  : filtered.map(f => (
                    <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-semibold text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 font-bold">{f.name?.[0]}</div>
                        {f.name}
                      </td>
                      <td className="p-4 text-gray-600"><p>{f.phone}</p><p className="text-xs text-gray-400">{f.email || t('no_email')}</p></td>
                      <td className="p-4 text-gray-600"><p className="flex items-center gap-1 text-sm"><MapPin size={14} className="text-gray-400"/>{f.address || 'Unknown'}</p><p className="text-xs text-primary-600 ml-5 font-semibold">{f.acres_of_land || 0} {t("acres")}</p></td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${f.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{t(f.status)}</span>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">{new Date(f.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button className="p-2 bg-gray-100 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"><Eye size={16} /></button>
                      </td>
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
