export interface SpfParseResult {
  raw: string;
  version: string | null;
  mechanisms: Array<{
    type: string;
    value: string;
    qualifier: string;
  }>;
  modifiers: Record<string, string>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

function normalizeDomainInput(domain: string): string {
  let d = domain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/\/.*$/, '');
  d = d.replace(/^\*\./, '');
  return d;
}

export function spfQname(domain: string): string {
  const d = normalizeDomainInput(domain);
  return d; // SPF is at the root domain
}

export function parseSpfRecord(rawTxt: string): SpfParseResult {
  const raw = rawTxt.trim();
  const mechanisms: Array<{ type: string; value: string; qualifier: string }> = [];
  const modifiers: Record<string, string> = {};
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw) {
    return {
      raw,
      version: null,
      mechanisms: [],
      modifiers: {},
      errors: ['No SPF record found.'],
      warnings: [],
      isValid: false,
    };
  }

  // SPF records start with "v=spf1"
  const parts = raw.split(/\s+/).filter(Boolean);
  let version: string | null = null;

  if (parts.length > 0) {
    const firstPart = parts[0];
    if (firstPart.toLowerCase().startsWith('v=')) {
      version = firstPart.substring(2);
      if (version.toLowerCase() !== 'spf1') {
        errors.push(`Invalid SPF version "${version}". Expected "v=spf1".`);
      }
    } else {
      errors.push('SPF record must start with "v=spf1".');
    }
  }

  // Parse mechanisms and modifiers
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // Check if it's a modifier (key=value)
    if (part.includes('=') && !part.startsWith('+') && !part.startsWith('-') && !part.startsWith('~') && !part.startsWith('?')) {
      const eqIdx = part.indexOf('=');
      const key = part.slice(0, eqIdx).toLowerCase();
      const value = part.slice(eqIdx + 1);
      modifiers[key] = value;
      continue;
    }

    // Parse mechanism
    let qualifier = '+'; // default pass
    let mechanism = part;

    if (part.startsWith('+')) {
      qualifier = '+';
      mechanism = part.slice(1);
    } else if (part.startsWith('-')) {
      qualifier = '-';
      mechanism = part.slice(1);
    } else if (part.startsWith('~')) {
      qualifier = '~';
      mechanism = part.slice(1);
    } else if (part.startsWith('?')) {
      qualifier = '?';
      mechanism = part.slice(1);
    }

    // Extract mechanism type and value
    let type = mechanism;
    let value = '';

    if (mechanism.includes(':')) {
      const colonIdx = mechanism.indexOf(':');
      type = mechanism.slice(0, colonIdx);
      value = mechanism.slice(colonIdx + 1);
    } else if (mechanism.includes('/')) {
      const slashIdx = mechanism.indexOf('/');
      type = mechanism.slice(0, slashIdx);
      value = mechanism.slice(slashIdx + 1);
    }

    mechanisms.push({ type, value, qualifier });
  }

  // Validation
  if (!version) {
    errors.push('SPF record must include version "v=spf1".');
  }

  // Check for common issues
  const hasAll = mechanisms.some((m) => m.type === 'all');
  if (!hasAll) {
    warnings.push('SPF record should include an "all" mechanism to specify default behavior for unmatched senders.');
  }

  // Check for too many DNS lookups (SPF limit is 10)
  const lookupMechanisms = mechanisms.filter((m) => ['include', 'a', 'mx', 'exists', 'ptr'].includes(m.type));
  if (lookupMechanisms.length > 10) {
    errors.push(`SPF record exceeds the 10 DNS lookup limit (found ${lookupMechanisms.length}). This will cause SPF to fail.`);
  }

  // Check for redirect modifier (should be used carefully)
  if (modifiers['redirect']) {
    warnings.push('SPF record uses "redirect" modifier. Ensure the target domain has a valid SPF record.');
  }

  const isValid = errors.length === 0 && version === 'spf1';

  return {
    raw,
    version,
    mechanisms,
    modifiers,
    errors,
    warnings,
    isValid,
  };
}

export function pickLikelySpfRecord(txtAnswers: string[]): string | null {
  if (!txtAnswers.length) return null;
  const exact = txtAnswers.find((a) => a.toLowerCase().startsWith('v=spf1'));
  return exact || txtAnswers[0] || null;
}


