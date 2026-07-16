import React, { useEffect, useState } from 'react';
import { subscribeToBillsFromFirestore, updateBillStatus, deleteBill } from '../services';
import { TDBillDetails } from '../types';
import { Check, X, FileText, Download, Trash2, Eye } from 'lucide-react';
import { downloadCSV } from '../utils';
import { downloadPDF, getPDFBlobURL } from '../pdf';
import { auth } from '../firebase';

export default function AdminPortal() {
  const [bills, setBills] = useState<TDBillDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToBillsFromFirestore(
      undefined,
      undefined,
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
  }, []);

  const handleStatusUpdate = async (billId: string, status: 'Approved' | 'Rejected') => {
    if (confirm(`Are you sure you want to mark this bill as ${status}?`)) {
      await updateBillStatus(billId, status);
    }
  };

  const handleDelete = async (billId: string) => {
    if (confirm('Are you sure you want to permanently delete this bill?')) {
      await deleteBill(billId);
    }
  };

  if (!auth.currentUser || auth.currentUser.email !== 'tukukalandi@gmail.com') {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <FileText className="text-indigo-600" />
          Admin Portal - Verification Board
        </h2>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading bills...</div>
        ) : bills.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
            No bills submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Office Info</th>
                  <th className="px-6 py-3">Month/Year</th>
                  <th className="px-6 py-3">Entries</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bills.map(bill => (
                  <tr key={bill.id} className="bg-white hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{bill.bo}</div>
                      <div className="text-xs text-slate-500">{bill.so}</div>
                    </td>
                    <td className="px-6 py-4">
                      {bill.month} {bill.year}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{bill.entries.length} items</div>
                      <div className="text-xs text-slate-500">
                        ₹{bill.entries.reduce((sum, e) => sum + (Number(e.incentiveAmount) || 0), 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        bill.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                        bill.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {bill.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setPreviewUrl(getPDFBlobURL(bill))} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 hover:bg-blue-100 rounded" title="Preview PDF">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => downloadPDF(bill)} className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 hover:bg-indigo-100 rounded" title="Download PDF">
                          <Download size={18} />
                        </button>
                        {bill.status !== 'Approved' && (
                          <button onClick={() => handleStatusUpdate(bill.id!, 'Approved')} className="text-green-600 hover:text-green-800 p-1 bg-green-50 hover:bg-green-100 rounded" title="Approve">
                            <Check size={18} />
                          </button>
                        )}
                        {bill.status !== 'Rejected' && (
                          <button onClick={() => handleStatusUpdate(bill.id!, 'Rejected')} className="text-red-600 hover:text-red-800 p-1 bg-red-50 hover:bg-red-100 rounded" title="Reject">
                            <X size={18} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(bill.id!)} className="text-slate-600 hover:text-red-600 p-1 bg-slate-100 hover:bg-red-50 rounded" title="Delete">
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

      {previewUrl && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800 text-lg">Bill Preview</h3>
              <button onClick={() => setPreviewUrl(null)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4">
              <iframe src={previewUrl} className="w-full h-full rounded shadow-sm border border-slate-200 bg-white" title="PDF Preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
