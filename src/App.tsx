import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FileText, History, Settings as SettingsIcon } from 'lucide-react';
import { User } from 'firebase/auth';

import BillForm from './components/BillForm';
import BillHistory from './components/BillHistory';
import Settings from './components/Settings';
import { getBillsFromFirestore } from './services';
import { TDBillDetails } from './types';
import { useParams } from 'react-router-dom';

import { ShieldCheck } from 'lucide-react';
import AdminPortal from './components/AdminPortal';
import { auth } from './firebase';

function Navigation() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const isAdmin = false; // We removed auth, but if you want to keep admin hardcoded or remove it, we can just hide it for now. Actually, let's keep it hidden.

  return (
    <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
      <Link 
        to="/" 
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${isActive('/') || isActive('/create') ? 'bg-slate-50 text-red-700 border-t-2 border-red-600' : 'text-red-100 hover:bg-red-800/50 hover:text-white'}`}
      >
        <FileText size={16} />
        New Bill
      </Link>
      <Link 
        to="/history" 
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${isActive('/history') ? 'bg-slate-50 text-red-700 border-t-2 border-red-600' : 'text-red-100 hover:bg-red-800/50 hover:text-white'}`}
      >
        <History size={16} />
        History
      </Link>
    </nav>
  );
}

function EditViewLoader() {
  const { id } = useParams();
  const [bill, setBill] = useState<TDBillDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const all = await getBillsFromFirestore();
      const found = all.find(b => b.id === id);
      setBill(found || null);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading bill...</div>;
  if (!bill) return <div className="p-8 text-center text-red-500">Bill not found!</div>;

  return <BillForm initialData={bill} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
        {/* Header */}
        <header className="bg-red-700 text-white shadow-md sticky top-0 z-10 flex flex-col print:hidden">
          <div className="flex justify-between items-center px-1 py-3 sm:px-2 sm:py-4 gap-2">
            
            {/* Left side: Title */}
            <div className="flex items-center gap-3 min-w-0">
               <div className="flex flex-col min-w-0">
                  <h1 className="text-base sm:text-2xl font-bold tracking-tight leading-tight truncate sm:whitespace-normal">
                    TD Commission Bill
                  </h1>
               </div>
            </div>

            {/* Right side: User, Signout, India Post */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white p-1 rounded shadow-sm shrink-0">
                <img src="https://upload.wikimedia.org/wikipedia/en/3/32/India_Post.svg" alt="India Post" className="h-8 sm:h-12 w-auto object-contain" />
              </div>
            </div>
          </div>

          <div className="px-3 sm:px-4 overflow-x-auto flex-nowrap border-t border-red-800 pt-2 scrollbar-hide">
            <Navigation />
          </div>
        </header>

        <main className="w-full py-8 flex-1">
          <Routes>
            <Route path="/" element={<BillForm />} />
            <Route path="/create" element={<BillForm />} />
            <Route path="/history" element={<BillHistory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/view/:id" element={<EditViewLoader />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-red-700 py-4 mt-auto text-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden">
          <p className="text-sm text-red-50 font-medium">Prepared by Kalandi Charan Sahoo, PA, Dhenkanal RS SO</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
