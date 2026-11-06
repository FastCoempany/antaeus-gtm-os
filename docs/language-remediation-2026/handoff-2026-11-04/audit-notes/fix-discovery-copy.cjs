const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'antaeus');
const ts=require(path.join(root,'node_modules/typescript'));
const replacements=[
['Inspect the deal read','Review the deal assessment'],['Classify the motion','Classify the workflow'],['classifying the motion','classifying the workflow'],
['Map the manager read','Map the manager assessment'],['Open executive pressure','Review executive priorities'],['Find the GC pressure',"Identify the General Counsel's current priority"],
['Map the supplier review motion','Map the supplier review process'],['Map the current motion','Map the current process'],['Open backlog pressure','Review backlog constraints'],
['product adoption read','product adoption evidence'],['manual read','manual assessment'],['operating read','operating assessment'],
['live motion','current workflow'],['current inspection motion','current deal-review process'],['operating motion','workflow'],['enablement motion','enablement process'],['support motion','support workflow'],
['the motion stays real','the process can continue'],['overplay the motion','assume the process is further along than it is'],['wrong motion','wrong workflow'],['active motion','active deal process'],['current motion','current process'],
['thin evidence','limited evidence'],['evidence was too thin','evidence was insufficient'],['thin the evidence','limited the evidence'],['thinner signal than it should','less evidence than it needs'],
['trust is thin','confidence in the data is limited'],['late, thin, or too noisy','late, incomplete, or too noisy'],['late or thin','late or incomplete'],['feed goes thin','feed has coverage gaps'],['feed gets thin','feed has coverage gaps'],['feed still goes thin','feed still has coverage gaps'],['data layer goes thin','data layer has coverage gaps'],
['real what is actually happening','specific information about the current process'],['carry only the earned truth','carry only the confirmed facts'],['earned truth','confirmed facts'],['truth debt','unresolved evidence gaps'],
['The buyer is trying to exit without a real move.','The buyer has not yet agreed to a specific next step.'],['They are trying to skip diagnosis.','The buyer has asked to see the product before describing the workflow.'],
['AI theater','general AI exploration'],['so this does not become another AI info loop','so the follow-up supports a specific decision'],
['The approval sequence is still imaginary.','No approval sequence has been confirmed.'],['The room is still too broad.','The proposed scope is still too broad.'],['the fuel line','the data infrastructure'],
['Trust rescue is part of the current process.','Human review is part of the current process.'],['The stall was ownership, not technology alone.','The buyer identified unclear ownership as a reason the pilot stalled.']
];
const ledger=[];
for(const name of fs.readdirSync(root+'/js').filter(x=>/^discovery-segment-runtime.*\.js$/.test(x))){
 const file=root+'/js/'+name,old=fs.readFileSync(file,'utf8');const ast=ts.createSourceFile(name,old,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);const edits=[];
 function visit(node){if(ts.isStringLiteral(node)&&/\s/.test(node.text)){let value=node.text;for(const [a,b] of replacements)value=value.split(a).join(b);if(value!==node.text){edits.push({start:node.getStart(ast),end:node.end,value:JSON.stringify(value)});ledger.push({file:'js/'+name,line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1,original:node.text,replacement:value});}}ts.forEachChild(node,visit);}
 visit(ast);let next=old;for(const e of edits.reverse())next=next.slice(0,e.start)+e.value+next.slice(e.end);if(next!==old)fs.writeFileSync(file,next);
}
fs.writeFileSync(__dirname+'/discovery-copy-changes.json',JSON.stringify(ledger,null,2)+'\n');console.log('Revised '+ledger.length+' contextual Discovery strings; no identifiers or targets changed.');
