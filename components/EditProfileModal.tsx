import React, { useEffect, useState } from 'react';
import { Camera, LogOut, MapPin, Save, ShieldCheck, X } from 'lucide-react';
import { OCCUPATIONS, Occupation, User } from '../types';
import { getLiveLocation, getLocationErrorMessage } from '../utils/liveLocation';

interface Props {
  user: User | null;
  onClose: () => void;
  onUpdated: (user: User) => void;
  onLogout: () => void;
}

export const EditProfileModal: React.FC<Props> = ({ user, onClose, onUpdated, onLogout }) => {
  const [form, setForm] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({ ...user, username: user.username || user.email.split('@')[0], skills: user.skills || [] });
    setNewPassword('');
    setError('');
  }, [user]);

  if (!user) return null;
  const set = <K extends keyof User>(key: K, value: User[K]) => setForm((previous) => ({ ...previous, [key]: value }));

  const handlePhoto = (file?: File) => {
    if (!file || !file.type.startsWith('image/') || file.size > 3 * 1024 * 1024) { setError('Choose an image smaller than 3 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => set('profilePic', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const refreshLocation = async () => {
    setLocating(true); setError('');
    try {
      const position = await getLiveLocation();
      set('location', { lat: position.lat, lng: position.lng });
      const response = await fetch(`/api/location/reverse?lat=${position.lat}&lng=${position.lng}`);
      if (response.ok) {
        const data = await response.json();
        if (data.address) set('address', data.address);
        if (data.city) set('city', data.city);
      }
    } catch (reason) { setError(getLocationErrorMessage(reason)); }
    finally { setLocating(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name?.trim() || !form.username?.trim() || !form.phone?.trim() || !form.address?.trim() || !form.city?.trim()) { setError('Complete the required profile fields.'); return; }
    if (newPassword && newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/users/${user.id}/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, password: newPassword || undefined }) });
      const result = await response.json();
      if (response.ok && result.success) { onUpdated(result.user); onClose(); } else setError(result.error || 'Unable to save profile.');
    } catch { setError('Unable to save profile.'); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"><div className="mx-auto my-6 w-full max-w-2xl overflow-hidden rounded-3xl border border-[#E5E1D8] bg-[#F9F7F2] shadow-2xl"><div className="flex items-center justify-between border-b border-[#E5E1D8] bg-white p-6"><div><h2 className="text-xl font-bold text-[#2D2926]">Edit Profile</h2><p className="text-xs text-[#8C867E]">Update your registration information.</p></div><button type="button" aria-label="Close profile editor" onClick={onClose} className="rounded-xl bg-[#F1EDE4] p-2"><X className="h-5 w-5" /></button></div><form onSubmit={submit} className="max-h-[75vh] space-y-4 overflow-y-auto p-6">{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}<div className="flex items-center gap-4"><img src={form.profilePic || user.profilePic} alt="Profile" className="h-16 w-16 rounded-2xl object-cover" /><label className="cursor-pointer rounded-lg border border-[#E5E1D8] bg-white px-3 py-2 text-xs font-bold"><Camera className="mr-1 inline h-3.5 w-3.5" />Change photo<input type="file" accept="image/*" className="hidden" onChange={(event) => handlePhoto(event.target.files?.[0])} /></label></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Full name *" value={form.name || ''} onChange={(value) => set('name', value)} /><Field label="Username *" value={form.username || ''} onChange={(value) => set('username', value)} /><Field label="New password" type="password" value={newPassword} onChange={setNewPassword} /><Field label="Age *" type="number" value={String(form.age || '')} onChange={(value) => set('age', Number(value))} /><Field label="Mobile number *" value={form.phone || ''} onChange={(value) => set('phone', value)} /><Field label="Pincode" value={form.pincode || ''} onChange={(value) => set('pincode', value)} /><Field label="Address *" value={form.address || ''} onChange={(value) => set('address', value)} /><Field label="City / region *" value={form.city || ''} onChange={(value) => set('city', value)} /></div><div className="rounded-xl border border-[#D2E0D0] bg-[#EBF2EA] p-3 text-xs"><div className="flex items-center justify-between"><span className="font-bold text-[#5C6E58]"><MapPin className="mr-1 inline h-3.5 w-3.5" />Current location</span><button type="button" onClick={refreshLocation} disabled={locating} className="rounded-lg bg-[#5C6E58] px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-60">{locating ? 'Updating...' : 'Update location'}</button></div><p className="mt-1 text-[10px] text-[#8C867E]">{form.location ? `${form.location.lat.toFixed(5)}, ${form.location.lng.toFixed(5)}` : 'No location saved'}</p></div><div className="rounded-xl border border-[#E5E1D8] bg-white p-3 text-xs text-[#8C867E]"><ShieldCheck className="mr-1 inline h-4 w-4 text-[#5C6E58]" />Aadhaar: <strong>{user.aadhaarNumber}</strong> — locked and cannot be changed.</div>{user.role === 'worker' && <div className="space-y-3 border-t border-[#E5E1D8] pt-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-[#423E3B]">Occupation<select value={form.occupation || 'Carpenter'} onChange={(event) => set('occupation', event.target.value as Occupation)} className="mt-1 w-full rounded-xl border border-[#E5E1D8] bg-white px-3 py-2.5 text-sm">{OCCUPATIONS.map((occupation) => <option key={occupation}>{occupation}</option>)}</select></label><Field label="Skills (comma separated)" value={(form.skills || []).join(', ')} onChange={(value) => set('skills', value.split(',').map((skill) => skill.trim()).filter(Boolean))} /><Field label="Rate per hour" type="number" value={String(form.ratePerHour || '')} onChange={(value) => set('ratePerHour', Number(value))} /><Field label="Rate per month" type="number" value={String(form.ratePerMonth || '')} onChange={(value) => set('ratePerMonth', Number(value))} /><Field label="Experience (years)" type="number" value={String(form.experienceYears || '')} onChange={(value) => set('experienceYears', Number(value))} /></div><label className="block text-xs font-bold text-[#423E3B]">About<textarea value={form.bio || ''} onChange={(event) => set('bio', event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[#E5E1D8] bg-white px-3 py-2.5 text-sm font-normal" /></label></div>}<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"><p className="font-bold">Account access</p><p className="mt-1">Sign out of this account on this device.</p><button type="button" onClick={() => { onClose(); onLogout(); }} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 font-bold text-red-700 hover:bg-red-100"><LogOut className="h-3.5 w-3.5" />Log out</button></div><div className="flex justify-end gap-2 border-t border-[#E5E1D8] pt-4"><button type="button" onClick={onClose} className="rounded-xl border border-[#E5E1D8] px-4 py-2 text-xs font-bold">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-[#8B5E3C] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"><Save className="mr-1 inline h-3.5 w-3.5" />{saving ? 'Saving...' : 'Save changes'}</button></div></form></div></div>;
};

const Field: React.FC<{ label: string; value: string; type?: string; onChange: (value: string) => void }> = ({ label, value, type = 'text', onChange }) => <label className="block text-xs font-bold text-[#423E3B]">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-[#E5E1D8] bg-white px-3 py-2.5 text-sm font-normal" /></label>;
