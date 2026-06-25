import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api/axios';
import { Users, UserPlus, Shield, Activity, Crown, Search, Edit, X, CheckCircle, MapPin, Map, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ icon, value, label, color }) {
  return (
    <div className="glass-card p-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { t } = useTranslation();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['superadmin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/superadmin/dashboard');
      return res.data;
    }
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  const activityData = [
    { day: 'Mon', logins: 120, registrations: 12 }, { day: 'Tue', logins: 150, registrations: 15 },
    { day: 'Wed', logins: 180, registrations: 20 }, { day: 'Thu', logins: 170, registrations: 18 },
    { day: 'Fri', logins: 210, registrations: 25 }, { day: 'Sat', logins: 190, registrations: 10 },
    { day: 'Sun', logins: 230, registrations: 30 }
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div><h1 className="text-3xl font-bold text-gray-900">{t("system_overview")}</h1><p className="text-gray-500 mt-1">{t("platform_stats_desc")}</p></div>
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"><p className="text-xs text-gray-500">{t("system_status")}</p><p className="text-sm font-bold text-green-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> All Systems Operational</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={<Users size={24} className="text-blue-400" />} value={data?.farmers || 0} label={t("total_farmers")} color="bg-blue-500/20" />
        <StatCard icon={<Shield size={24} className="text-gold-400" />} value={data?.managers || 0} label={t("system_managers")} color="bg-gold-500/20" />
        <StatCard icon={<Activity size={24} className="text-green-400" />} value={data?.totalVisits || 0} label={t("farm_visits_recorded")} color="bg-green-500/20" />
        <StatCard icon={<Map size={24} className="text-purple-400" />} value={data?.warehouses || 0} label={t("active_warehouses")} color="bg-purple-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-gray-800 font-bold mb-6 flex items-center gap-2"><Activity size={18} className="text-gold-500" />{t("weekly_activity")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/><stop offset="95%" stopColor="#eab308" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1f2937' }} />
              <Area type="monotone" dataKey="logins" stroke="#eab308" fillOpacity={1} fill="url(#colorLogins)" name={t("daily_logins")} />
              <Area type="monotone" dataKey="registrations" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRegs)" name={t("new_farmers")} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-gray-800 font-bold mb-6 flex items-center gap-2"><Shield size={18} className="text-blue-500" />{t("recent_logins")}</h3>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><User size={14} /></div>
                <div className="flex-1"><p className="text-sm font-medium text-gray-800">{t("manager_user")} {i+1}</p><p className="text-[10px] text-gray-500">IP: 192.168.1.{10+i}</p></div>
                <p className="text-xs text-gray-500">{i === 0 ? 'Just now' : `${i*2} {t("hours_ago")}`}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
