import React, { useEffect, useState } from 'react';
import { subscribeToBillsFromFirestore, updateBillStatus, deleteBill } from '../services';
import { TDBillDetails } from '../types';
import { Check, X, FileText, Download, Trash2, Eye, LogOut, ShieldCheck } from 'lucide-react';
import { downloadCSV } from '../utils';
import { downloadPDF, getPDFBlobURL } from '../pdf';
import { auth, initAuth, googleSignIn, logout } from '../firebase';
import { User } from 'firebase/auth';

export default function AdminPortal() {
  const [bills, setBills] = useState<TDBillDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = initAuth(
      (user) => {
        setUser(user);
        setAuthInitialized(true);
      },
      () => {
        setUser(null);
        setAuthInitialized(true);
      }
    );
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && user.email === 'tukukalandi@gmail.com') {
      const unsubscribe = subscribeToBillsFromFirestore(
        undefined,
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
    }
  }, [user]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed')) {
        setLoginError('Login popup was blocked by your browser. Please click the "Open App" or "Share" link at the top to open this app in a new tab.');
      } else {
        setLoginError('An error occurred during sign in. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

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

  if (!authInitialized) {
    return <div className="p-8 text-center text-slate-500">Initializing...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-sm w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Portal</h2>
          <p className="text-slate-500 text-sm">Please sign in with the admin account to access this portal.</p>
          <button 
            onClick={handleLogin} 
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-lg font-medium transition shadow-sm"
          >
            <svg viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
          {loginError && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm text-left border border-red-200">
              {loginError}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (user.email !== 'tukukalandi@gmail.com') {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-500 font-bold text-xl">Access Denied</div>
        <p className="text-slate-600">You must be logged in as an administrator.</p>
        <button onClick={handleLogout} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded font-medium text-slate-700 transition">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-indigo-600" />
            Admin Portal - Verification Board
          </h2>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 font-medium transition bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

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
