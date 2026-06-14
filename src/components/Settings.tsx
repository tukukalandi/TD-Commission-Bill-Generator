import React, { useState, useEffect } from 'react';
import { getUserSettings, saveUserSettings } from '../services';

export default function Settings() {
  const [sheetId, setSheetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUserSettings().then(settings => {
      if (settings?.spreadsheetId) {
        setSheetId(settings.spreadsheetId);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveUserSettings(sheetId);
      alert('Settings saved successfully!');
    } catch (error: any) {
      alert('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Application Settings</h2>
        <p className="text-sm text-slate-500 mb-6">Configure integrations like Google Sheets.</p>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Google Sheet ID</label>
            <input 
              type="text" 
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              placeholder="e.g. 1BxiMvs0X15uQa_aWTKIGrE4h..."
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <p className="text-xs text-slate-500">
              You can find your Sheet ID in the URL of your Google Sheet: <br/>
              <code>https://docs.google.com/spreadsheets/d/<b>YOUR_SHEET_ID</b>/edit</code><br/>
              Make sure there is a tab named "Sheet1" in the spreadsheet!
            </p>
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="bg-red-600 hover:bg-red-500 disabled:bg-slate-400 text-white px-4 py-2 rounded-md font-medium shadow transition"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
