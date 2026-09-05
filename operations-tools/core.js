(function (root) {
  'use strict';
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const key = value => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const cents = value => Math.round((value + Number.EPSILON) * 100);
  function number(value, name, { min = 0, max = 1e9, optional = false } = {}) {
    if (optional && String(value).trim() === '') return 0;
    if (String(value).trim() === '' || !/^\d+(\.\d+)?$/.test(String(value).trim())) throw new Error(`${name} must be a number of ${min} or more (no currency signs or commas).`);
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${name} must be between ${min} and ${max}.`);
    return n;
  }
  function date(value, name, optional = false) {
    if (optional && !value) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error(`${name} must be a valid YYYY-MM-DD date.`);
    return value;
  }
  function timestamp(value, name, optional = false) {
    if (optional && !value) return null;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error(`${name} needs an ISO timestamp with timezone, such as 2026-09-01T09:00:00Z.`);
    date(value.slice(0, 10), name);
    if (+value.slice(11, 13) > 23 || +value.slice(14, 16) > 59 || +(value.slice(17, 19).match(/^\d{2}$/)?.[0] || 0) > 59) throw new Error(`${name} has an invalid time.`);
    const n = Date.parse(value);
    if (!Number.isFinite(n)) throw new Error(`${name} is not a valid timestamp.`);
    return n;
  }
  function required(value, name) {
    const text = String(value ?? '').trim();
    if (!text) throw new Error(`${name} is required.`);
    return text;
  }
  function boolean(value, name) {
    if (!['true', 'false', ''].includes(key(value))) throw new Error(`${name} must be true or false.`);
    return key(value) === 'true';
  }
  // RFC 4180-style CSV, including embedded newlines, escaped quotes and a UTF-8 BOM.
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    const rows = []; let row = [], cell = '', quoted = false, closed = false;
    const pushCell = () => { row.push(cell); cell = ''; closed = false; };
    const pushRow = () => { pushCell(); if (row.some(v => v.trim())) rows.push(row); row = []; };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') { quoted = false; closed = true; }
        else cell += c;
      } else if (c === ',') pushCell();
      else if (c === '\r' || c === '\n') { if (c === '\r' && text[i + 1] === '\n') i++; pushRow(); }
      else if (c === '"' && cell === '' && !closed) quoted = true;
      else if (closed || c === '"') throw new Error('Malformed CSV: unexpected text or quote. Use the downloadable template.');
      else cell += c;
    }
    if (quoted) throw new Error('Malformed CSV: a quoted field is not closed.');
    if (cell || row.length || closed) pushRow();
    if (!rows.length) throw new Error('This CSV is empty.');
    const headers = rows.shift().map(v => key(v));
    if (headers.some(v => !v) || new Set(headers).size !== headers.length) throw new Error('CSV headers must be nonempty and unique.');
    return { headers, rows: rows.map((r, i) => {
      if (r.length !== headers.length) throw new Error(`CSV record ${i + 2} has ${r.length} fields; expected ${headers.length}.`);
      return Object.fromEntries(headers.map((h, j) => [h, r[j].trim()]));
    }) };
  }
  function csv(headers, rows) {
    const cell = value => {
      let s = String(value ?? '');
      // Neutralize spreadsheet formulas in exported user-controlled cells.
      if (/^[\s]*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    return '\uFEFF' + [headers, ...rows.map(r => headers.map(h => r[h]))].map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
  }
  function download(name, headers, rows) {
    const url = URL.createObjectURL(new Blob([csv(headers, rows)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function readFile(file, requiredHeaders, validate) {
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) throw new Error('Please use a CSV smaller than 10 MB.');
    const parsed = parseCSV(await file.text());
    const missing = requiredHeaders.filter(h => !parsed.headers.includes(h));
    if (missing.length) throw new Error('Missing CSV columns: ' + missing.join(', ') + '. Download the template for the expected format.');
    if (!parsed.rows.length) throw new Error('The CSV has headers but no data rows.');
    if (parsed.rows.length > 10000) throw new Error('Please use at most 10,000 rows per session.');
    return parsed.rows.map((r, i) => {
      try { return validate(r); } catch (e) { throw new Error(`CSV record ${i + 2}: ${e.message}`); }
    });
  }
  const spendHeaders = ['date','vendor','invoice','po','sku','description','category','cost_center','gl_account','quantity','unit','unit_price','tax','shipping','paid','due_date','preferred','strategic','entry_type'];
  function validateSpend(r) {
    const out = Object.fromEntries(spendHeaders.map(h => [h, String(r[h] ?? '').trim()]));
    date(out.date, 'Date'); required(out.vendor, 'Vendor'); required(out.description, 'Description');
    out.quantity = number(out.quantity, 'Quantity', { min: 0.001, max: 1e6 });
    for (const f of ['unit_price','tax','shipping','paid']) out[f] = number(out[f], f, { optional: f !== 'unit_price', max: 1e7 });
    out.unit = out.unit || 'each'; out.entry_type = key(out.entry_type || 'purchase');
    if (!['purchase','estimate'].includes(out.entry_type)) throw new Error('entry_type must be purchase or estimate.');
    date(out.due_date, 'Due date', true);
    out.preferred = boolean(out.preferred, 'preferred'); out.strategic = boolean(out.strategic, 'strategic');
    if (out.entry_type === 'estimate' && out.paid > 0) throw new Error('Estimates cannot have payments. Change entry_type to purchase first.');
    if (lineTotal(out) > 1e11) throw new Error('Line total exceeds the supported $1 billion limit.');
    return out;
  }
  const lineTotal = r => cents(r.quantity * r.unit_price) + cents(r.tax) + cents(r.shipping);
  function analyzeSpend(rows, threshold, asOf) {
    const purchases = rows.filter(r => r.entry_type === 'purchase');
    const suppliers = new Map(), skus = new Map(), duplicates = new Map();
    let total = 0, unpaid = 0, overpaid = 0, outside = 0, uncategorized = 0, overdue = 0;
    for (const r of purchases) {
      const amount = lineTotal(r), vendor = key(r.vendor);
      total += amount; unpaid += Math.max(0, amount - cents(r.paid)); overpaid += Math.max(0, cents(r.paid) - amount);
      if (r.due_date && r.due_date < asOf) overdue += Math.max(0, amount - cents(r.paid));
      if (!r.preferred) outside += amount;
      if (!r.category) uncategorized += amount;
      if (!suppliers.has(vendor)) suppliers.set(vendor, { vendor: r.vendor, total: 0, rows: 0, strategic: false });
      const s = suppliers.get(vendor); s.total += amount; s.rows++; s.strategic ||= r.strategic;
      if (r.invoice) {
        const id = JSON.stringify([vendor,key(r.invoice),key(r.sku),key(r.description),r.quantity,key(r.unit),amount]);
        if (!duplicates.has(id)) duplicates.set(id, []);
        duplicates.get(id).push(r);
      }
      if (r.sku) {
        const id = JSON.stringify([key(r.sku),key(r.unit)]);
        if (!skus.has(id)) skus.set(id, []);
        skus.get(id).push(r);
      }
    }
    const supplierList = [...suppliers.values()].sort((a,b) => b.total - a.total).map(s => ({ ...s, tail: s.total < cents(threshold) && !s.strategic }));
    const variance = [...skus.values()].map(group => {
      const low = Math.min(...group.map(r => r.unit_price)), high = Math.max(...group.map(r => r.unit_price));
      return { sku: group[0].sku, unit: group[0].unit, description: group[0].description, category: group[0].category, quantity: group.reduce((n,r) => n + r.quantity, 0), low, high, vendors: new Set(group.map(r => key(r.vendor))).size, opportunity: group.reduce((n,r) => n + cents((r.unit_price-low)*r.quantity), 0) };
    }).filter(r => r.high > r.low).sort((a,b) => b.opportunity - a.opportunity);
    return { purchases, suppliers: supplierList, total, unpaid, overpaid, overdue, outside, uncategorized,
      estimates: rows.filter(r => r.entry_type === 'estimate').reduce((n,r) => n + lineTotal(r),0),
      tail: supplierList.filter(s => s.tail).reduce((n,s) => n + s.total, 0),
      duplicateGroups: [...duplicates.values()].filter(g => g.length > 1), variance };
  }
  const ticketHeaders = ['ticket_id','vendor','priority','opened_at','responded_at','resolved_at','owner','issue_key'];
  const defaultRules = { P1: { response: 15, resolution: 4 }, P2: { response: 60, resolution: 8 }, P3: { response: 240, resolution: 24 }, P4: { response: 480, resolution: 72 } };
  function validateTicket(r) {
    const out = Object.fromEntries(ticketHeaders.map(h => [h, String(r[h] ?? '').trim()]));
    required(out.ticket_id, 'Ticket ID'); required(out.vendor, 'Vendor'); out.priority = out.priority.toUpperCase();
    if (!Object.hasOwn(defaultRules, out.priority)) throw new Error('Priority must be P1, P2, P3 or P4.');
    const opened = timestamp(out.opened_at, 'opened_at'), responded = timestamp(out.responded_at, 'responded_at', true), resolved = timestamp(out.resolved_at, 'resolved_at', true);
    if ((responded !== null && responded < opened) || (resolved !== null && resolved < opened)) throw new Error('Response and resolution cannot precede opening.');
    if (responded !== null && resolved !== null && responded > resolved) throw new Error('Response cannot follow resolution.');
    if (resolved !== null && responded === null) throw new Error('A resolved ticket needs responded_at to verify response performance.');
    return out;
  }
  function auditTickets(rows, rules, asOf) {
    const snapshot = timestamp(asOf, 'Report cutoff');
    const seen = new Set();
    const tickets = rows.map(r => {
      const id = JSON.stringify([key(r.vendor),key(r.ticket_id)]);
      if (seen.has(id)) throw new Error(`Duplicate ticket ID ${r.ticket_id} for ${r.vendor}. Each vendor/ticket pair must be unique.`);
      seen.add(id);
      const opened = timestamp(r.opened_at, 'opened_at');
      if (opened > snapshot) throw new Error(`Ticket ${r.ticket_id} opens after the report cutoff. Advance the cutoff or remove that ticket.`);
      const rule = rules[r.priority];
      const measure = (value, limit) => {
        const time = timestamp(value, 'Ticket timestamp', true);
        const complete = time !== null && time <= snapshot;
        const minutes = ((complete ? time : snapshot)-opened)/60000;
        return { minutes, status: minutes > limit ? 'Breached' : complete ? 'Met' : 'Pending', complete };
      };
      return { ...r, response: measure(r.responded_at, rule.response), resolution: measure(r.resolved_at, rule.resolution*60), ageHours: (snapshot-opened)/3600000 };
    });
    const summarize = group => {
      const measures = group.flatMap(r => [r.response,r.resolution]);
      const met = measures.filter(m => m.status === 'Met').length, breached = measures.filter(m => m.status === 'Breached').length;
      return { count: group.length, responseBreaches: group.filter(r => r.response.status === 'Breached').length, resolutionBreaches: group.filter(r => r.resolution.status === 'Breached').length, open: group.filter(r => !r.resolution.complete).length, pending: measures.filter(m => m.status === 'Pending').length, compliance: met + breached ? met / (met + breached) * 100 : null };
    };
    const vendors = new Map();
    for (const r of tickets) { const k = key(r.vendor); if (!vendors.has(k)) vendors.set(k, []); vendors.get(k).push(r); }
    const issues = new Map();
    tickets.filter(r => r.issue_key).forEach(r => { const k = JSON.stringify([key(r.vendor),key(r.issue_key)]); if (!issues.has(k)) issues.set(k, []); issues.get(k).push(r); });
    return { tickets, ...summarize(tickets), vendors: [...vendors.values()].map(g => ({ vendor:g[0].vendor, ...summarize(g) })), repeats: [...issues.values()].filter(g => g.length > 1) };
  }
  root.Ops = { money, escape, key, cents, number, date, timestamp, required, parseCSV, csv, download, readFile, spendHeaders, validateSpend, lineTotal, analyzeSpend, ticketHeaders, defaultRules, validateTicket, auditTickets };
})(globalThis);
