import { Footer } from './Footer';
import '../App.css';

function isOnBimiInfoPath(pathname: string): boolean {
  return pathname.includes('/what-is-bimi');
}

export function BimiInfoPage() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const homeHref = import.meta.env.BASE_URL || '/';

  // If we ever land here accidentally, fail soft by showing the converter link.
  if (!isOnBimiInfoPath(pathname)) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>VerifyBIMI</h1>
          <p className="app-description">BIMI guide</p>
          <div className="app-header-actions">
            <a className="header-cta" href={homeHref}>
              Back to the converter
            </a>
          </div>
        </header>
        <main className="app-main">
          <div className="upload-area">
            <h2 style={{ marginTop: 0 }}>BIMI Guide</h2>
            <p>
              <a href={homeHref}>Back to the converter</a>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Basic SEO for SPA fallback cases (real SEO is handled by the static HTML page in /public).
  if (typeof document !== 'undefined') {
    document.title = 'What is BIMI, and should your brand care? | VerifyBIMI';
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>What is BIMI?</h1>
        <p className="app-description">
          Brand Indicators for Message Identification (BIMI) explained: what it is, why it exists, how it works, and
          when it’s worth it.
        </p>
        <div className="app-header-actions">
          <a className="header-cta" href={homeHref}>
            Back to the converter
          </a>
        </div>
      </header>

      <main className="app-main">
        <article className="info-article">
          <div className="info-card">
            <div className="info-kicker">BIMI Guide</div>
            <h2 className="info-title">What is BIMI, and should your brand care?</h2>
            <p className="info-lede">
              If you have noticed company logos starting to appear next to emails in some inboxes, that is not an
              accident. It is usually the result of BIMI.
            </p>
            <p className="info-muted">
              BIMI stands for <strong>Brand Indicators for Message Identification</strong>. It is an email
              specification that allows verified brands to display their official logo in supported email clients. The
              goal is simple: make it easier for people to recognize legitimate email and harder for attackers to
              impersonate trusted brands.
            </p>
            <p className="info-muted">
              This guide explains what BIMI is, why it exists, how it works at a high level, and when it is worth the
              effort.
            </p>
          </div>

          <nav className="info-toc" aria-label="On this page">
            <div className="info-toc-title">On this page</div>
            <ul>
              <li>
                <a href="#what-is-bimi">What is BIMI?</a>
              </li>
              <li>
                <a href="#why-bimi-exists">Why BIMI exists</a>
              </li>
              <li>
                <a href="#requirements">Email authentication requirements</a>
              </li>
              <li>
                <a href="#bimi-record">What is a BIMI DNS record?</a>
              </li>
              <li>
                <a href="#svg-requirements">BIMI logos and SVG requirements</a>
              </li>
              <li>
                <a href="#vmc">Verified Mark Certificates (VMCs)</a>
              </li>
              <li>
                <a href="#support">Which mailbox providers support BIMI?</a>
              </li>
              <li>
                <a href="#setup">High-level BIMI setup process</a>
              </li>
              <li>
                <a href="#deliverability">Does BIMI affect deliverability?</a>
              </li>
              <li>
                <a href="#worth-it">Is BIMI worth it for your brand?</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </nav>

          <div className="info-prose">
            <h3 id="what-is-bimi">What is BIMI?</h3>
            <p>
              BIMI is an email standard that ties brand logos to strong email authentication. It is not an
              authentication protocol itself, but it depends on authentication being done correctly.
            </p>
            <p>
              When BIMI is set up properly, mailbox providers that support it may show your brand’s logo next to your
              messages in the inbox or message view. This only happens after the provider confirms that the email is
              authenticated and authorized by your domain.
            </p>
            <p>
              <strong>In short, BIMI turns email authentication into a visible trust signal.</strong>
            </p>

            <h3 id="why-bimi-exists">Why BIMI exists</h3>
            <p>
              Email spoofing is a persistent problem. Attackers routinely send messages that look like they come from
              well-known brands, banks, and online services. This hurts recipients, but it also hurts mailbox providers
              when users lose trust in their inbox.
            </p>
            <p>
              DMARC was created to stop this, but adoption has been slow. Many domains publish DMARC records without
              enforcing them, which limits their effectiveness.
            </p>
            <p>
              BIMI was introduced as an incentive. If a brand enforces strong authentication, it becomes eligible to
              display its logo in supported inboxes. The logo is the reward, but the real benefit is stronger
              protection against spoofing.
            </p>

            <h3 id="requirements">Email authentication requirements</h3>
            <p>To be eligible for BIMI, a domain must already have email authentication in place:</p>
            <ul>
              <li>SPF must be configured</li>
              <li>DKIM must be configured</li>
              <li>DMARC must be enforced</li>
            </ul>
            <p>
              DMARC enforcement means using either <strong>p=quarantine</strong> or <strong>p=reject</strong>. A policy
              of <strong>p=none</strong> is not sufficient for BIMI, since it does not instruct mailbox providers to
              take action against unauthenticated mail.
            </p>

            <h3 id="bimi-record">What is a BIMI DNS record?</h3>
            <p>
              BIMI is enabled through a DNS TXT record, similar to SPF, DKIM, and DMARC. The BIMI record tells mailbox
              providers where to find your official logo file. The logo itself is hosted at a publicly accessible URL
              and referenced from DNS.
            </p>
            <p>At a high level, the record does one thing: it points to the SVG file that represents your brand.</p>
            <p>
              Publishing the BIMI record is typically one of the final steps, after authentication and logo
              preparation are complete.
            </p>

            <h3 id="svg-requirements">BIMI logos and SVG requirements</h3>
            <p>
              BIMI logos must be provided as SVG files using the <strong>SVG Tiny 1.2</strong> format. This format is
              intentionally restrictive and designed to be safe for email clients to render.
            </p>
            <p>
              Not all existing SVGs are compatible. Logos often need to be simplified, flattened, and cleaned up to
              meet the specification. This is one of the most common stumbling blocks during BIMI setup.
            </p>

            <h3 id="vmc">Verified Mark Certificates (VMCs)</h3>
            <p>
              Some mailbox providers require a Verified Mark Certificate before displaying a BIMI logo. A VMC is a
              certificate that confirms the brand has legal rights to the logo being displayed. It is issued by an
              approved certificate authority and typically renewed annually.
            </p>
            <p>
              Not all mailbox providers require a VMC, but some use it as a strong signal of brand legitimacy. Whether
              a VMC is required depends on where your audience primarily reads email.
            </p>

            <h3 id="support">Which mailbox providers support BIMI?</h3>
            <p>
              BIMI support is growing, but it is not universal. Currently, BIMI is supported by several major mailbox
              providers, including Gmail, Yahoo, AOL, and Fastmail. Support in other clients may vary, and requirements
              such as VMCs differ by provider.
            </p>
            <p>
              Some widely used email clients do not yet display BIMI logos. That does not prevent you from
              implementing BIMI, but it is worth setting expectations internally about where logos will and will not
              appear.
            </p>

            <h3 id="setup">High-level BIMI setup process</h3>
            <p>At a high level, setting up BIMI involves the following steps:</p>
            <ul>
              <li>Identify the domain used for sending email</li>
              <li>Confirm SPF and DKIM are working correctly</li>
              <li>Enforce DMARC with quarantine or reject</li>
              <li>Prepare a compliant SVG logo</li>
              <li>Obtain a VMC if required for your target inboxes</li>
              <li>Publish the BIMI DNS record</li>
              <li>Validate the configuration and wait for mailbox providers to process it</li>
            </ul>
            <p>Even after everything is correct, it can take time for logos to appear consistently.</p>

            <h3 id="deliverability">Does BIMI affect deliverability?</h3>
            <p>
              BIMI is not a deliverability feature by itself. Mailbox providers do not promise better inbox placement
              just because BIMI is present.
            </p>
            <p>
              That said, BIMI depends on strong authentication and enforcement. Those factors do contribute to sender
              reputation and protection against abuse. Over time, that can indirectly support healthier deliverability.
            </p>
            <p>
              BIMI may also improve engagement. Recognizable logos can increase trust and help messages stand out, which
              can lead to higher open rates.
            </p>

            <h3 id="worth-it">Is BIMI worth it for your brand?</h3>
            <p>
              BIMI tends to be most valuable for brands that are frequently targeted by impersonation, such as
              financial services, large consumer brands, marketplaces, and SaaS platforms.
            </p>
            <p>
              Smaller organizations can also benefit. Spoofing is not limited to big brands, and attackers often
              target smaller companies with weaker security controls.
            </p>
            <p>
              If you already have SPF, DKIM, and enforced DMARC, BIMI can be a logical next step. If you do not, those
              basics should come first.
            </p>

            <h3>Final thoughts</h3>
            <p>
              The logo is the visible part of BIMI, but it is not the main point. BIMI exists to encourage better
              email authentication and protect recipients from fraud.
            </p>
            <p>
              If your brand sends meaningful volumes of email and cares about trust, BIMI is worth understanding, even
              if you decide not to implement it right away.
            </p>
          </div>

          <section className="info-faq" id="faq" aria-label="Frequently asked questions about BIMI">
            <h3>FAQ</h3>
            <details>
              <summary>What is BIMI?</summary>
              <p>
                BIMI is an email standard that can display a brand’s verified logo in supported inboxes, but only after
                strong email authentication is in place and enforced.
              </p>
            </details>
            <details>
              <summary>What DMARC policy do you need for BIMI?</summary>
              <p>
                DMARC must be enforced with <strong>p=quarantine</strong> or <strong>p=reject</strong>. A policy of{' '}
                <strong>p=none</strong> is not sufficient for BIMI eligibility.
              </p>
            </details>
            <details>
              <summary>What format does a BIMI logo need to be?</summary>
              <p>
                BIMI logos must be an <strong>SVG Tiny 1.2</strong> file. Many SVGs need cleanup and simplification to
                meet the specification.
              </p>
            </details>
            <details>
              <summary>Do you need a Verified Mark Certificate (VMC)?</summary>
              <p>
                Some mailbox providers require a VMC to display the logo. Whether you need one depends on where your
                audience reads email and which providers you care about most.
              </p>
            </details>
            <details>
              <summary>Does BIMI improve deliverability?</summary>
              <p>
                BIMI is not a direct deliverability feature. It relies on strong authentication, which can indirectly
                support healthier sending practices over time.
              </p>
            </details>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}


