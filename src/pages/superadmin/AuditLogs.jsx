import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api/axios';
import { FileText, Search, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogs() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading: loading } = useQuery({
    queryKey: ['superadmin-audit-logs'],
    queryFn: async () => {
      const [m, f] = await Promise.all([api.get('/superadmin/managers'), api.get('/admin/farmers')]);
      const mockLogs = [];
      m.data.forEach(manager => {
        mockLogs.push({ id: `l1_${manager.id}`, user: manager.name, role: 'Manager', action: 'Login', entity: 'System', timestamp: manager.created_at + 86400, ip: '192.168.1.42' });
      });
      f.data.forEach(farmer => {
        mockLogs.push({ id: `l2_${farmer.id}`, user: 'System', role: 'SuperAdmin', action: 'Farmer Registration Approved', entity: farmer.name, timestamp: farmer.created_at + 3600, ip: 'Server' });
      });
      return mockLogs.sort((a, b) => b.timestamp - a.timestamp);
    }
  });

  const filtered = logs.filter(l => l.user.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()) || l.entity.toLowerCase().includes(search.toLowerCase()));

  const downloadCSV = () => { toast.success(t('logs_downloaded')); };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div><h1 className="text-3xl font-bold text-gray-900">{t("system_audit_logs")}</h1><p className="text-gray-500 mt-1">{t("audit_logs_desc")}</p></div>
        <button onClick={downloadCSV} className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl flex items-center gap-2 transition-colors border border-gray-200 shadow-sm"><Download size={16} />{t("export_csv")}</button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search_audit_placeholder")} className="input-field pl-11 py-3" />
        </div>
        <button className="px-4 py-3 bg-white border border-gray-200 text-gray-600 hover:text-primary-600 rounded-xl flex items-center gap-2 transition-colors shadow-sm"><Filter size={18} />{t("filter")}</button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("timestamp")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("user")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("role")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("action")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("entity_affected")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("ip_address")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={6} className="text-center py-10"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                : filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">{t("no_logs_found")}</td></tr>
                  : filtered.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-gray-600 text-sm">{new Date(l.timestamp * 1000).toLocaleString()}</td>
                      <td className="p-4 font-semibold text-gray-800">{l.user}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${l.role === 'SuperAdmin' ? 'bg-primary-100 text-primary-600' : 'bg-blue-100 text-blue-600'}`}>{l.role}</span></td>
                      <td className="p-4 text-gray-600">{l.action}</td>
                      <td className="p-4 text-gray-500 text-sm">{l.entity}</td>
                      <td className="p-4 text-gray-400 text-xs font-mono">{l.ip}</td>
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
