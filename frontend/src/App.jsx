import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
          
          {/* Header containing selectors and dark mode */}
          <Header />

          {/* Main Content Area */}
          <div className="flex-grow">
            <Dashboard />
          </div>

          {/* Footer */}
          <Footer />

        </div>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
