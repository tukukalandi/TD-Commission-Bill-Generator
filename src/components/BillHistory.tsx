import React, { useEffect, useState } from 'react';
import { subscribeToBillsFromFirestore, deleteBill, getBillsFromFirestore } from '../services';
import { TDBillDetails } from '../types';
import { Eye, Trash2, FileText, Search, Download, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { downloadCSV } from '../utils';
import { downloadPDF } from '../pdf';

export default function BillHistory() {
  const [bills, setBills] = useState<TDBillDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [boFilter, setBoFilter] = useState('');
  
  const [appliedMonthFilter, setAppliedMonthFilter] = useState('');
  const [appliedYearFilter, setAppliedYearFilter] = useState('');
  const [appliedBoFilter, setAppliedBoFilter] = useState('');

  const [availableBOs, setAvailableBOs] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch unique BOs once for the dropdown
    async function fetchBOs() {
      const allBills = await getBillsFromFirestore();
      const bos = new Set<string>();
      allBills.forEach(b => {
        if (b.bo && b.bo.trim() !== '') {
          bos.add(b.bo.trim().toUpperCase());
        }
      });
      setAvailableBOs(Array.from(bos).sort());
    }
    fetchBOs();
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToBillsFromFirestore(
      appliedMonthFilter,
      appliedYearFilter,
      appliedBoFilter,
      (data) => {
        setBills(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [appliedMonthFilter, appliedYearFilter, appliedBoFilter]);

  const handleSearch = () => {
    setAppliedMonthFilter(monthFilter);
    setAppliedYearFilter(yearFilter);
    setAppliedBoFilter(boFilter);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this bill?')) {
      await deleteBill(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Bill History</h2>
          <p className="text-sm text-slate-500">View and manage previously generated bills.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
          <select 
            value={boFilter} 
            onChange={(e) => setBoFilter(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white min-w-[150px] w-full sm:w-auto"
          >
            <option value="">All Branch Offices (BO)</option>
            {availableBOs.map(bo => (
              <option key={bo} value={bo}>{bo}</option>
            ))}
          </select>
          <select 
            value={monthFilter} 
            onChange={(e) => setMonthFilter(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white w-full sm:w-auto"
          >
            <option value="">All Months</option>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select 
            value={yearFilter} 
            onChange={(e) => setYearFilter(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white w-full sm:w-auto"
          >
            <option value="">All Years</option>
            {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition w-full sm:w-auto"
          >
            <Search size={16} />
            <span className="sm:hidden">Search</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading bills...</div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <FileText size={48} className="text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700">No bills found</h3>
            <p className="text-slate-500 mb-6">No commission bills matched your filters.</p>
            <button onClick={() => navigate('/create')} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-500 transition">
              Create New Bill
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-slate-100 text-xs text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Office Info</th>
                <th className="px-6 py-3">Month / Year</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Entries</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map(bill => (
                <tr key={bill.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">BO: {bill.bo || 'N/A'}</div>
                    <div className="text-xs text-slate-600 font-medium">SO: {bill.so || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {bill.month || '-'} {bill.year || '-'}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {bill.dateString}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                      {bill.entries.length} items
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      bill.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                      bill.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {bill.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => downloadCSV(bill)} className="text-green-600 hover:text-green-800 p-1 bg-green-50 hover:bg-green-100 rounded" title="Download CSV">
                         <Download size={18} />
                       </button>
                       <button onClick={() => downloadPDF(bill)} className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 hover:bg-indigo-100 rounded" title="Download PDF">
                         <FileDown size={18} />
                       </button>
                       <button onClick={() => navigate(`/view/${bill.id}`)} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 hover:bg-blue-100 rounded" title="Edit/View details">
                         <Eye size={18} />
                       </button>
                       <button onClick={() => handleDelete(bill.id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 hover:bg-red-100 rounded" title="Delete bill">
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
