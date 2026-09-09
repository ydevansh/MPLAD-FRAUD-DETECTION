async function runTests() {
  const endpoints = [
    { name: 'Projects list', url: 'http://localhost:5000/api/projects' },
    { name: 'Project detail', url: 'http://localhost:5000/api/projects/MPLAD-UP-001' },
    { name: 'Project intelligence', url: 'http://localhost:5000/api/projects/MPLAD-UP-001/intelligence' },
    { name: 'Project anomalies', url: 'http://localhost:5000/api/projects/MPLAD-UP-001/anomalies' },
    { name: 'Project risk', url: 'http://localhost:5000/api/projects/MPLAD-UP-001/risk' },
    { name: 'Project location (far)', url: 'http://localhost:5000/api/projects/MPLAD-UP-001/location?latitude=26.8467&longitude=80.9462' },
    { name: 'Project location (close)', url: 'http://localhost:5000/api/projects/MPLAD-UP-001/location?latitude=26.9856&longitude=80.9324' },
    { name: 'Admin summary', url: 'http://localhost:5000/api/admin/summary' },
    { name: 'Admin attention', url: 'http://localhost:5000/api/admin/attention' },
    { name: 'Admin anomalies', url: 'http://localhost:5000/api/admin/anomalies' },
    { name: 'Admin risk', url: 'http://localhost:5000/api/admin/risk' },
    { name: 'Frontend Home', url: 'http://localhost:5173/' },
    { name: 'Frontend Nearby', url: 'http://localhost:5173/nearby' },
    { name: 'Frontend Details', url: 'http://localhost:5173/projects/MPLAD-UP-001' },
    { name: 'Frontend Admin', url: 'http://localhost:5173/admin' },
  ];

  console.log('🚀 Running End-to-End API and Page Health Verification:\n');
  let passed = 0;
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url);
      if (res.ok) {
        console.log(`  ✓ ${ep.name} (${res.status} ${res.statusText})`);
        passed++;
      } else {
        console.error(`  ✗ ${ep.name} (${res.status} ${res.statusText})`);
      }
    } catch (err) {
      console.error(`  ✗ ${ep.name}: ${err.message}`);
    }
  }
  console.log(`\n=============================`);
  console.log(`Passed: ${passed} / ${endpoints.length}`);
  console.log(`=============================\n`);

  if (passed !== endpoints.length) {
    process.exit(1);
  }
}
runTests();
