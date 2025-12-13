import { useMemo, useState } from 'react';
import { Footer } from '../Footer';
import '../../App.css';
import { DOH_RESOLVERS, getDefaultResolver, dohLookupTxt } from '../../utils/doh';
import { dmarcQname, parseDmarcRecord, pickLikelyDmarcRecord } from '../../utils/dmarc';
import { trackDnsCheck } from '../../utils/analytics';

function isOnDmarcToolPath(pathname: string): boolean {
  return pathname.includes('/tools/dmarc');
}

export function DmarcVerifierPage() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const homeHref = baseUrl;
  const toolsHref = `${baseUrl}tools/`;

  const [domain, setDomain] = useState('');
  const [resolverId, setResolverId] = useState(() => getDefaultResolver().id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[] | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const resolver = useMemo(() => DOH_RESOLVERS.find((r) => r.id === resolverId) || getDefaultResolver(), [resolverId]);

  // Fail-soft if we ever land here accidentally.
  if (!isOnDmarcToolPath(pathname)) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>VerifyBIMI</h1>
          <p className="app-description">DMARC verifier</p>
          <div className="app-header-actions">
            <a className="header-cta" href={homeHref}>
              Back to the converter
            </a>
            <a className="header-cta" href={toolsHref}>
              Tools
            </a>
          </div>
        </header>
        <main className="app-main">
          <div className="upload-area">
            <h2 style={{ marginTop: 0 }}>DMARC verifier</h2>
            <p>
              <a href={toolsHref}>Back to Tools</a>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (typeof document !== 'undefined') {
    document.title = 'DMARC verifier | VerifyBIMI';
  }

  const parsed = useMemo(() => {
    if (!selectedRecord) return null;
    return parseDmarcRecord(selectedRecord);
  }, [selectedRecord]);

  const statusBadge = useMemo(() => {
    if (!parsed) return null;
    if (parsed.errors.length) return { kind: 'bad', label: 'FAIL' as const };
    const p = (parsed.tags['p'] || '').toLowerCase();
    if (p === 'quarantine' || p === 'reject') return { kind: 'good', label: 'PASS' as const };
    return { kind: 'bad', label: 'FAIL' as const };
  }, [parsed]);

  const verdictLine = useMemo(() => {
    if (!parsed) return null;
    if (parsed.errors.length) return 'FAIL: DMARC record is missing required tags or is malformed.';
    const p = (parsed.tags['p'] || '').toLowerCase();
    if (p === 'quarantine' || p === 'reject') return `PASS: DMARC is enforced (p=${p}).`;
    if (p) return `FAIL: DMARC is not enforced (p=${p}). BIMI generally requires p=quarantine or p=reject.`;
    return 'FAIL: DMARC policy tag "p" is missing.';
  }, [parsed]);

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    setAnswers(null);
    setSelectedRecord(null);

    try {
      const qname = dmarcQname(domain);
      const res = await dohLookupTxt(qname, resolver);
      if (res.error) {
        setError(res.error);
        trackDnsCheck('dmarc', 'error', { domain, error: res.error });
        return;
      }

      const txt = res.answers || [];
      setAnswers(txt);

      const picked = pickLikelyDmarcRecord(txt);
      if (!picked) {
        setError(`No TXT records found for ${qname}.`);
        trackDnsCheck('dmarc', 'no_record', { domain });
        return;
      }
      setSelectedRecord(picked);
      trackDnsCheck('dmarc', 'success', { domain });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>DMARC verifier</h1>
        <p className="app-description">
          Verify your DMARC DNS record using DNS-over-HTTPS. BIMI typically requires an enforced DMARC policy.
        </p>
        <div className="app-header-actions">
          <a className="header-cta" href={homeHref}>
            Back to the converter
          </a>
          <a className="header-cta" href={toolsHref}>
            Tools
          </a>
        </div>
      </header>

      <main className="app-main">
        <div className="dmarc-page">
          <div className="dmarc-card">
            <div className="dmarc-kicker">DMARC</div>
            <h2 className="dmarc-title">Check your DMARC record</h2>
            <p className="dmarc-muted">
              We query <code>_dmarc.&lt;domain&gt;</code> via a public recursive resolver you choose. Results may vary
              briefly due to DNS caching.
            </p>

            <div className="dmarc-form">
              <div className="dmarc-form-row">
                <label className="dmarc-label" htmlFor="dmarc-domain">
                  Domain
                </label>
                <input
                  id="dmarc-domain"
                  className="dmarc-input"
                  type="text"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>

              <div className="dmarc-form-row">
                <label className="dmarc-label" htmlFor="dmarc-resolver">
                  Resolver
                </label>
                <select
                  id="dmarc-resolver"
                  className="dmarc-select"
                  value={resolverId}
                  onChange={(e) => {
                    const next = DOH_RESOLVERS.find((r) => r.id === e.target.value)?.id;
                    setResolverId(next || getDefaultResolver().id);
                  }}
                >
                  {DOH_RESOLVERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <div className="dmarc-help">{resolver.description}</div>
              </div>

              <button className="dmarc-button" onClick={handleVerify} disabled={isLoading || !domain.trim()}>
                {isLoading ? 'Checking…' : 'Verify DMARC'}
              </button>
            </div>

            {error && (
              <div className="dmarc-banner dmarc-banner-error">
                <strong>Error:</strong> {error}
              </div>
            )}

            {parsed && (
              <div className="dmarc-results">
                <div className="dmarc-results-header">
                  <h3 className="dmarc-results-title">Result</h3>
                  {statusBadge && (
                    <span className={`dmarc-status dmarc-status-${statusBadge.kind}`}>{statusBadge.label}</span>
                  )}
                </div>
                {verdictLine && <div className="dmarc-verdict">{verdictLine}</div>}

                <div className="dmarc-section">
                  <div className="dmarc-section-title">Record</div>
                  <pre className="dmarc-pre">{parsed.raw}</pre>
                </div>

                {parsed.errors.length > 0 && (
                  <div className="dmarc-section">
                    <div className="dmarc-section-title">Errors</div>
                    <ul className="dmarc-list dmarc-list-bad">
                      {parsed.errors.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsed.warnings.length > 0 && (
                  <div className="dmarc-section">
                    <div className="dmarc-section-title">Warnings</div>
                    <ul className="dmarc-list dmarc-list-warn">
                      {parsed.warnings.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="dmarc-section">
                  <div className="dmarc-section-title">Parsed tags</div>
                  <div className="dmarc-tags">
                    {Object.keys(parsed.tags)
                      .sort()
                      .map((k) => (
                        <div className="dmarc-tag" key={k}>
                          <div className="dmarc-tag-key">{k}</div>
                          <div className="dmarc-tag-val">{parsed.tags[k]}</div>
                        </div>
                      ))}
                  </div>
                </div>

                {answers && answers.length > 1 && (
                  <div className="dmarc-section">
                    <div className="dmarc-section-title">All TXT answers</div>
                    <ul className="dmarc-list">
                      {answers.map((a, idx) => (
                        <li key={idx}>
                          <code>{a}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


