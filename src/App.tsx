import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FileText, History, Settings as SettingsIcon } from 'lucide-react';
import { initAuth, googleSignIn, logout } from './firebase';
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
  const isAdmin = auth.currentUser?.email === 'tukukalandi@gmail.com';

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
      {isAdmin && (
        <Link 
          to="/admin" 
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${isActive('/admin') ? 'bg-slate-50 text-indigo-700 border-t-2 border-indigo-600' : 'text-red-100 hover:bg-red-800/50 hover:text-white'}`}
        >
          <ShieldCheck size={16} />
          Admin
        </Link>
      )}
    </nav>
  );
}

function EditViewLoader() {
  const { id } = useParams();
  const [bill, setBill] = useState<TDBillDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Very naive loading via list. We could optimize with getDoc, but list is fine for POC
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
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setNeedsAuth(false);
        setAuthInitialized(true);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setAuthInitialized(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      // Specific check for iframe popup blocker error
      if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed')) {
        setLoginError('Login popup was blocked by your browser. This often happens inside preview iframes. Please click the "Open App" or "Share" link at the top to open this app in a new tab.');
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
    setNeedsAuth(true);
  };

  if (!authInitialized) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p>Initializing...</p></div>;
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans border border-slate-200">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <FileText size={32} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">TD Commission</h1>
            <p className="text-slate-500 text-sm">Please sign in to save your bills to Google Sheets and Firebase.</p>
          </div>
          
          <button 
            onClick={handleLogin} 
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl font-medium transition shadow-sm"
          >
            <svg viewBox="0 0 48 48" className="w-6 h-6">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {loginError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm text-left border border-red-200 mt-4">
              <p className="font-semibold mb-1">Login Error</p>
              <p>{loginError}</p>
              {loginError.includes('new tab') && (
                <a href={window.location.href} target="_top" rel="noreferrer" className="inline-block mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-center w-full transition-colors">
                  Open App in New Tab
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
        {/* Header */}
        <header className="bg-red-700 text-white shadow-md sticky top-0 z-10 flex flex-col print:hidden">
          <div className="flex justify-between items-center p-3 sm:p-4 gap-2">
            
            {/* Left side: Title */}
            <div className="flex items-center gap-3 min-w-0">
               <div className="flex flex-col min-w-0">
                  <h1 className="text-base sm:text-2xl font-bold tracking-tight leading-tight truncate sm:whitespace-normal">
                    TD Commission Bill
                  </h1>
                  <span className="text-xs opacity-80 truncate block sm:hidden mt-0.5">{user?.email}</span>
               </div>
            </div>

            {/* Right side: User, Signout, India Post */}
            <div className="flex items-center gap-3 shrink-0">
               <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs opacity-80">Signed in</span>
                  <span className="text-sm font-semibold truncate max-w-[150px]">{user?.email}</span>
               </div>
               <button 
                onClick={handleLogout}
                className="text-xs bg-red-800 hover:bg-red-900 px-3 py-1.5 rounded transition font-medium border border-red-600 shadow-sm"
              >
                Sign out
              </button>
              <div className="bg-white p-1 rounded shadow-sm shrink-0">
                <img src="https://upload.wikimedia.org/wikipedia/en/3/32/India_Post.svg" alt="India Post" className="h-8 sm:h-12 w-auto object-contain" />
              </div>
            </div>
          </div>

          <div className="px-3 sm:px-4 overflow-x-auto flex-nowrap border-t border-red-800 pt-2 scrollbar-hide">
            <Navigation />
          </div>
        </header>

        <main className="max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 flex-1">
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
