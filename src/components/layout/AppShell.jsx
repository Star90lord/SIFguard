import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children, title, subtitle }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen text-slate-900 flex" style={{ backgroundColor: '#F4F7FA' }}>
      {/* Sidebar with responsive mobile drawer support */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="app-main flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          subtitle={subtitle}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
