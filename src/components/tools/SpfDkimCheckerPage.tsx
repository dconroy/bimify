import { useMemo, useState } from 'react';
import { Footer } from '../Footer';
import '../../App.css';
import { DOH_RESOLVERS, getDefaultResolver, dohLookupTxt } from '../../utils/doh';
import { spfQname, parseSpfRecord, pickLikelySpfRecord } from '../../utils/spf';
import { dkimQname, parseDkimRecord, pickLikelyDkimRecord, COMMON_DKIM_SELECTORS } from '../../utils/dkim';
import { trackDnsCheck } from '../../utils/analytics';

function isOnSpfDkimToolPath(pathname: string): boolean {
  return pathname.includes('/tools/spf-dkim');
}

export function SpfDkimCheckerPage() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const homeHref = baseUrl;
  const toolsHref = `${baseUrl}tools/`;

  const [domain, setDomain] = useState('');
  const [dkimSelector, setDkimSelector] = useState('');
  const [resolverId, setResolverId] = useState(() => getDefaultResolver().id);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SPF state
  const [spfAnswers, setSpfAnswers] = useState<string[] | null>(null);
  const [spfRecord, setSpfRecord] = useState<string | null>(null);

  // DKIM state - now supports multiple records (one per selector)
  const [dkimRecords, setDkimRecords] = useState<Array<{ selector: string; record: string; answers: string[] }>>([]);

  const resolver = useMemo(() => DOH_RESOLVERS.find((r) => r.id === resolverId) || getDefaultResolver(), [resolverId]);

  if (!isOnSpfDkimToolPath(pathname)) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>VerifyBIMI</h1>
          <p className="app-description">SPF/DKIM checker</p>
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
            <h2 style={{ marginTop: 0 }}>SPF/DKIM checker</h2>
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
    document.title = 'SPF/DKIM checker | VerifyBIMI';
  }

  const spfParsed = useMemo(() => {
    if (!spfRecord) return null;
    return parseSpfRecord(spfRecord);
  }, [spfRecord]);

  const dkimParsedRecords = useMemo(() => {
    return dkimRecords.map(({ selector, record }) => ({
      selector,
      parsed: parseDkimRecord(record, selector),
    }));
  }, [dkimRecords]);

  const handleVerify = async () => {
    setIsLoading(true);
    setHasSearched(false);
    setError(null);
    setSpfAnswers(null);
    setSpfRecord(null);
    setDkimRecords([]);

    try {
      // Check SPF
      const spfQ = spfQname(domain);
      const spfRes = await dohLookupTxt(spfQ, resolver);
      if (spfRes.error) {
        setError(`SPF lookup failed: ${spfRes.error}`);
      } else {
        const spfTxt = spfRes.answers || [];
        setSpfAnswers(spfTxt);
        const spfPicked = pickLikelySpfRecord(spfTxt);
        if (spfPicked) {
          setSpfRecord(spfPicked);
        }
      }

      // Check DKIM - try multiple selectors if none specified
      const selectorsToTry = dkimSelector.trim() 
        ? [dkimSelector.trim()] 
        : COMMON_DKIM_SELECTORS;

      const dkimResults: Array<{ selector: string; record: string; answers: string[] }> = [];

      // Try all selectors in parallel
      const dkimPromises = selectorsToTry.map(async (selector) => {
        const dkimQ = dkimQname(domain, selector);
        const dkimRes = await dohLookupTxt(dkimQ, resolver);
        if (!dkimRes.error && dkimRes.answers && dkimRes.answers.length > 0) {
          const dkimPicked = pickLikelyDkimRecord(dkimRes.answers);
          if (dkimPicked) {
            dkimResults.push({
              selector,
              record: dkimPicked,
              answers: dkimRes.answers,
            });
          }
        }
      });

      await Promise.all(dkimPromises);
      setDkimRecords(dkimResults);

      // Clear error if we got at least one result
      if (spfRecord || dkimResults.length > 0) {
        setError(null);
        trackDnsCheck('spf_dkim', 'success', {
          domain,
          found_spf: !!spfRecord,
          found_dkim_count: dkimResults.length,
        });
      } else if (!spfRecord && dkimResults.length === 0 && !dkimSelector.trim()) {
        setError('No SPF or DKIM records found. If you know your DKIM selector, try entering it manually.');
        trackDnsCheck('spf_dkim', 'no_record', { domain });
      }
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>SPF/DKIM checker</h1>
        <p className="app-description">
          Verify your SPF and DKIM DNS records using DNS-over-HTTPS. Both are required prerequisites for BIMI.
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
            <div className="dmarc-kicker">SPF & DKIM</div>
            <h2 className="dmarc-title">Check your SPF and DKIM records</h2>
            <p className="dmarc-muted">
              We query SPF at the root domain and DKIM at <code>&lt;selector&gt;._domainkey.&lt;domain&gt;</code>. Results may vary
              briefly due to DNS caching.
            </p>

            <div className="dmarc-form">
              <div className="dmarc-form-row">
                <label className="dmarc-label" htmlFor="spf-dkim-domain">
                  Domain
                </label>
                <input
                  id="spf-dkim-domain"
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
                <label className="dmarc-label" htmlFor="dkim-selector">
                  DKIM Selector (optional)
                </label>
                <input
                  id="dkim-selector"
                  className="dmarc-input"
                  type="text"
                  placeholder="Leave blank to auto-detect"
                  value={dkimSelector}
                  onChange={(e) => setDkimSelector(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <div className="dmarc-help">
                  Leave blank to automatically try common selectors (default, selector1, google, mail, etc.). 
                  Or enter a specific selector to check only that one.
                </div>
              </div>

              <div className="dmarc-form-row">
                <label className="dmarc-label" htmlFor="spf-dkim-resolver">
                  Resolver
                </label>
                <select
                  id="spf-dkim-resolver"
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
                {isLoading ? 'Checking…' : 'Verify SPF & DKIM'}
              </button>
            </div>

            {error && (
              <div className="dmarc-banner dmarc-banner-error">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* SPF Results */}
            {spfParsed && (
              <div className="dmarc-results" style={{ marginTop: '2rem' }}>
                <div className="dmarc-results-header">
                  <h3 className="dmarc-results-title">SPF Record</h3>
                  <span className={`dmarc-status dmarc-status-${spfParsed.isValid ? 'good' : 'bad'}`}>
                    {spfParsed.isValid ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                {spfParsed.isValid ? (
                  <div className="dmarc-verdict">PASS: SPF record appears valid.</div>
                ) : (
                  <div className="dmarc-verdict">FAIL: SPF record has errors or is missing.</div>
                )}

                <div className="dmarc-section">
                  <div className="dmarc-section-title">Record</div>
                  <pre className="dmarc-pre">{spfParsed.raw}</pre>
                </div>

                {spfParsed.errors.length > 0 && (
                  <div className="dmarc-section">
                    <div className="dmarc-section-title">Errors</div>
                    <ul className="dmarc-list dmarc-list-bad">
                      {spfParsed.errors.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {spfParsed.warnings.length > 0 && (
                  <div className="dmarc-section">
                    <div className="dmarc-section-title">Warnings</div>
                    <ul className="dmarc-list dmarc-list-warn">
                      {spfParsed.warnings.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {spfParsed.mechanisms.length > 0 && (
                  <div className="dmarc-section">
                    <div className="dmarc-section-title">Mechanisms</div>
                    <div className="dmarc-tags">
                      {spfParsed.mechanisms.map((m, idx) => (
                        <div className="dmarc-tag" key={idx}>
                          <div className="dmarc-tag-key">
                            {m.qualifier === '+' ? 'pass' : m.qualifier === '-' ? 'fail' : m.qualifier === '~' ? 'softfail' : 'neutral'} {m.type}
                          </div>
                          <div className="dmarc-tag-val">{m.value || '(no value)'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(spfParsed.modifiers).length > 0 && (
                  <div className="dmarc-section">
                    <div className="dmarc-section-title">Modifiers</div>
                    <div className="dmarc-tags">
                      {Object.keys(spfParsed.modifiers).map((k) => (
                        <div className="dmarc-tag" key={k}>
                          <div className="dmarc-tag-key">{k}</div>
                          <div className="dmarc-tag-val">{spfParsed.modifiers[k]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!spfRecord && spfAnswers !== null && (
              <div className="dmarc-results" style={{ marginTop: '2rem' }}>
                <div className="dmarc-results-header">
                  <h3 className="dmarc-results-title">SPF Record</h3>
                  <span className="dmarc-status dmarc-status-bad">NOT FOUND</span>
                </div>
                <div className="dmarc-verdict">No SPF record found for this domain.</div>
              </div>
            )}

            {/* DKIM Results */}
            {dkimParsedRecords.length > 0 && (
              <div className="dmarc-results" style={{ marginTop: '2rem' }}>
                <div className="dmarc-results-header">
                  <h3 className="dmarc-results-title">
                    DKIM Record{dkimParsedRecords.length > 1 ? 's' : ''} Found
                  </h3>
                  <span className="dmarc-status dmarc-status-good">
                    {dkimParsedRecords.filter((r) => r.parsed.isValid).length > 0 ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                {dkimParsedRecords.length > 1 && (
                  <div className="dmarc-verdict" style={{ marginBottom: '1rem' }}>
                    Found {dkimParsedRecords.length} DKIM record{dkimParsedRecords.length > 1 ? 's' : ''} for different selectors.
                  </div>
                )}
                {dkimParsedRecords.map(({ selector, parsed }, idx) => (
                  <div key={selector} style={{ marginTop: idx > 0 ? '1.5rem' : 0, paddingTop: idx > 0 ? '1.5rem' : 0, borderTop: idx > 0 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none' }}>
                    <div className="dmarc-section">
                      <div className="dmarc-section-title">Selector: <code>{selector}</code></div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <span className={`dmarc-status dmarc-status-${parsed.isValid ? 'good' : 'bad'}`} style={{ fontSize: '0.9em' }}>
                          {parsed.isValid ? 'VALID' : 'INVALID'}
                        </span>
                      </div>
                    </div>

                    <div className="dmarc-section">
                      <div className="dmarc-section-title">Record</div>
                      <pre className="dmarc-pre">{parsed.raw}</pre>
                    </div>

                    {parsed.errors.length > 0 && (
                      <div className="dmarc-section">
                        <div className="dmarc-section-title">Errors</div>
                        <ul className="dmarc-list dmarc-list-bad">
                          {parsed.errors.map((msg, msgIdx) => (
                            <li key={msgIdx}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parsed.warnings.length > 0 && (
                      <div className="dmarc-section">
                        <div className="dmarc-section-title">Warnings</div>
                        <ul className="dmarc-list dmarc-list-warn">
                          {parsed.warnings.map((msg, msgIdx) => (
                            <li key={msgIdx}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parsed.keyType && (
                      <div className="dmarc-section">
                        <div className="dmarc-section-title">Key Information</div>
                        <div className="dmarc-tags">
                          <div className="dmarc-tag">
                            <div className="dmarc-tag-key">Key Type</div>
                            <div className="dmarc-tag-val">{parsed.keyType.toUpperCase()}</div>
                          </div>
                          {parsed.publicKey && (
                            <div className="dmarc-tag">
                              <div className="dmarc-tag-key">Public Key</div>
                              <div className="dmarc-tag-val" style={{ wordBreak: 'break-all', fontSize: '0.85em' }}>
                                {parsed.publicKey.substring(0, 50)}...
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {dkimRecords.length === 0 && !isLoading && hasSearched && (
              <div className="dmarc-results" style={{ marginTop: '2rem' }}>
                <div className="dmarc-results-header">
                  <h3 className="dmarc-results-title">DKIM Record</h3>
                  <span className="dmarc-status dmarc-status-bad">NOT FOUND</span>
                </div>
                <div className="dmarc-verdict">
                  {dkimSelector.trim() 
                    ? `No DKIM record found for selector "${dkimSelector}" at ${dkimQname(domain, dkimSelector)}.`
                    : `No DKIM records found after trying ${COMMON_DKIM_SELECTORS.length} common selectors.`}
                </div>
                <div className="dmarc-section">
                  <div className="dmarc-section-title">Tip</div>
                  <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.72)' }}>
                    {dkimSelector.trim()
                      ? 'Try a different selector or leave it blank to auto-detect common selectors.'
                      : 'If you know your DKIM selector, enter it manually above. Common selectors include: default, selector1, selector2, google, mail.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

