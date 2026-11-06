const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const root = path.join(__dirname,'antaeus');
const ts = require(path.join(root,'node_modules/typescript'));
const files = cp.execFileSync('git',['diff','--name-only','origin/main...HEAD','--','src'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>!f.endsWith('.tsx')&&!f.includes('.test.'));
const output=path.join(__dirname,'frontend-normalized');fs.mkdirSync(output,{recursive:true});
function normalize(source,file) {
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
 const result=ts.transform(ast,[context=>node=>ts.visitNode(node,function visit(n){
  if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)) return ts.factory.createStringLiteral('STRING');
  if(ts.isTemplateHead(n)) return ts.factory.createTemplateHead('TEXT');
  if(ts.isTemplateMiddle(n)) return ts.factory.createTemplateMiddle('TEXT');
  if(ts.isTemplateTail(n)) return ts.factory.createTemplateTail('TEXT');
  return ts.visitEachChild(n,visit,context);
 })]);
 return ts.createPrinter({removeComments:true}).printFile(result.transformed[0]);
}
let all='';const summary=[];
for(const f of files){
const old=cp.execFileSync('git',['show',`origin/main:${f}`],{cwd:root,encoding:'utf8'});
const current=fs.readFileSync(path.join(root,f),'utf8');
const a=path.join(output,'old.ts'),b=path.join(output,'new.ts');
fs.writeFileSync(a,normalize(old,f));fs.writeFileSync(b,normalize(current,f));
let diff='';try{diff=cp.execFileSync('git',['diff','--no-index','--unified=4',a,b],{encoding:'utf8'});}catch(e){diff=e.stdout;}
if(diff){all+=`\nFILE ${f}\n${diff}\n`;summary.push(f);}
}
fs.writeFileSync(path.join(__dirname,'frontend-logic-diff.txt'),all);
console.log(JSON.stringify({reviewed:files.length,changed:summary},null,2));
