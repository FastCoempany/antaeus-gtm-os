const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'antaeus');
const norm=s=>s.toLowerCase().replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
let html=fs.readdirSync(root+'/preview-transcript').filter(x=>fs.existsSync(root+'/preview-transcript/'+x+'/index.html')).map(x=>[x,[...fs.readFileSync(root+'/preview-transcript/'+x+'/index.html','utf8').matchAll(/<div class="line"><span class="kind">\[([^\]]+)\]<\/span>\s*([\s\S]*?)\s*<span class="cue">([\s\S]*?)<\/span><\/div>/g)].map(m=>norm(m[2])).join('\n')]);
const j=JSON.parse(fs.readFileSync(__dirname+'/original-working-set/01_USER_FACING_COPY_INVENTORY.json'));
for(let i=0;i<j.records.length;i++){let r=j.records[i];if(r.severity_0_to_5<2)continue;let t=norm(r.text.split(' — small,')[0].split(' — top of page')[0]);let hits=html.filter(([room,text])=>text.includes(t));if(hits.length)console.log(i+' | '+r.severity_0_to_5+' | '+hits.map(x=>x[0]).join(',')+' | '+r.text);}
