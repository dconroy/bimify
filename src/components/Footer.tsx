import { useMemo } from 'react';

export function Footer() {
  const baseUrl = import.meta.env.BASE_URL || '/';
  
  const links = {
    home: baseUrl,
    tools: {
      home: `${baseUrl}tools/`,
      bimi: `${baseUrl}tools/bimi/`,
      dmarc: `${baseUrl}tools/dmarc/`,
      spfDkim: `${baseUrl}tools/spf-dkim/`,
    },
    guides: {
      root: `${baseUrl}blog/`,
      whatIsBimi: `${baseUrl}what-is-bimi/`,
      gmail: `${baseUrl}blog/gmail-bimi-requirements/`,
      yahoo: `${baseUrl}blog/yahoo-bimi-requirements/`,
      vsDmarc: `${baseUrl}blog/bimi-vs-dmarc/`,
      vmc: `${baseUrl}blog/do-you-need-a-vmc/`,
    },
  };

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>VerifyBIMI</h3>
          <p>
            The free, browser-based BIMI implementation suite. 
            Convert logos, validate records, and troubleshoot your email authentication setup without uploading sensitive data.
          </p>
          <div className="footer-github">
            <a 
              href="https://github.com/dconroy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="github-profile-link"
            >
              <img 
                src="https://github.com/dconroy.png" 
                alt="dconroy"
                className="github-avatar"
                width="24"
                height="24"
                loading="lazy"
                decoding="async"
              />
              <span>Built by dconroy</span>
            </a>
            <a
              href="https://github.com/dconroy/verifybimi.com/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="github-issues-link"
            >
              Report an issue
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Free Tools</h3>
          <ul className="footer-links">
            <li>
              <a href={links.home}>BIMI SVG Converter</a>
            </li>
            <li>
              <a href={links.tools.bimi}>BIMI Record Checker</a>
            </li>
            <li>
              <a href={links.tools.dmarc}>DMARC Verifier</a>
            </li>
            <li>
              <a href={links.tools.spfDkim}>SPF & DKIM Checker</a>
            </li>
            <li>
              <a href={links.tools.home} className="footer-more-link">View all tools →</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Guides</h3>
          <ul className="footer-links">
            <li>
              <a href={links.guides.whatIsBimi}>What is BIMI?</a>
            </li>
            <li>
              <a href={links.guides.gmail}>Gmail BIMI Requirements</a>
            </li>
            <li>
              <a href={links.guides.yahoo}>Yahoo BIMI Requirements</a>
            </li>
            <li>
              <a href={links.guides.vsDmarc}>BIMI vs DMARC</a>
            </li>
            <li>
              <a href={links.guides.vmc}>Do I need a VMC?</a>
            </li>
            <li>
              <a href={links.guides.root} className="footer-more-link">View all guides →</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Resources</h3>
          <ul className="footer-links">
            <li>
              <a href="https://bimigroup.org/" target="_blank" rel="noopener noreferrer">
                BIMI Group Official
              </a>
            </li>
            <li>
              <a href="https://bimigroup.org/bimi-specification/" target="_blank" rel="noopener noreferrer">
                BIMI Specification
              </a>
            </li>
            <li>
              <a href="https://www.rfc-editor.org/rfc/rfc8618" target="_blank" rel="noopener noreferrer">
                RFC 8618 (BIMI)
              </a>
            </li>
            <li>
              <a href="https://dmarc.org/" target="_blank" rel="noopener noreferrer">
                DMARC.org
              </a>
            </li>
            <li>
              <a href="https://github.com/dconroy/verifybimi.com" target="_blank" rel="noopener noreferrer">
                Source Code (GitHub)
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-privacy">
          <strong>Privacy First:</strong> This tool runs entirely in your browser. 
          Your images and data are never uploaded to our servers.
        </p>
        <p className="footer-copyright">
          © {new Date().getFullYear()} VerifyBIMI. Open source and free forever.
        </p>
      </div>
    </footer>
  );
}
