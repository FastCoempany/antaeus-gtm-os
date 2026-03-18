// ═══════════════════════════════════════════════════
// Test the enrichment server with a real company
// Run: node test-enrich.js
// ═══════════════════════════════════════════════════

const company = process.argv[2] || "Datadog";
const domain = process.argv[3] || "";

console.log(`\nTesting enrichment for: ${company}${domain ? ` (${domain})` : ""}\n`);

fetch("http://localhost:3001/enrich", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: company,
    ...(domain ? { domain } : {}),
  })
})
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.error("ERROR:", data.error);
      process.exit(1);
    }
    console.log(`Company: ${data.name}`);
    console.log(`Heat Score: ${data.heat}`);
    console.log(`Signals: ${data.signals.length}`);
    console.log(`Time: ${data.elapsed}\n`);

    if (data.debug && Array.isArray(data.debug.lanes)) {
      console.log("Lane summary:");
      data.debug.lanes.forEach((lane) => {
        console.log(
          `  - ${lane.label}: ${lane.signalCount} signals, ${lane.evidenceCount} evidence items, ${lane.candidateCount} candidates${lane.error ? `, error: ${lane.error}` : ""}`,
        );
      });
      console.log();
    }

    data.signals.forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.cat}] ${s.headline}`);
      console.log(`     ${s.detail.slice(0, 100)}...`);
      console.log(`     Why: ${s.why_it_matters.slice(0, 100)}...`);
      console.log(`     Source: ${s.source_name} | ${s.published_date} | ${Math.round(s.confidence * 100)}% conf`);
      console.log();
    });

    if (data.info) {
      console.log("Profile snapshot:");
      console.log(`  Industry: ${data.info.industry}`);
      console.log(`  Revenue: ${data.info.revenue}`);
      console.log(`  Employees: ${data.info.employees}`);
      console.log(`  HQ: ${data.info.hq}`);
    }
  })
  .catch(e => {
    console.error("Could not connect to server. Is it running on port 3001?");
    console.error(e.message);
  });
