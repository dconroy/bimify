export function Footer() {
  const infoHref = `${import.meta.env.BASE_URL}what-is-bimi/`;

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>About VerifyBIMI</h3>
          <p>
            BIMI (Brand Indicators for Message Identification) allows brands to display verified logos 
            in supporting email clients. This tool automates the strict technical requirements for your logo.
          </p>
          <ul className="footer-links">
            <li>
              <a href={infoHref}>
                What is BIMI? (Guide)
              </a>
            </li>
          </ul>
          <p>
            Already have an SVG logo from your designer? This tool will turn it into a BIMI-ready SVG and validate it.
          </p>
          <p>
            Have a PNG or JPG logo? We can try automatic vectorization in the browser, but results may vary 
            and you should not rely on it for high stakes branding without designer review.
          </p>
          <p className="footer-note">
            <strong>Note:</strong> Full BIMI implementation also requires a strict DMARC policy 
            (p=quarantine or p=reject) and a published DNS TXT record.
          </p>
        </div>

        <div className="footer-section">
          <h3>Technical Requirements</h3>
          <ul>
            <li><strong>SVG Format:</strong> Must be Scalable Vector Graphics</li>
            <li><strong>Square Aspect:</strong> 1:1 ratio, min 64x64 pixels</li>
            <li><strong>Vector Data:</strong> No embedded raster (bitmaps)</li>
            <li><strong>Solid Background:</strong> No transparency allowed</li>
            <li><strong>Safe Zone:</strong> Artwork centered with padding</li>
            <li><strong>Clean Code:</strong> No scripts, external CSS, or objects</li>
            <li><strong>Metadata:</strong> Title element required for a11y</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Implementation Guide</h3>
          <ul>
            <li><strong>1. Authentication:</strong> Setup SPF & DKIM records</li>
            <li><strong>2. DMARC Policy:</strong> Enforce p=quarantine or p=reject</li>
            <li><strong>3. Logo Prep:</strong> Use VerifyBIMI to create your SVG</li>
            <li><strong>4. Host Logo:</strong> Host SVG on HTTPS (publicly accessible)</li>
            <li><strong>5. VMC:</strong> Optional Verified Mark Certificate</li>
            <li><strong>6. Publish DNS:</strong> Add default._bimi TXT record</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Official Resources</h3>
          <ul className="footer-links">
            <li>
              <a href="https://bimigroup.org/" target="_blank" rel="noopener noreferrer">
                BIMI Group - Official Site
              </a>
            </li>
            <li>
              <a href="https://bimigroup.org/bimi-specification/" target="_blank" rel="noopener noreferrer">
                BIMI Specification Docs
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
                DMARC.org Resources
              </a>
            </li>
            <li>
              <a href="https://mxtoolbox.com/bimi.aspx" target="_blank" rel="noopener noreferrer">
                MXToolbox BIMI Checker
              </a>
            </li>
          </ul>
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
          <a
            href="https://github.com/dconroy/verifybimi.com/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="github-issues-link"
          >
            Report an issue
          </a>
        </div>
        <p>
          VerifyBIMI - Free browser-based BIMI logo converter and validator
        </p>
        <p className="footer-privacy">
          <strong>Privacy:</strong> Your files are processed locally in your browser. We don’t upload your logo to a server.
        </p>
        <p className="footer-copyright">
          © {new Date().getFullYear()} VerifyBIMI. Open source.
        </p>
      </div>
    </footer>
  );
}
