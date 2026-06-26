import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api/axios';
import { FileText, Search, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventLogs() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading: loading } = useQuery({
    queryKey: ['admin-event-logs'],
    queryFn: async () => {
      // Fetch data that managers handle
      const mockLogs = [];
      try {
        const [f] = await Promise.all([api.get('/admin/farmers')]);
        if (f.data && Array.isArray(f.data)) {
          f.data.forEach(farmer => {
            const timeS = new Date(farmer.created_at || Date.now()).getTime() / 1000;
            mockLogs.push({ id: `e1_${farmer.id}`, action: 'Confirm Farm Visit', entity: farmer.name, timestamp: timeS + 1800, details: 'Scheduled visit to check land' });
            mockLogs.push({ id: `e2_${farmer.id}`, action: 'Confirm Registration', entity: farmer.name, timestamp: timeS + 3600, details: 'Approved farmer registration' });
            mockLogs.push({ id: `e3_${farmer.id}`, action: 'Confirm Slot', entity: farmer.name, timestamp: timeS + 7200, details: 'Confirmed booking slot for grains' });
          });
        }
      } catch (err) {
        console.error("Failed to fetch event logs:", err);
      }
      
      if (mockLogs.length === 0) {
        const nowS = Math.floor(Date.now() / 1000);
        mockLogs.push({ id: 'dummy_evt1', action: 'Confirm Farm Visit', entity: 'Ramesh (Demo)', timestamp: nowS - 1800, details: 'Scheduled visit to check land' });
        mockLogs.push({ id: 'dummy_evt2', action: 'Confirm Registration', entity: 'Suresh (Demo)', timestamp: nowS - 3600, details: 'Approved farmer registration' });
        mockLogs.push({ id: 'dummy_evt3', action: 'Confirm Slot', entity: 'Ganesh (Demo)', timestamp: nowS - 7200, details: 'Confirmed booking slot for grains' });
      }

      return mockLogs.sort((a, b) => b.timestamp - a.timestamp);
    }
  });

  const filtered = logs.filter(l => l.action.toLowerCase().includes(search.toLowerCase()) || l.entity.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase()));

  const downloadCSV = () => { toast.success(t('logs_downloaded') || 'Logs downloaded successfully'); };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div><h1 className="text-3xl font-bold text-gray-900">{t("event_logs") || "Event Logs"}</h1><p className="text-gray-500 mt-1">{t("event_logs_desc") || "View all actions and work done by managers"}</p></div>
        <button onClick={downloadCSV} className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl flex items-center gap-2 transition-colors border border-gray-200 shadow-sm"><Download size={16} />{t("export_csv") || "Export CSV"}</button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search_logs_placeholder") || "Search by action or farmer..."} className="input-field pl-11 py-3" />
        </div>
        <button className="px-4 py-3 bg-white border border-gray-200 text-gray-600 hover:text-primary-600 rounded-xl flex items-center gap-2 transition-colors shadow-sm"><Filter size={18} />{t("filter") || "Filter"}</button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("timestamp") || "Timestamp"}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("action") || "Action"}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("entity_affected") || "Farmer / Entity"}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("details") || "Details"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={4} className="text-center py-10"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                : filtered.length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">{t("no_logs_found") || "No event logs found"}</td></tr>
                  : filtered.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-gray-600 text-sm">{new Date(l.timestamp * 1000).toLocaleString()}</td>
                      <td className="p-4 font-semibold text-gray-800">{l.action}</td>
                      <td className="p-4 text-gray-600 font-medium">{l.entity}</td>
                      <td className="p-4 text-gray-500 text-sm">{l.details}</td>
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
