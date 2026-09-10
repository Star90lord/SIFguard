import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children, title, subtitle }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#E9ECEF] dark:bg-[#070B12] text-[#0F172A] dark:text-[#F8FAFC] flex overflow-x-hidden transition-colors duration-150">
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
        <main className="flex-1 w-full min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
