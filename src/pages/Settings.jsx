import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

const Settings = () => {
  const { loggedInUser, customerProfiles, saveUserSettings, goBack } = useAppContext();
  const prof = loggedInUser?.email ? (customerProfiles[loggedInUser.email] || {}) : {};
  const [settings, setSettings] = useState({ notifyEmail: true, notifyWhatsApp: false });

  useEffect(() => {
    if (prof?.settings) setSettings({ ...settings, ...prof.settings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser?.email]);

  const onChange = (e) => setSettings({ ...settings, [e.target.name]: e.target.checked });
  const onSubmit = (e) => { e.preventDefault(); saveUserSettings(settings); };

  return (
    <section className="page-section p-4">
      <h2 className="text-xl font-bold text-brand-primary mb-4">Pengaturan</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="flex items-center gap-3">
          <input type="checkbox" name="notifyEmail" checked={!!settings.notifyEmail} onChange={onChange} />
          <span className="text-sm text-brand-text">Kirim update pesanan via Email</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="notifyWhatsApp" checked={!!settings.notifyWhatsApp} onChange={onChange} />
          <span className="text-sm text-brand-text">Kirim update pesanan via WhatsApp</span>
        </label>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={goBack} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Kembali</button>
          <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">Simpan</button>
        </div>
      </form>
    </section>
  );
};

export default Settings;

