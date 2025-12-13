import React, { useState, useEffect } from 'react';

export function Header() {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const guideHref = `${baseUrl}what-is-bimi/`;
  const toolsHref = `${baseUrl}tools/`;
  const dmarcHref = `${baseUrl}tools/dmarc/`;
  const bimiHref = `${baseUrl}tools/bimi/`;
  const spfDkimHref = `${baseUrl}tools/spf-dkim/`;
  
  // Simple check for home page to conditionally render "Converter" link
  const [isHome, setIsHome] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHome(window.location.pathname === baseUrl || window.location.pathname === baseUrl.slice(0, -1));
    }
  }, [baseUrl]);

  return (
    <header className="app-header">
      <a href={baseUrl} className="app-header-brand">
        <img
          src="/logo.png"
          alt="VerifyBIMI"
          className="app-logo"
          width="32"
          height="32"
        />
        <h1>VerifyBIMI</h1>
      </a>

      <div className="app-header-actions">
        {!isHome && (
            <a className="header-nav-link" href={baseUrl}>Converter</a>
        )}
        
        <a className="header-nav-link" href={guideHref}>Guide</a>

        <a className="header-cta" href={toolsHref}>BIMI Tools</a>
      </div>
    </header>
  );
}

