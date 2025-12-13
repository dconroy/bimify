import { useMemo, useState } from 'react';
import { Footer } from '../Footer';
import '../../App.css';
import { DOH_RESOLVERS, getDefaultResolver, dohLookupTxt } from '../../utils/doh';
import { bimiQname, parseBimiRecord, pickLikelyBimiRecord } from '../../utils/bimi';
import { trackDnsCheck } from '../../utils/analytics';

function isOnBimiToolPath(pathname: string): boolean {
  return pathname.includes('/tools/bimi');
}

export function BimiCheckerPage() {
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

  if (!isOnBimiToolPath(pathname)) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>VerifyBIMI</h1>
          <p className="app-description">BIMI checker</p>
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
            <h2 style={{ marginTop: 0 }}>BIMI checker</h2>
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
    document.title = 'BIMI DNS record checker | VerifyBIMI';
  }

  const parsed = useMemo(() => {
    if (!selectedRecord) return null;
    return parseBimiRecord(selectedRecord);
  }, [selectedRecord]);

  const statusBadge = useMemo(() => {
    if (!parsed) return null;
    if (parsed.errors.length) return { kind: 'bad', label: 'FAIL' as const };
    return { kind: 'good', label: 'PASS' as const };
  }, [parsed]);

  const verdictLine = useMemo(() => {
    if (!parsed) return null;
    if (parsed.errors.length) return 'FAIL: BIMI record has errors. See details below.';
    if (!parsed.logoUrl) return 'FAIL: BIMI record is missing required logo URL (l= tag).';
    return 'PASS: BIMI record appears valid. Ensure your logo URL is accessible and your authentication (SPF, DKIM, DMARC) is properly configured.';
  }, [parsed]);

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    setAnswers(null);
    setSelectedRecord(null);

    try {
      const qname = bimiQname(domain);
      const res = await dohLookupTxt(qname, resolver);
      if (res.error) {
        setError(res.error);
        trackDnsCheck('bimi', 'error', { domain, error: res.error });
        return;
      }

      const txt = res.answers || [];
      setAnswers(txt);

      const picked = pickLikelyBimiRecord(txt);
      if (!picked) {
        setError(`No BIMI TXT records found for ${qname}.`);
        trackDnsCheck('bimi', 'no_record', { domain });
        return;
      }
      setSelectedRecord(picked);
      trackDnsCheck('bimi', 'success', { domain });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>BIMI DNS record checker</h1>
        <p className="app-description">
          Verify your BIMI DNS record using DNS-over-HTTPS. Check that your record is properly formatted and points to a valid logo URL.
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
            <div className="dmarc-kicker">BIMI</div>
            <h2 className="dmarc-title">Check your BIMI record</h2>
            <p className="dmarc-muted">
              We query <code>default._bimi.&lt;domain&gt;</code> via a public recursive resolver you choose. Results may vary
              briefly due to DNS caching.
            </p>

            <div className="dmarc-form">
              <div className="dmarc-form-row">
                <label className="dmarc-label" htmlFor="bimi-domain">
                  Domain
                </label>
                <input
                  id="bimi-domain"
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
                <label className="dmarc-label" htmlFor="bimi-resolver">
                  Resolver
                </label>
                <select
                  id="bimi-resolver"
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
                {isLoading ? 'Checking…' : 'Verify BIMI'}
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

                {parsed.logoUrl && (
                  <div className="dmarc-section">
                    <div className="dmarc-section-title">Logo URL</div>
                    <div className="dmarc-tags">
                      <div className="dmarc-tag">
                        <div className="dmarc-tag-key">URL</div>
                        <div className="dmarc-tag-val">
                          <a href={parsed.logoUrl} target="_blank" rel="noopener noreferrer">
                            {parsed.logoUrl}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {parsed.vmcUrl && (
                  <div className="dmarc-section">
                    <div className="dmarc-section-title">VMC URL</div>
                    <div className="dmarc-tags">
                      <div className="dmarc-tag">
                        <div className="dmarc-tag-key">URL</div>
                        <div className="dmarc-tag-val">
                          <a href={parsed.vmcUrl} target="_blank" rel="noopener noreferrer">
                            {parsed.vmcUrl}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

