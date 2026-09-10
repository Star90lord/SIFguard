import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  size = 'md',
  fullWidth = false,
}) {
  const isSm = size === 'sm';

  return (
    <div
      role="tablist"
      className={`inline-flex p-1 bg-slate-100/90 border border-slate-200/80 rounded-lg select-none ${
        fullWidth ? 'w-full flex' : ''
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`flex items-center justify-center gap-2 font-semibold transition-all duration-150 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              fullWidth ? 'flex-1' : ''
            } ${
              isSm ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs'
            } ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
            }`}
          >
            {Icon && (
              <Icon
                size={isSm ? 13 : 15}
                className={isActive ? 'text-blue-600' : 'text-slate-400'}
                aria-hidden="true"
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
