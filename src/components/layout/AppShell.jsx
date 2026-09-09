import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Fixed 240px Sidebar */}
      <Sidebar />

      {/* Main Workspace Area with offset */}
      <div className="app-main flex-1 flex flex-col min-w-0">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 px-8 py-7 sm:px-10 sm:py-8 lg:px-12 lg:py-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
