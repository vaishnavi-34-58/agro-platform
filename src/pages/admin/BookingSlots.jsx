import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api/axios';
import { Calendar, Search, CheckCircle, X, MapPin, Eye, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingSlots() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState(null);

  const { data: slots = [], isLoading: loading } = useQuery({
    queryKey: ['admin-booking-slots'],
    queryFn: async () => {
      const res = await api.get('/admin/booking-slots');
      return res.data;
    }
  });

  const handleAction = async (id, status) => {
    try {
      await api.patch(`/admin/booking-slots/${id}`, { status });
      toast.success(t('slot') + ' ' + status);
      queryClient.invalidateQueries({ queryKey: ['admin-booking-slots'] });
    } catch { toast.error(t('action_failed')); }
  };

  const handlePayFarmer = async (saleId) => {
    if (!saleId) return toast.error('No sale associated with this booking');
    try {
      await api.patch(`/admin/grain-sales/${saleId}/pay`);
      toast.success(t('payment_successful', 'Farmer paid successfully'));
      // Wait a moment and then maybe invalidate grain sales if we had it, but here just show toast
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Payment already processed or transaction not found');
      } else {
        toast.error(err.response?.data?.error || t('action_failed'));
      }
    }
  };

  const filtered = slots.filter(s => {
    const matchFilter = filter === 'all' || s.status === filter;
    const matchSearch = !search || s.farmer_name?.toLowerCase().includes(search.toLowerCase()) || s.grain_type?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusBadge = (s) => ({ pending: 'badge-yellow', confirmed: 'badge-green', completed: 'badge-blue', cancelled: 'badge-red' }[s] || 'badge-gray');

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">{t('booking_slot')}</h1><p className="page-subtitle">{t("manage_booking_desc")}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search_farmer_grain")} className="input-field pl-10" />
        </div>
        <div className="tab-nav mb-0 flex-shrink-0">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button key={s} className={`tab-btn capitalize ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead><tr>
              <th>{t("date")}</th><th>{t("farmer")}</th><th>{t("grain_qty")}</th><th>{t("warehouse")}</th><th>{t("delivery_address")}</th><th>{t("status")}</th><th>{t("actions")}</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-10"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></td></tr>
                : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">{t("no_booking_slots_found")}</td></tr>
                  : filtered.map(s => (
                    <tr key={s.id}>
                      <td className="font-semibold text-gray-800">{s.booking_date}</td>
                      <td><p className="font-semibold text-gray-800">{s.farmer_name}</p><p className="text-xs text-gray-500">{s.phone}</p></td>
                      <td><p className="font-medium">{s.grain_type}</p><p className="text-xs text-green-600 font-bold">{s.quantity_kg} kg</p></td>
                      <td><p className="text-sm font-medium">{s.warehouse_name}</p></td>
                      <td className="text-xs max-w-[150px] truncate"><MapPin size={12} className="inline mr-1 text-gray-400" />{s.delivery_address}</td>
                      <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => setSelectedSlot(s)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-primary-600 hover:bg-primary-50" title="Details"><Eye size={14} /></button>
                          {s.status === 'pending' && (
                            <>
                              <button onClick={() => handleAction(s.id, 'confirmed')} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200" title="Confirm"><CheckCircle size={14} /></button>
                              <button onClick={() => handleAction(s.id, 'cancelled')} className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200" title="Cancel"><X size={14} /></button>
                            </>
                          )}
                          {s.status === 'confirmed' && (
                            <button onClick={() => handleAction(s.id, 'completed')} className="btn-primary btn-sm">{t("mark_complete")}</button>
                          )}
                          {s.status === 'completed' && s.grain_sale_id && (
                            <button onClick={() => handlePayFarmer(s.grain_sale_id)} className="btn-sm bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 ml-2" title="Pay Farmer">
                              <DollarSign size={14} /> {t('pay')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {selectedSlot && (
        <div className="modal-overlay" onClick={() => setSelectedSlot(null)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-gray-800 text-lg">Booking Details</h3>
              <button onClick={() => setSelectedSlot(null)} className="btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 uppercase">Booking ID</p><p className="font-medium">#{selectedSlot.id}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Booked On</p><p className="font-medium">{new Date(selectedSlot.created_at).toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Delivery Date</p><p className="font-medium">{selectedSlot.booking_date}</p></div>
                {selectedSlot.grain_sale_id && <div><p className="text-xs text-gray-500 uppercase">Sale ID</p><p className="font-medium text-primary-600">#{selectedSlot.grain_sale_id}</p></div>}
                <div><p className="text-xs text-gray-500 uppercase">Farmer</p><p className="font-medium">{selectedSlot.farmer_name}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Phone</p><p className="font-medium">{selectedSlot.phone}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Grain Type</p><p className="font-medium">{selectedSlot.grain_type}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Quantity</p><p className="font-medium text-green-600">{selectedSlot.quantity_kg} kg</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Warehouse</p><p className="font-medium">{selectedSlot.warehouse_name}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Status</p><span className={`badge ${statusBadge(selectedSlot.status)}`}>{selectedSlot.status}</span></div>
                <div className="col-span-2"><p className="text-xs text-gray-500 uppercase">Delivery Address</p><p className="font-medium text-sm">{selectedSlot.delivery_address}</p></div>
                {selectedSlot.notes && <div className="col-span-2"><p className="text-xs text-gray-500 uppercase">Notes</p><p className="text-sm bg-gray-50 p-2 rounded-lg">{selectedSlot.notes}</p></div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
