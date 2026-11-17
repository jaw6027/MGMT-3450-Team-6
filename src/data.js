export const channels = ['Direct outreach', 'LinkedIn', 'Industry events', 'Website'];
export const audiences = ['Safety & HSE', 'Procurement', 'Operations'];
export const stages = ['Inquiry', 'Qualified', 'Sample requested', 'In trial', 'Feedback received'];
export const messages = ['Plant-based innovation', 'Material footprint', 'Trial & performance'];

// Entirely fictional organizations and outcomes for a classroom demonstration.
export const leads = Array.from({ length: 48 }, (_, i) => ({
  id: `DEMO-${String(i + 1).padStart(3, '0')}`,
  company: `${['Canyon', 'Valley', 'Mesa', 'Coastal', 'Summit', 'Sierra'][i % 6]} ${['Energy', 'Field Services', 'Drilling', 'Industrial'][Math.floor(i / 6) % 4]} ${i + 1}`,
  audience: audiences[i % 3],
  channel: channels[i % 4],
  message: messages[Math.floor(i / 4) % 3],
  date: `2026-${i < 12 ? '10' : '11'}-${String(i < 12 ? 20 + (i % 10) : 1 + (i % 17)).padStart(2, '0')}`,
  stage: i % 5,
  owner: ['Laura', 'Team 6', 'Research team'][i % 3],
  nextAction: ['Confirm buyer needs', 'Schedule discovery call', 'Arrange sample preview', 'Check trial progress', 'Review feedback'][i % 5],
  feedback: i % 5 === 4 ? { comfort: 3 + (i % 3), grip: 3 + ((i + 1) % 3), durability: 2 + (i % 4) } : null,
}));

export function filterLeads(records, filters, end = '2026-11-17') {
  const date = new Date(`${end}T00:00:00Z`);
  if (filters.period !== 'all') date.setUTCDate(date.getUTCDate() - (filters.period === '7' ? 6 : 29));
  const start = filters.period === 'all' ? '' : date.toISOString().slice(0, 10);
  return records.filter(l => l.date >= start && (filters.period === 'all' || l.date <= end) &&
    (filters.channel === 'All channels' || l.channel === filters.channel) &&
    (filters.audience === 'All audiences' || l.audience === filters.audience));
}

export function summarize(records) {
  const qualified = records.filter(l => l.stage >= 1).length;
  const samples = records.filter(l => l.stage >= 2).length;
  const trials = records.filter(l => l.stage >= 3).length;
  const feedback = records.filter(l => l.stage >= 4).length;
  return { total: records.length, qualified, samples, trials, feedback, conversion: qualified ? samples / qualified * 100 : 0 };
}

// Interest means reaching Sample requested or any later stage, once per lead.
export function interestLeaders(records, field) {
  const groups = new Map();
  for (const lead of records) {
    const group = groups.get(lead[field]) || { label: lead[field], total: 0, requests: 0 };
    group.total++;
    if (lead.stage >= 2) group.requests++;
    groups.set(lead[field], group);
  }
  const max = Math.max(0, ...[...groups.values()].map(group => group.requests));
  return {
    max,
    leaders: max ? [...groups.values()].filter(group => group.requests === max) : [],
  };
}

// Protect spreadsheet users from formula interpretation when exporting free text.
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^\s*[=+@\-]/.test(text) || /^[\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
