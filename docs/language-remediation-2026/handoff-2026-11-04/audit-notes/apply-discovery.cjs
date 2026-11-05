const fs = require('fs');
const path = 'supabase/functions/outdoors-events-discovery/index.ts';
let source = fs.readFileSync(path, 'utf8');
source = source.slice(0, source.indexOf('async function upsertEvents(')) + fs.readFileSync('../discovery-bottom.txt', 'utf8');
fs.writeFileSync(path, source);
