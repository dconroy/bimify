export interface BimiTagMap {
  [key: string]: string;
}

export interface BimiParseResult {
  raw: string;
  tags: BimiTagMap;
  errors: string[];
  warnings: string[];
  logoUrl?: string;
  vmcUrl?: string;
}

function normalizeDomainInput(domain: string): string {
  let d = domain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/\/.*$/, '');
  d = d.replace(/^\*\./, ''); // if user pastes *.example.com
  return d;
}

export function bimiQname(domain: string): string {
  const d = normalizeDomainInput(domain);
  return `default._bimi.${d}`;
}

export function parseBimiRecord(rawTxt: string): BimiParseResult {
  const raw = rawTxt.trim();
  const tags: BimiTagMap = {};
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw) {
    return { raw, tags, errors: ['No BIMI record found.'], warnings };
  }

  // BIMI is semicolon-separated key=value tags
  const parts = raw
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) {
      warnings.push(`Unrecognized BIMI token "${part}" (expected key=value).`);
      continue;
    }
    const key = part.slice(0, eqIdx).trim().toLowerCase();
    const value = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    if (tags[key] !== undefined) {
      warnings.push(`Duplicate BIMI tag "${key}" found; using the last value.`);
    }
    tags[key] = value;
  }

  // Validate version
  if ((tags['v'] || '').toUpperCase() !== 'BIMI1') {
    errors.push('Missing or invalid BIMI version. Expected "v=BIMI1".');
  }

  // Logo URL (l=) is required
  const logoUrl = tags['l'];
  if (!logoUrl) {
    errors.push('Missing required BIMI logo URL tag "l".');
  } else {
    // Validate URL format
    try {
      const url = new URL(logoUrl);
      if (url.protocol !== 'https:') {
        warnings.push('Logo URL should use HTTPS for security.');
      }
      // Check if it looks like an SVG URL (not required, but helpful)
      if (!logoUrl.toLowerCase().endsWith('.svg') && !logoUrl.toLowerCase().includes('svg')) {
        warnings.push('Logo URL does not appear to point to an SVG file. BIMI requires SVG format.');
      }
    } catch {
      errors.push(`Invalid logo URL format: "${logoUrl}". Must be a valid URL.`);
    }
  }

  // VMC URL (a=) is optional
  const vmcUrl = tags['a'];
  if (vmcUrl) {
    try {
      const url = new URL(vmcUrl);
      if (url.protocol !== 'https:') {
        warnings.push('VMC URL should use HTTPS for security.');
      }
      if (!vmcUrl.toLowerCase().endsWith('.pem') && !vmcUrl.toLowerCase().includes('vmc')) {
        warnings.push('VMC URL typically points to a .pem certificate file.');
      }
    } catch {
      errors.push(`Invalid VMC URL format: "${vmcUrl}". Must be a valid URL.`);
    }
  } else {
    warnings.push('No VMC (a=) tag found. Some mailbox providers (e.g., Gmail) require a VMC for BIMI display.');
  }

  // Check for unknown tags
  const knownTags = ['v', 'l', 'a'];
  for (const tag of Object.keys(tags)) {
    if (!knownTags.includes(tag)) {
      warnings.push(`Unknown BIMI tag "${tag}". Standard tags are: v, l, a.`);
    }
  }

  return {
    raw,
    tags,
    errors,
    warnings,
    logoUrl: logoUrl || undefined,
    vmcUrl: vmcUrl || undefined,
  };
}

export function pickLikelyBimiRecord(txtAnswers: string[]): string | null {
  if (!txtAnswers.length) return null;
  const exact = txtAnswers.find((a) => a.toLowerCase().includes('v=bimi1'));
  return exact || txtAnswers[0] || null;
}


