import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, DownloadCloud, CloudUpload, FileDown } from 'lucide-react';
import { TDBillDetails, TDAccountEntry } from '../types';
import { generateId } from '../utils';
import { saveBillToFirestore, getUserSettings } from '../services';
import { appendToSheet, checkSheetAccess } from '../sheets';
import { useNavigate } from 'react-router-dom';
import { downloadPDF } from '../pdf';

export default function BillForm({ initialData }: { initialData?: TDBillDetails }) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [sheetSaving, setSheetSaving] = useState(false);
  
  const [details, setDetails] = useState<TDBillDetails>(initialData || {
    bo: '',
    so: 'Dhenkanal RS SO',
    ho: 'Dhenkanal HO',
    month: '',
    year: new Date().getFullYear().toString(),
    dateString: new Date().toISOString().split('T')[0],
    entries: [
      { id: generateId(), accountNo: '', prNo: '', depositorName: '', depositAmount: '', termOfDeposit: '', rateOfIncentive: '', incentiveAmount: '' }
    ]
  });

  const branchOffices = [
    "Suakhaikateni B.O",
    "Barada B.O",
    "Chaulia B.O",
    "Gengutia B.O",
    "Kankadpal B.O",
    "Korian B.O",
    "Mahisapat B.O",
    "Saptasajya B.O",
    "Shankarpur B.O",
    "Tarava B.O"
  ];

  const handleHeaderChange = (field: keyof TDBillDetails, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleEntryChange = (id: string, field: keyof TDAccountEntry, value: any) => {
    setDetails(prev => ({
      ...prev,
      entries: prev.entries.map(e => {
        if (e.id === id) {
          const updated = { ...e, [field]: value };
          if ((field === 'depositAmount' || field === 'rateOfIncentive') && 
               updated.depositAmount !== '' && updated.rateOfIncentive !== '') {
            const calculated = (Number(updated.depositAmount) * Number(updated.rateOfIncentive)) / 100;
            if (!isNaN(calculated)) {
               updated.incentiveAmount = calculated;
            }
          }
          return updated;
        }
        return e;
      })
    }));
  };

  const addEntry = () => {
    setDetails(prev => ({
      ...prev,
      entries: [...prev.entries, { id: generateId(), accountNo: '', prNo: '', depositorName: '', depositAmount: '', termOfDeposit: '', rateOfIncentive: '', incentiveAmount: '' }]
    }));
  };

  const removeEntry = (id: string) => {
    setDetails(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== id)
    }));
  };

  const saveAll = async () => {
    setIsSaving(true);
    let firebaseSuccess = false;
    let sheetSuccess = false;
    let errMsg = "";
    
    try {
      await saveBillToFirestore(details);
      firebaseSuccess = true;
    } catch (e: any) {
      errMsg += `Firebase Error: ${e.message}\n`;
    }
    
    try {
      const settings = await getUserSettings();
      if (settings?.spreadsheetId) {
        await checkSheetAccess(settings.spreadsheetId);
        await appendToSheet(settings.spreadsheetId, details);
        sheetSuccess = true;
      } else {
        errMsg += "Google Sheet ID not configured in Settings. Skipping Sheets save.\n";
      }
    } catch (e: any) {
      errMsg += `Google Sheets Error: ${e.message}\n`;
    }
    
    setIsSaving(false);
    
    if (firebaseSuccess && sheetSuccess) {
      alert('Bill successfully saved to Firebase and Google Sheets!');
      navigate('/history');
    } else if (firebaseSuccess) {
      alert('Saved to Firebase. ' + errMsg);
      navigate('/history');
    } else {
      alert('Failed to save:\n' + errMsg);
    }
  };

  const totalDeposit = details.entries.reduce((sum, e) => sum + (Number(e.depositAmount) || 0), 0);
  const totalIncentive = details.entries.reduce((sum, e) => sum + (Number(e.incentiveAmount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Bill Editor</h2>
          <p className="text-sm text-slate-500">Fill in the details for the monthly commission bill.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={saveAll}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white px-4 py-2 rounded-md font-medium shadow transition flex items-center gap-2"
          >
            <CloudUpload size={18} />
            {isSaving ? 'Saving...' : 'Save Data'}
          </button>
          <button 
            onClick={() => downloadPDF(details)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md font-medium shadow transition flex items-center gap-2"
          >
            <FileDown size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Office Details</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Branch Office (BO)</label>
            <select 
              value={details.bo} 
              onChange={(e) => handleHeaderChange('bo', e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="">Select BO</option>
              {branchOffices.map(bo => (
                <option key={bo} value={bo}>{bo}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Sub Office (SO)</label>
            <input 
              type="text" 
              value={details.so} 
              onChange={(e) => handleHeaderChange('so', e.target.value)}
              placeholder="Name of SO"
              readOnly
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Head Office (HO)</label>
            <input 
              type="text" 
              value={details.ho} 
              onChange={(e) => handleHeaderChange('ho', e.target.value)}
              placeholder="Name of HO"
              readOnly
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">For Month Of</label>
            <div className="flex gap-2">
              <select 
                value={details.month} 
                onChange={(e) => handleHeaderChange('month', e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                <option value="">Month</option>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select 
                value={details.year} 
                onChange={(e) => handleHeaderChange('year', e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                <option value="">Year</option>
                {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
            <input 
              type="date" 
              value={details.dateString} 
              onChange={(e) => handleHeaderChange('dateString', e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Deposit Accounts</h2>
          <button 
            onClick={addEntry}
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition"
          >
            <Plus size={16} />
            Add Row
          </button>
        </div>
        
        {/* Mobile View */}
        <div className="block md:hidden space-y-4 p-4 bg-slate-50/50">
          {details.entries.map((entry, index) => (
            <div key={entry.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 relative shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                <span className="font-bold text-slate-700">Entry #{index + 1}</span>
                <button 
                  onClick={() => removeEntry(entry.id)}
                  className="text-slate-400 hover:text-red-500 p-1 rounded transition"
                  title="Remove row"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Account No</label>
                  <input 
                    type="text" 
                    value={entry.accountNo} 
                    onChange={(e) => handleEntryChange(entry.id, 'accountNo', e.target.value)}
                    className="w-full border border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Acc No."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">PR No</label>
                  <input 
                    type="text" 
                    value={entry.prNo} 
                    onChange={(e) => handleEntryChange(entry.id, 'prNo', e.target.value)}
                    className="w-full border border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="PR No."
                  />
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <label className="text-xs text-slate-500 font-medium">Name of Depositor</label>
                <input 
                  type="text" 
                  value={entry.depositorName} 
                  onChange={(e) => handleEntryChange(entry.id, 'depositorName', e.target.value)}
                  className="w-full border border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Full Name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Deposit Amt</label>
                  <input 
                    type="number" 
                    value={entry.depositAmount} 
                    onChange={(e) => handleEntryChange(entry.id, 'depositAmount', e.target.value)}
                    className="w-full border border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Term</label>
                  <select 
                    value={entry.termOfDeposit} 
                    onChange={(e) => handleEntryChange(entry.id, 'termOfDeposit', e.target.value)}
                    className="w-full border border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="1 Year">1 Year</option>
                    <option value="2 Year">2 Year</option>
                    <option value="3 Year">3 Year</option>
                    <option value="5 Year">5 Year</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={entry.rateOfIncentive} 
                    onChange={(e) => handleEntryChange(entry.id, 'rateOfIncentive', e.target.value)}
                    className="w-full border border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="%"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Incentive Amt</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={entry.incentiveAmount} 
                    onChange={(e) => handleEntryChange(entry.id, 'incentiveAmount', e.target.value)}
                    className="w-full border border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium text-red-700"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="bg-red-50 rounded-lg p-4 border border-red-100 flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between items-center text-sm font-medium text-slate-700">
              <span>Total Deposit:</span>
              <span className="text-slate-900">{totalDeposit > 0 ? `₹${totalDeposit.toLocaleString()}` : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-base border-t border-red-200 pt-2 font-bold text-red-800">
              <span>Total Incentive:</span>
              <span>{totalIncentive > 0 ? `₹${totalIncentive.toLocaleString()}` : '-'}</span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">Sr.</th>
                <th className="px-4 py-3">Account No</th>
                <th className="px-4 py-3 w-28">PR No</th>
                <th className="px-4 py-3 min-w-[200px]">Name of Depositor</th>
                <th className="px-4 py-3 w-32">Deposit Amt</th>
                <th className="px-4 py-3 w-32">Term</th>
                <th className="px-4 py-3 w-32">Rate (%)</th>
                <th className="px-4 py-3 w-32">Incentive Amt</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.entries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 group">
                  <td className="px-4 py-3 text-center text-slate-500 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={entry.accountNo} 
                      onChange={(e) => handleEntryChange(entry.id, 'accountNo', e.target.value)}
                      placeholder="Acc No."
                      className="w-full border border-transparent hover:border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 bg-transparent focus:bg-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={entry.prNo} 
                      onChange={(e) => handleEntryChange(entry.id, 'prNo', e.target.value)}
                      placeholder="PR"
                      className="w-full border border-transparent hover:border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 bg-transparent focus:bg-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={entry.depositorName} 
                      onChange={(e) => handleEntryChange(entry.id, 'depositorName', e.target.value)}
                      placeholder="Full Name"
                      className="w-full border border-transparent hover:border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 bg-transparent focus:bg-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      value={entry.depositAmount} 
                      onChange={(e) => handleEntryChange(entry.id, 'depositAmount', e.target.value)}
                      placeholder="0"
                      className="w-full border border-transparent hover:border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 bg-transparent focus:bg-white text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select 
                      value={entry.termOfDeposit} 
                      onChange={(e) => handleEntryChange(entry.id, 'termOfDeposit', e.target.value)}
                      className="w-full border border-transparent hover:border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 bg-transparent focus:bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Year">2 Year</option>
                      <option value="3 Year">3 Year</option>
                      <option value="5 Year">5 Year</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      step="0.1"
                      value={entry.rateOfIncentive} 
                      onChange={(e) => handleEntryChange(entry.id, 'rateOfIncentive', e.target.value)}
                      placeholder="%"
                      className="w-full border border-transparent hover:border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 bg-transparent focus:bg-white text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      step="0.01"
                      value={entry.incentiveAmount} 
                      onChange={(e) => handleEntryChange(entry.id, 'incentiveAmount', e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-transparent hover:border-slate-300 focus:border-red-500 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 bg-transparent focus:bg-white font-medium text-right"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button 
                      onClick={() => removeEntry(entry.id)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                      title="Remove row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={4} className="px-4 py-4 text-right font-semibold text-slate-700">
                  Grand Total:
                </td>
                <td className="px-4 py-4 text-right font-bold text-slate-900 border-x border-slate-200/50">
                  {totalDeposit > 0 ? `₹${totalDeposit.toLocaleString()}` : '-'}
                </td>
                <td colSpan={2} className="px-4 py-4 border-r border-slate-200/50"></td>
                <td className="px-4 py-4 text-right font-bold text-red-700 bg-red-50/50 border-r border-slate-200/50">
                  {totalIncentive > 0 ? `₹${totalIncentive.toLocaleString()}` : '-'}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center">
          <button 
            onClick={addEntry}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:border-slate-400 px-4 py-2 rounded-md shadow-sm transition"
          >
            <Plus size={16} />
            Add Another Account
          </button>
        </div>
      </section>
    </div>
  );
}
