#!/usr/bin/env node
/**
 * Deliberately injects bugs (one at a time) into each tested unit and checks that the
 * unit tests fail. Every file is restored afterwards, even on Ctrl+C.
 *
 *   node scripts/inject-bugs.cjs          # run all
 *   node scripts/inject-bugs.cjs vehicle  # only bugs whose id contains "vehicle"
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const u = (f) => path.join(root, 'src/utils', f);
const pg = (f) => path.join(root, 'src/pages', f);

const BUGS = [
  // --- searchQuery.ts -------------------------------------------------------
  { id: 'search-1', file: u('searchQuery.ts'), test: 'searchQuery',
    desc: 'HP -> kW multiplies instead of divides',
    from: 'Math.round(value / HP_PER_KW)', to: 'Math.round(value * HP_PER_KW)' },
  { id: 'search-2', file: u('searchQuery.ts'), test: 'searchQuery',
    desc: 'HP -> kW truncates instead of rounding',
    from: 'Math.round(value / HP_PER_KW)', to: 'Math.floor(value / HP_PER_KW)' },
  { id: 'search-3', file: u('searchQuery.ts'), test: 'searchQuery',
    desc: 'UI-only powerUnit is sent to the backend',
    from: '  delete params.powerUnit;\n', to: '' },
  { id: 'search-4', file: u('searchQuery.ts'), test: 'searchQuery',
    desc: 'yearFrom no longer mapped to first_registration',
    from: 'if (params.yearFrom) params.first_registration = params.yearFrom;', to: '' },

  // --- vehicleList.ts -------------------------------------------------------
  { id: 'vehicle-1', file: u('vehicleList.ts'), test: 'vehicleList',
    desc: 'listings without price sorted first',
    from: 'if (!aOk) return 1;', to: 'if (!aOk) return -1;' },
  { id: 'vehicle-2', file: u('vehicleList.ts'), test: 'vehicleList',
    desc: 'totalPages uses floor (last partial page lost)',
    from: 'Math.ceil(items.length / perPage)', to: 'Math.floor(items.length / perPage)' },
  { id: 'vehicle-3', file: u('vehicleList.ts'), test: 'vehicleList',
    desc: 'off-by-one page offset',
    from: 'const start = (current - 1) * perPage;', to: 'const start = current * perPage;' },
  { id: 'vehicle-4', file: u('vehicleList.ts'), test: 'vehicleList',
    desc: 'car inferred from fuel_type OR gearbox',
    from: "has('fuel_type') && has('gearbox')", to: "has('fuel_type') || has('gearbox')" },

  // --- validation.ts --------------------------------------------------------
  { id: 'valid-1', file: u('validation.ts'), test: 'validation',
    desc: 'phone upper bound 14 instead of 15 digits',
    from: '\\d{6,15}', to: '\\d{6,14}' },
  { id: 'valid-2', file: u('validation.ts'), test: 'validation',
    desc: 'year 1900 rejected (< became <=)',
    from: 'year < 1900', to: 'year <= 1900' },
  { id: 'valid-3', file: u('validation.ts'), test: 'validation',
    desc: 'zero rejected as negative',
    from: '} else if (v < 0) {', to: '} else if (v <= 0) {' },
  { id: 'valid-4', file: u('validation.ts'), test: 'validation',
    desc: 'requires make AND model instead of make OR model',
    from: '!pref.make?.trim() && !pref.model?.trim()', to: '!pref.make?.trim() || !pref.model?.trim()' },

  // --- recommendations.ts ---------------------------------------------------
  { id: 'reco-1', file: u('recommendations.ts'), test: 'recommendations',
    desc: 'fallbacks run even after a match',
    from: '          found.forEach(add);\n          break;', to: '          found.forEach(add);' },
  { id: 'reco-2', file: u('recommendations.ts'), test: 'recommendations',
    desc: 'no 12-item cap',
    from: 'if (out.length < MAX_RECOMMENDATIONS && item &&', to: 'if (item &&' },
  { id: 'reco-3', file: u('recommendations.ts'), test: 'recommendations',
    desc: 'no de-duplication by _id',
    from: '!out.some((x) => x._id === item._id)', to: 'true' },
  { id: 'reco-4', file: u('recommendations.ts'), test: 'recommendations',
    desc: 'one failing preference aborts all (try/catch removed per preference)',
    from: "      console.error(`Recommendation lookup failed for ${type}:`, err);\n",
    to: '      throw err;\n' },

  // --- Watchlist.tsx (existing test, reviewed) ------------------------------
  { id: 'watch-1', file: pg('Watchlist.tsx'), test: 'Watchlist',
    desc: 'remove clears the whole list',
    from: 'const updated = watchlist.filter((item: any) => item._id !== id);', to: 'const updated: Vehicle[] = [];' },
  { id: 'watch-2', file: pg('Watchlist.tsx'), test: 'Watchlist',
    desc: 'list shown regardless of which user is logged in',
    from: 'const watchlistKey = `watchlist-${user.uid}`;\n    try {', to: "const watchlistKey = Object.keys(localStorage).find((k) => k.startsWith('watchlist-')) ?? '';\n    try {" },
];

const originals = new Map();
const restoreAll = () => { for (const [f, src] of originals) fs.writeFileSync(f, src); };
process.on('SIGINT', () => { restoreAll(); process.exit(130); });

const runJest = (pattern) => {
  // Run Jest's own entry point with the current Node binary: works on Windows too,
  // where spawning "npx" needs a shell and the shell would mangle "(" and "|".
  const jestBin = require.resolve('jest/bin/jest', { paths: [root] });
  const r = spawnSync(process.execPath,
    [jestBin, '--silent', '--coverage=false', '--reporters', 'default', '--testPathPattern', pattern],
    { cwd: root, encoding: 'utf8' });
  const out = r.stdout + r.stderr;
  const failed = Number((out.match(/Tests:\s+(\d+) failed/) || [])[1] || 0);
  const passed = Number((out.match(/(\d+) passed/) || [])[1] || 0);
  return { status: r.status, failed, passed, out };
};

// A bug only counts as caught if real assertions fail. A crash, a compile error or a
// mis-parsed CLI flag also gives a non-zero exit code, which would look like a success.
const baseline = runJest('__tests__/(searchQuery|vehicleList|validation|recommendations|Watchlist)');
if (baseline.status !== 0 || baseline.passed === 0) {
  console.error('Baseline run is not green - fix the tests first.\n' + baseline.out.slice(-2000));
  process.exit(2);
}

const filter = process.argv[2];
let caught = 0, survived = 0, broken = 0;
const rows = [];

for (const bug of BUGS.filter((b) => !filter || b.id.includes(filter))) {
  if (!originals.has(bug.file)) originals.set(bug.file, fs.readFileSync(bug.file, 'utf8'));
  const src = originals.get(bug.file);
  if (!src.includes(bug.from)) {
    restoreAll();
    console.error(`✗ ${bug.id}: pattern not found in ${path.basename(bug.file)}`);
    process.exit(2);
  }
  fs.writeFileSync(bug.file, src.replace(bug.from, bug.to));
  const r = runJest(`__tests__/${bug.test}`);
  fs.writeFileSync(bug.file, src);

  let verdict;
  if (r.failed > 0) { verdict = 'CAUGHT  '; caught++; }
  else if (r.status === 0) { verdict = 'SURVIVED'; survived++; }
  else { verdict = 'ERROR   '; broken++; }
  rows.push(`${verdict}  ${bug.id.padEnd(10)} ${String(r.failed).padStart(2)} failing  ${bug.desc}`);
}
restoreAll();

console.log(rows.join('\n'));
console.log(`\n${caught} caught, ${survived} survived, ${broken} errored (no assertion failed)`);
process.exit(survived === 0 && broken === 0 ? 0 : 1);
