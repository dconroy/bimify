export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>What is BIMI?</h3>
          <p>
            BIMI (Brand Indicators for Message Identification) is an email authentication standard 
            that allows brands to display their verified logo next to authenticated emails in 
            supported email clients. BIMI helps recipients identify legitimate emails from trusted 
            brands, improving email security and brand recognition.
          </p>
        </div>

        <div className="footer-section">
          <h3>BIMI Standards & Requirements</h3>
          <p>
            To use BIMI, logos must meet specific technical requirements:
          </p>
          <ul>
            <li><strong>SVG Format:</strong> Logos must be in SVG (Scalable Vector Graphics) format</li>
            <li><strong>Square ViewBox:</strong> Minimum 64x64 logical units, square aspect ratio</li>
            <li><strong>Vector Only:</strong> No raster images or embedded bitmap graphics</li>
            <li><strong>Solid Background:</strong> Opaque background color (no transparency)</li>
            <li><strong>Safe Padding:</strong> Logo content must stay within safe padding area (typically 12.5%)</li>
            <li><strong>No Scripts:</strong> No JavaScript, external CSS, or foreign objects</li>
            <li><strong>Clean SVG:</strong> Simplified styling, inline attributes preferred</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>BIMI Implementation</h3>
          <p>
            BIMI requires both technical logo preparation and email authentication setup:
          </p>
          <ul>
            <li><strong>DMARC Policy:</strong> Domain must have a valid DMARC policy (p=quarantine or p=reject)</li>
            <li><strong>VMC (Verified Mark Certificate):</strong> Optional but recommended for enhanced trust</li>
            <li><strong>DNS Records:</strong> BIMI DNS record must be published for the domain</li>
            <li><strong>Email Client Support:</strong> Recipient's email client must support BIMI</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Resources & Links</h3>
          <ul className="footer-links">
            <li>
              <a href="https://bimigroup.org/" target="_blank" rel="noopener noreferrer">
                BIMI Group - Official Specification
              </a>
            </li>
            <li>
              <a href="https://bimigroup.org/bimi-specification/" target="_blank" rel="noopener noreferrer">
                BIMI Specification Documentation
              </a>
            </li>
            <li>
              <a href="https://www.rfc-editor.org/rfc/rfc8618" target="_blank" rel="noopener noreferrer">
                RFC 8618 - BIMI Standard
              </a>
            </li>
            <li>
              <a href="https://www.w3.org/TR/SVG2/" target="_blank" rel="noopener noreferrer">
                SVG 2.0 Specification
              </a>
            </li>
            <li>
              <a href="https://dmarc.org/" target="_blank" rel="noopener noreferrer">
                DMARC - Email Authentication
              </a>
            </li>
            <li>
              <a href="https://www.iana.org/assignments/bimi/bimi.xhtml" target="_blank" rel="noopener noreferrer">
                IANA BIMI Registry
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>About This Tool</h3>
          <p>
            This BIMI logo converter helps you prepare logos for BIMI compliance. Upload your logo 
            (PNG, JPG, or SVG), and we'll convert it to a BIMI-compliant SVG with proper formatting, 
            background, and padding. The tool validates your logo against BIMI requirements and 
            provides detailed feedback on compliance.
          </p>
          <p className="footer-note">
            <strong>Note:</strong> This tool prepares logos for BIMI. You still need to set up DMARC, 
            publish BIMI DNS records, and optionally obtain a VMC for full BIMI implementation.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
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
              width="32"
              height="32"
            />
            <span>Built by dconroy</span>
          </a>
        </div>
        <p>
          VerifyBIMI - Convert and validate logos for Brand Indicators for Message Identification (BIMI) compliance
        </p>
        <p className="footer-copyright">
          © {new Date().getFullYear()} VerifyBIMI. Open source tool for BIMI logo preparation.
        </p>
      </div>
    </footer>
  );
}

