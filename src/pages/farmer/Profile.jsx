import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api/axios';
import { User, CreditCard, Save, AlertCircle, CheckCircle, Edit3, Sprout, FileText, UploadCloud, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FarmerProfile() {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState(null);
  const [editPersonal, setEditPersonal] = useState(false);
  const [editBank, setEditBank] = useState(false);
  const [editAgri, setEditAgri] = useState(false);
  const [saving, setSaving] = useState(false);
  const [personalForm, setPersonalForm] = useState({});
  const [bankForm, setBankForm] = useState({});
  const [agriForm, setAgriForm] = useState({});
  const [docForm, setDocForm] = useState({});

  const { data: rawData, isLoading: loading } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: async () => {
      const res = await api.get('/farmer/profile');
      return res.data;
    }
  });

  useEffect(() => {
    if (rawData) {
      setProfile(rawData.profile);
      setPersonalForm({ name: rawData.user?.name, email: rawData.user?.email, address: rawData.profile?.address, acres_of_land: rawData.profile?.acres_of_land, crop_address: rawData.profile?.crop_address });
      setBankForm({ bank_name: rawData.profile?.bank_name || '', account_number: rawData.profile?.account_number || '', ifsc_code: rawData.profile?.ifsc_code || '', upi_id: rawData.profile?.upi_id || '' });
      setAgriForm({ soil_type: rawData.profile?.soil_type || '', irrigation_type: rawData.profile?.irrigation_type || '', primary_crop: rawData.profile?.primary_crop || '', secondary_crop: rawData.profile?.secondary_crop || '' });
      setDocForm({ aadhaar_card_url: rawData.profile?.aadhaar_card_url || '', bank_passbook_url: rawData.profile?.bank_passbook_url || '', land_ownership_url: rawData.profile?.land_ownership_url || '' });
    }
  }, [rawData]);

  const savePersonal = async () => {
    setSaving(true);
    try {
      await api.patch('/farmer/profile', personalForm);
      toast.success('Profile updated!');
      setEditPersonal(false);
      queryClient.invalidateQueries({ queryKey: ['farmer-profile'] }); 
      refreshProfile();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const saveAgri = async () => {
    setSaving(true);
    try {
      await api.patch('/farmer/profile', agriForm);
      toast.success('Agricultural details updated!');
      setEditAgri(false);
      queryClient.invalidateQueries({ queryKey: ['farmer-profile'] });
      refreshProfile();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Simulate Supabase upload
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      await new Promise(r => setTimeout(r, 1500)); // Fake network delay
      const mockUrl = `https://mock-supabase-storage.com/${Date.now()}_${file.name}`;
      
      setDocForm(prev => ({ ...prev, [field]: mockUrl }));
      await api.patch('/farmer/profile', { [field]: mockUrl });
      
      toast.success('File uploaded successfully', { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['farmer-profile'] });
      refreshProfile();
    } catch {
      toast.error('Upload failed', { id: toastId });
    }
  };

  const requestBankChange = async () => {
    if (!bankForm.bank_name || !bankForm.account_number || !bankForm.ifsc_code) return toast.error('Fill all bank fields');
    setSaving(true);
    try {
      await api.post('/farmer/bank-change-request', bankForm);
      toast.success('Bank change request submitted. Admin will review it.');
      setEditBank(false); 
      queryClient.invalidateQueries({ queryKey: ['farmer-profile'] });
    } catch { toast.error('Request failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <div><h1 className="page-title">{t('profile_settings')}</h1><p className="page-subtitle">{t('profile_settings_desc')}</p></div>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-green">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.phone}</p>
            <span className={`badge mt-1 ${user?.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>{user?.status}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2"><User size={16} />{t('personal_info')}</h3>
          <button onClick={() => setEditPersonal(v => !v)} className="btn-ghost btn-sm flex items-center gap-1">
            <Edit3 size={14} />{editPersonal ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editPersonal ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">{t('full_name')}</label><input value={personalForm.name || ''} onChange={e => setPersonalForm(f => ({ ...f, name: e.target.value }))} className="input-field" /></div>
              <div><label className="label">{t('email')}</label><input value={personalForm.email || ''} onChange={e => setPersonalForm(f => ({ ...f, email: e.target.value }))} className="input-field" type="email" /></div>
              <div className="col-span-2"><label className="label">{t('address')}</label><input value={personalForm.address || ''} onChange={e => setPersonalForm(f => ({ ...f, address: e.target.value }))} className="input-field" /></div>
              <div><label className="label">{t('acres_of_land')}</label><input type="number" value={personalForm.acres_of_land || ''} onChange={e => setPersonalForm(f => ({ ...f, acres_of_land: e.target.value }))} className="input-field" step="0.5" /></div>
              <div><label className="label">{t('farm_location')}</label><input value={personalForm.crop_address || ''} onChange={e => setPersonalForm(f => ({ ...f, crop_address: e.target.value }))} className="input-field" /></div>
            </div>
            <button onClick={savePersonal} disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={16} />{saving ? t('saving') : t('save_changes')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Email', value: user?.email || 'Not set' },
              { label: 'Phone', value: user?.phone },
              { label: 'Address', value: profile?.address || 'Not set' },
              { label: 'Acres of Land', value: profile?.acres_of_land ? `${profile.acres_of_land} acres` : 'Not set' },
              { label: 'Farm Location', value: profile?.crop_address || 'Not set' },
            ].map(f => (
              <div key={f.label} className="col-span-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{f.label}</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agricultural Details */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Sprout size={16} />{t('agri_details')}</h3>
          <button onClick={() => setEditAgri(v => !v)} className="btn-ghost btn-sm flex items-center gap-1">
            <Edit3 size={14} />{editAgri ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editAgri ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">{t('land_size')}</label><input type="number" value={personalForm.acres_of_land || ''} onChange={e => setPersonalForm(f => ({ ...f, acres_of_land: e.target.value }))} className="input-field" step="0.5" /></div>
              <div><label className="label">{t('soil_type')}</label><input value={agriForm.soil_type || ''} onChange={e => setAgriForm(f => ({ ...f, soil_type: e.target.value }))} className="input-field" placeholder="e.g. Black Cotton, Red" /></div>
              <div>
                <label className="label">{t('irrigation_type')}</label>
                <select value={agriForm.irrigation_type || ''} onChange={e => setAgriForm(f => ({ ...f, irrigation_type: e.target.value }))} className="input-field">
                  <option value="">Select...</option>
                  <option value="Drip">Drip</option>
                  <option value="Sprinkler">Sprinkler</option>
                  <option value="Flood">Flood</option>
                  <option value="Rainfed">Rainfed</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div><label className="label">{t('primary_crop')}</label><input value={agriForm.primary_crop || ''} onChange={e => setAgriForm(f => ({ ...f, primary_crop: e.target.value }))} className="input-field" placeholder="e.g. Cotton, Rice" /></div>
              <div className="col-span-2"><label className="label">{t('secondary_crop')}</label><input value={agriForm.secondary_crop || ''} onChange={e => setAgriForm(f => ({ ...f, secondary_crop: e.target.value }))} className="input-field" placeholder="Intercrop or rotation" /></div>
            </div>
            <button onClick={saveAgri} disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={16} />{saving ? t('saving') : t('save_changes')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Land Size', value: profile?.acres_of_land ? `${profile.acres_of_land} acres` : 'Not set' },
              { label: 'Soil Type', value: profile?.soil_type || 'Not set' },
              { label: 'Irrigation Type', value: profile?.irrigation_type || 'Not set' },
              { label: 'Primary Crop', value: profile?.primary_crop || 'Not set' },
              { label: 'Secondary Crop', value: profile?.secondary_crop || 'Not set' },
            ].map(f => (
              <div key={f.label} className="col-span-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{f.label}</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank Details */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2"><CreditCard size={16} />{t('bank_details')}</h3>
          <button onClick={() => setEditBank(v => !v)} className="btn-ghost btn-sm flex items-center gap-1">
            <Edit3 size={14} />{editBank ? 'Cancel' : 'Request Change'}
          </button>
        </div>

        {profile?.bank_status === 'pending' && (
          <div className="alert-warning mb-4 text-sm">
            <AlertCircle size={16} />{t('change_request_pending')}
          </div>
        )}

        {editBank ? (
          <div className="space-y-3">
            <div className="alert-warning text-xs"><AlertCircle size={14} />Bank detail changes require admin approval before taking effect.</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">{t('bank_name')}</label><input value={bankForm.bank_name} onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))} className="input-field" placeholder="e.g. SBI" /></div>
              <div><label className="label">{t('ifsc_code')}</label><input value={bankForm.ifsc_code} onChange={e => setBankForm(f => ({ ...f, ifsc_code: e.target.value.toUpperCase() }))} className="input-field" placeholder="e.g. SBIN0001234" /></div>
              <div className="col-span-2"><label className="label">{t('account_number')}</label><input type="text" value={bankForm.account_number} onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value }))} className="input-field" placeholder="Account number" /></div>
              <div className="col-span-2"><label className="label">{t('upi_id')}</label><input value={bankForm.upi_id} onChange={e => setBankForm(f => ({ ...f, upi_id: e.target.value }))} className="input-field" placeholder="yourname@upi" /></div>
            </div>
            <button onClick={requestBankChange} disabled={saving} className="btn-gold flex items-center gap-2">
              <CheckCircle size={16} />{saving ? 'Submitting...' : t('request_bank_change')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t('bank_name'), value: profile?.bank_name || 'Not set' },
              { label: t('ifsc_code'), value: profile?.ifsc_code || 'Not set' },
              { label: t('account_number'), value: profile?.account_number ? '••••••' + profile.account_number.slice(-4) : 'Not set' },
              { label: t('upi_id'), value: profile?.upi_id || 'Not set' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{f.label}</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{f.value}</p>
              </div>
            ))}
            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Approval Status</p>
              <span className={`badge mt-1 ${profile?.bank_status === 'approved' ? 'badge-green' : profile?.bank_status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>
                {profile?.bank_status || 'Not set'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Required Documents */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><FileText size={16} />{t('required_documents')}</h3>
        <div className="space-y-4">
          {[
            { id: 'aadhaar_card_url', label: t('aadhaar_card'), desc: 'PDF or Image format' },
            { id: 'bank_passbook_url', label: t('bank_passbook'), desc: 'Front page showing account details' },
            { id: 'land_ownership_url', label: t('land_ownership'), desc: 'Patta / RoR / Title Deed' },
          ].map(doc => (
            <div key={doc.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 text-sm">{doc.label}</p>
                <p className="text-xs text-gray-500">{doc.desc}</p>
                {docForm[doc.id] && (
                  <a href={docForm[doc.id]} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1 mt-1 hover:underline">
                    <LinkIcon size={12} /> View Uploaded Document
                  </a>
                )}
              </div>
              <div>
                <label className="btn-ghost btn-sm flex items-center gap-1 cursor-pointer">
                  <UploadCloud size={14} /> {docForm[doc.id] ? 'Re-upload' : 'Upload'}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*,.pdf" 
                    onChange={e => handleFileUpload(e, doc.id)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
