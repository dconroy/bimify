export interface DmarcTagMap {
  [key: string]: string;
}

export interface DmarcParseResult {
  raw: string;
  tags: DmarcTagMap;
  errors: string[];
  warnings: string[];
}

function normalizeDomainInput(domain: string): string {
  let d = domain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/\/.*$/, '');
  d = d.replace(/^\*\./, ''); // if user pastes *.example.com
  return d;
}

export function dmarcQname(domain: string): string {
  const d = normalizeDomainInput(domain);
  return `_dmarc.${d}`;
}

export function parseDmarcRecord(rawTxt: string): DmarcParseResult {
  const raw = rawTxt.trim();
  const tags: DmarcTagMap = {};
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw) {
    return { raw, tags, errors: ['No DMARC record found.'], warnings };
  }

  // DMARC is semicolon-separated key=value tags. Order isn't strictly required, but v=DMARC1 must exist.
  const parts = raw
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) {
      warnings.push(`Unrecognized DMARC token "${part}" (expected key=value).`);
      continue;
    }
    const key = part.slice(0, eqIdx).trim().toLowerCase();
    const value = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    if (tags[key] !== undefined) {
      // DMARC technically allows some tags to be repeated in some contexts, but for our purposes this is suspicious.
      warnings.push(`Duplicate DMARC tag "${key}" found; using the last value.`);
    }
    tags[key] = value;
  }

  if ((tags['v'] || '').toUpperCase() !== 'DMARC1') {
    errors.push('Missing or invalid DMARC version. Expected "v=DMARC1".');
  }

  const p = (tags['p'] || '').toLowerCase();
  if (!p) {
    errors.push('Missing required DMARC policy tag "p" (none/quarantine/reject).');
  } else if (!['none', 'quarantine', 'reject'].includes(p)) {
    errors.push(`Invalid DMARC policy "p=${tags['p']}". Expected none/quarantine/reject.`);
  } else if (p === 'none') {
    warnings.push('DMARC policy is "p=none". BIMI typically requires enforcement (p=quarantine or p=reject).');
  }

  const pctRaw = tags['pct'];
  if (pctRaw) {
    const pct = Number.parseInt(pctRaw, 10);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      warnings.push(`Invalid pct="${pctRaw}". Expected 0–100.`);
    } else if (pct < 100) {
      warnings.push(`DMARC pct=${pct} (not 100). BIMI eligibility often expects full enforcement.`);
    }
  }

  // Helpful guidance for common operational tags
  if (!tags['rua'] && !tags['ruf']) {
    warnings.push('No reporting addresses found (rua/ruf). This is optional, but useful during rollout.');
  }

  return { raw, tags, errors, warnings };
}

export function pickLikelyDmarcRecord(txtAnswers: string[]): string | null {
  if (!txtAnswers.length) return null;
  const exact = txtAnswers.find((a) => a.toLowerCase().includes('v=dmarc1'));
  return exact || txtAnswers[0] || null;
}



