import { useState } from 'react';

export function HostingTimeoutPage() {
  const [isReloading, setIsReloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleReload = () => {
    setIsReloading(true);
    setTimeout(() => {
      setIsReloading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa] dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] font-sans flex flex-col justify-between p-6 sm:p-12 md:p-20 selection:bg-blue-200 dark:selection:bg-blue-900">
      <div className="max-w-2xl mx-auto w-full pt-4 sm:pt-10">
        
        {/* Chrome Sad Tab / Network Warning Icon */}
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-[#5f6368] dark:text-[#9aa0a6]"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Chrome Gray Sad File Icon */}
            <path d="M12 4h16l12 12v28a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            <path d="M28 4v12h12" />
            {/* Sad Face */}
            <circle cx="18" cy="24" r="2" fill="currentColor" stroke="none" />
            <circle cx="30" cy="24" r="2" fill="currentColor" stroke="none" />
            <path d="M18 34c2-3 8-3 12 0" />
          </svg>
        </div>

        {/* Chrome Error Heading */}
        <h1 className="text-2xl sm:text-[26px] font-semibold text-[#202124] dark:text-[#e8eaed] leading-tight mb-4 tracking-normal">
          This site can't be reached
        </h1>

        {/* Primary error summary */}
        <p className="text-base text-[#5f6368] dark:text-[#bdc1c6] leading-relaxed mb-6 font-normal">
          The webpage hosting server responded with a 404 / Gateway Timeout error. The connection was reset or the server subscription has expired.
        </p>

        {/* Suggestions list like native Chrome */}
        <div className="text-sm text-[#5f6368] dark:text-[#bdc1c6] space-y-2 mb-8">
          <p className="font-medium text-[#3c4043] dark:text-[#e8eaed]">Try:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>Checking the connection</li>
            <li>Checking the proxy, firewall, and DNS configuration</li>
            <li>Contacting the website host administrator for domain renewal</li>
          </ul>
        </div>

        {/* Chrome Error Code */}
        <div className="text-xs font-mono text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-8 select-all">
          ERR_CONNECTION_TIMED_OUT &bull; HTTP 404 HOSTING TIMEOUT
        </div>

        {/* Buttons & Collapsible Details */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleReload}
            disabled={isReloading}
            className="bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] text-white text-sm font-medium px-6 py-2.5 rounded-md transition-colors cursor-pointer shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center min-w-[100px]"
          >
            {isReloading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Reloading...
              </span>
            ) : (
              'Reload'
            )}
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-[#1a73e8] dark:text-[#8ab4f8] hover:underline font-medium cursor-pointer"
          >
            {showDetails ? 'Hide details' : 'Details'}
          </button>
        </div>

        {/* Collapsible Details Box (Chrome style) */}
        {showDetails && (
          <div className="mt-6 p-4 rounded-md bg-[#f1f3f4] dark:bg-[#2d2e31] border border-[#dadce0] dark:border-[#3c4043] text-xs text-[#5f6368] dark:text-[#bdc1c6] font-mono leading-relaxed space-y-2">
            <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'https://localhost'}</p>
            <p><strong>STATUS:</strong> 404 / 504 Gateway Timeout</p>
            <p><strong>RESPONSE:</strong> Server did not send any data or hosting contract is expired.</p>
            <p><strong>CLIENT IP:</strong> 127.0.0.1</p>
          </div>
        )}
      </div>

      {/* Chrome Footer spacer */}
      <footer className="max-w-2xl mx-auto w-full pt-12 text-xs text-[#9aa0a6]">
        {/* Intentionally minimal like Google Chrome */}
      </footer>
    </div>
  );
}
