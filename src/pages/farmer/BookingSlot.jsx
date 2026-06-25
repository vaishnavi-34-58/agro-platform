import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api/axios';
import { Calendar, Plus, X, CheckCircle, Warehouse, AlertTriangle, Eye, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const GRAIN_TYPES = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Groundnut', 'Sugarcane'];

export default function BookingSlot() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    grain_sale_id: '', booking_date: '', delivery_address: '',
    grain_type: 'Rice', warehouse_id: '', quantity_kg: '', warehouse_slot_id: ''
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['farmer-booking-slots'],
    queryFn: async () => { const res = await api.get('/farmer/booking-slots'); return res.data; }
  });
  const { data: warehouses = [], isLoading: whLoading } = useQuery({
    queryKey: ['farmer-warehouses'],
    queryFn: async () => { const res = await api.get('/farmer/warehouses'); return res.data; }
  });
  const { data: allGrainSales = [], isLoading: gsLoading } = useQuery({
    queryKey: ['farmer-grain-sales'],
    queryFn: async () => { const res = await api.get('/farmer/grain-sales'); return res.data; }
  });

  const grainSales = allGrainSales.filter(g => g.status === 'approved');
  const loading = slotsLoading || whLoading || gsLoading;

  const { data: availableSlots = [], isLoading: slotsLoadingStatus } = useQuery({
    queryKey: ['farmer-warehouse-slots', form.warehouse_id, form.booking_date],
    queryFn: async () => {
      const res = await api.get(`/farmer/warehouse-slots?warehouse_id=${form.warehouse_id}&date=${form.booking_date}`);
      return res.data;
    },
    enabled: !!form.warehouse_id && !!form.booking_date
  });

  const selectedSlotData = availableSlots.find(s => s.id === parseInt(form.warehouse_slot_id));
  const available_kg = selectedSlotData ? (selectedSlotData.total_capacity_kg - selectedSlotData.booked_capacity_kg) : null;
  const capacityWarning = form.quantity_kg && available_kg !== null && parseFloat(form.quantity_kg) > available_kg;

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.warehouse_slot_id) return toast.error('Please select a time slot');
    if (capacityWarning) return toast.error(`Insufficient slot capacity! Available: ${available_kg.toFixed(0)} kg`);
    if (!form.booking_date || !form.delivery_address || !form.warehouse_id || !form.quantity_kg) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      await api.post('/farmer/booking-slot', {
        grain_sale_id: form.grain_sale_id || null,
        booking_date: form.booking_date,
        delivery_address: form.delivery_address,
        grain_type: form.grain_type,
        warehouse_id: parseInt(form.warehouse_id),
        quantity_kg: parseFloat(form.quantity_kg),
        warehouse_slot_id: parseInt(form.warehouse_slot_id)
      });
      toast.success('Booking slot created! Awaiting manager confirmation.');
      setShowModal(false); 
      queryClient.invalidateQueries({ queryKey: ['farmer-booking-slots'] });
    } catch (err) { toast.error(err.response?.data?.error || 'Booking failed'); }
    finally { setSaving(false); }
  };

  const statusBadge = (s) => ({ pending: 'badge-yellow', confirmed: 'badge-green', completed: 'badge-blue', cancelled: 'badge-red' }[s] || 'badge-gray');

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">{t('booking_slot')}</h1><p className="page-subtitle">{t('booking_slot_desc')}</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Book Slot</button>
      </div>

      {/* Warehouse Capacity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {warehouses.map(w => {
          const pct = (w.current_load_kg / w.total_capacity_kg) * 100;
          return (
            <div key={w.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{w.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{w.address}</p>
                </div>
                <Warehouse size={20} className="text-primary-500" />
              </div>
              <div className="warehouse-bar mb-2">
                <div className={`${pct > 80 ? 'warehouse-fill-red' : pct > 60 ? 'warehouse-fill-yellow' : 'warehouse-fill-green'}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Used: {(w.current_load_kg / 1000).toFixed(0)}T</span>
                <span className="font-semibold text-primary-700">Available: {(w.available_kg / 1000).toFixed(0)}T</span>
                <span>Total: {(w.total_capacity_kg / 1000).toFixed(0)}T</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking History */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-gray-100"><h3 className="font-semibold">{t('my_booking_slots')}</h3></div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr>
              <th>{t('date')}</th><th>{t('grain_type')}</th><th>{t('quantity')}</th><th>{t('warehouse')}</th><th>{t('delivery_address')}</th><th>{t('status')}</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {slots.length === 0
                ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">{t('no_slots_booked_yet')}</td></tr>
                : slots.map(s => (
                  <tr key={s.id}>
                    <td className="font-semibold">{s.booking_date}</td>
                    <td>{s.grain_type}</td>
                    <td>{s.quantity_kg} kg</td>
                    <td><p className="font-medium">{s.warehouse_name}</p></td>
                    <td className="text-xs">{s.delivery_address}</td>
                    <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td>
                      <button onClick={() => setSelectedSlot(s)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-primary-600 hover:bg-primary-50" title="Details"><Eye size={14} /></button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Calendar size={20} className="text-purple-600" /></div>
                <div><h3 className="font-bold text-gray-800">{t('book_slot')}</h3><p className="text-xs text-gray-500">{t('schedule_grain_delivery')}</p></div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleBook} className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('grain_type')} *</label>
                  <select value={form.grain_type} onChange={e => setForm(f => ({ ...f, grain_type: e.target.value }))} className="input-field">
                    {GRAIN_TYPES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('booking_date')} *</label>
                  <input type="date" value={form.booking_date} onChange={e => setForm(f => ({ ...f, booking_date: e.target.value, warehouse_slot_id: '' }))}
                    className="input-field" min={new Date().toISOString().split('T')[0]} required />
                </div>
              </div>
              <div>
                <label className="label">Link to Grain Sale</label>
                <select value={form.grain_sale_id} onChange={e => setForm(f => ({ ...f, grain_sale_id: e.target.value }))} className="input-field">
                  <option value="">-- None --</option>
                  {grainSales.map(g => <option key={g.id} value={g.id}>{g.grain_type} Grade {g.grade} - {g.good_material_kg}kg</option>)}
                </select>
              </div>
              <div>
                <label className="label">Warehouse *</label>
                <select value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value, warehouse_slot_id: '' }))} className="input-field" required>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} (Available: {(w.available_kg / 1000).toFixed(0)}T)</option>)}
                </select>
              </div>

              {form.warehouse_id && form.booking_date && (
                <div>
                  <label className="label">Select Time Slot *</label>
                  {slotsLoadingStatus ? (
                    <div className="text-sm text-gray-500 animate-pulse">Loading slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-sm text-red-500">No time slots available for this date and warehouse.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableSlots.map(slot => {
                        const isFull = parseFloat(slot.booked_capacity_kg) >= parseFloat(slot.total_capacity_kg);
                        const pct = (parseFloat(slot.booked_capacity_kg) / parseFloat(slot.total_capacity_kg)) * 100;
                        const isFillingFast = pct > 75 && !isFull;
                        const isSelected = form.warehouse_slot_id === slot.id.toString();
                        
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setForm(f => ({ ...f, warehouse_slot_id: slot.id.toString() }))}
                            className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all
                              ${isFull ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' : 
                                isSelected ? 'bg-primary-50 border-primary-500 ring-2 ring-primary-200' : 'bg-white border-gray-200 hover:border-primary-300'}`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-semibold text-gray-800 text-sm">{slot.start_time} - {slot.end_time}</span>
                              {isFull ? <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">FULL</span> :
                               isFillingFast ? <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">FILLING FAST</span> :
                               <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">AVAILABLE</span>}
                            </div>
                            <span className="text-xs text-gray-500">{slot.total_capacity_kg - slot.booked_capacity_kg} kg available</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {form.warehouse_slot_id && (
                <div>
                  <label className="label">Quantity (kg) *</label>
                  <input type="number" value={form.quantity_kg} onChange={e => setForm(f => ({ ...f, quantity_kg: e.target.value }))}
                    className={`input-field ${capacityWarning ? 'input-error' : ''}`} placeholder="Quantity in kg" min="1" required />
                  {capacityWarning && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} />Exceeds available capacity ({available_kg?.toFixed(0)} kg available)
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="label">{t('delivery_address')} *</label>
                <input value={form.delivery_address} onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))}
                  className="input-field" placeholder="Pickup/delivery address" required />
              </div>
            </form>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-ghost">{t('cancel')}</button>
              <button onClick={handleBook} disabled={saving || capacityWarning} className="btn-primary flex items-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}
                {saving ? t('booking') : t('confirm_booking')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
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
                <div><p className="text-xs text-gray-500 uppercase">Date</p><p className="font-medium">{selectedSlot.booking_date}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Grain Type</p><p className="font-medium">{selectedSlot.grain_type}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Quantity</p><p className="font-medium text-green-600">{selectedSlot.quantity_kg} kg</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Warehouse</p><p className="font-medium">{selectedSlot.warehouse_name}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Status</p><span className={`badge ${statusBadge(selectedSlot.status)}`}>{selectedSlot.status}</span></div>
                <div className="col-span-2"><p className="text-xs text-gray-500 uppercase">Delivery Address</p><p className="font-medium text-sm">{selectedSlot.delivery_address}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
