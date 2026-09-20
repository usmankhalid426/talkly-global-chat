const fs=require('fs'),path=require('path');

const SITE_URL=process.env.SITE_URL||'https://talkly-global-chat1.onrender.com';
const MODEL=process.env.OPENAI_AGENT_MODEL||'gpt-5.6-luna';

function pageInventory(){
  const root=__dirname;
  const files=[];
  function walk(dir){
    for(const name of fs.readdirSync(dir,{withFileTypes:true})){
      if(name==='node_modules'||name.startsWith('.'))continue;
      const full=path.join(dir,name);
      if(name.endsWith('.html')) files.push('/'+path.relative(root,full).replace(/\\/g,'/'));
      else if(name==='chat') walk(full);
    }
  }
  walk(root);
  return files.slice(0,120);
}

async function openaiText(input,tools=[]){
  if(!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  const r=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{'Authorization':'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:MODEL,input,tools,store:false})
  });
  const data=await r.json();
  if(!r.ok) throw new Error(data?.error?.message||'OpenAI request failed');
  return data.output_text||'';
}

function parseJson(text){
  const clean=String(text).replace(/^\s*```(?:json)?/i,'').replace(/```\s*$/,'').trim();
  return JSON.parse(clean);
}

async function discoverIdeas(stats){
  const pages=pageInventory();
  const prompt=`You are Talkly's ethical growth agent. Goal: attract REAL people who want online text conversation, language exchange, meeting new people, travel chat, gaming chat, study chat and international friendship. Never recommend bots, fake traffic, spam, fake accounts, automated comments, link farms, doorway pages, or mass low-value pages.

Site: ${SITE_URL}
Existing HTML pages: ${pages.join(', ')}
Current first-party stats: ${JSON.stringify(stats)}

Research current public web search demand using the web search tool, then identify 5 genuinely useful content opportunities that Talkly can serve. Avoid duplicating existing pages. Prioritize specific user intent and topics that can naturally lead to a real Talkly conversation.

Return ONLY valid JSON:
{"ideas":[{"title":"...","slug":"lowercase-hyphen-slug","keyword":"...","audience":"...","intent":"...","rationale":"..."}]}`;
  return parseJson(await openaiText(prompt,[{type:'web_search'}]));
}

async function draftIdea(idea){
  const prompt=`Create a high-quality SEO landing page draft for Talkly.

Topic: ${idea.title}
Primary keyword: ${idea.keyword}
Audience: ${idea.audience}
Search intent: ${idea.intent}
Why it matters: ${idea.rationale}
Site: ${SITE_URL}

Rules:
- Useful, human-first content; no keyword stuffing.
- Do not claim Talkly has features it does not have.
- Explain the topic clearly and give a natural call to action to start a Talkly chat.
- Include practical sections, examples, and FAQs where useful.
- Do not imitate or copy another website.
- Return ONLY valid JSON with fields title, description, body.
- body must be safe HTML using only h2, h3, p, ul, li, strong, a, and no script/style tags.
- Keep body around 700-1200 words.`;
  return parseJson(await openaiText(prompt));
}

async function runGrowthAgent(db){
  const stats=(await db(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM matches) AS matches,
      (SELECT COUNT(*) FROM messages) AS messages,
      (SELECT COUNT(*) FROM users WHERE created_at >= NOW()-INTERVAL '7 days') AS new_users_7d,
      (SELECT COUNT(*) FROM matches WHERE created_at >= NOW()-INTERVAL '7 days') AS matches_7d,
      (SELECT COUNT(*) FROM messages WHERE created_at >= NOW()-INTERVAL '7 days') AS messages_7d
  `)).rows[0];
  const run=(await db('INSERT INTO agent_runs(run_type,status,summary) VALUES($1,$2,$3) RETURNING id',['growth','running','Started growth research'])).rows[0].id;
  try{
    const result=await discoverIdeas(stats);
    const ideas=Array.isArray(result.ideas)?result.ideas.slice(0,5):[];
    for(const x of ideas){
      const slug=String(x.slug||x.title||'idea').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,150);
      if(!slug)continue;
      await db('INSERT INTO content_ideas(title,slug,keyword,audience,intent,rationale,status) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,keyword=EXCLUDED.keyword,audience=EXCLUDED.audience,intent=EXCLUDED.intent,rationale=EXCLUDED.rationale',[String(x.title||'Untitled').slice(0,200),slug,String(x.keyword||'').slice(0,200),String(x.audience||'').slice(0,120),String(x.intent||'').slice(0,80),String(x.rationale||''),'idea']);
    }
    await db('UPDATE agent_runs SET status=$1,summary=$2 WHERE id=$3',['completed',`Found ${ideas.length} content opportunities`,run]);
    return {runId:run,ideasFound:ideas.length,stats};
  }catch(e){
    await db('UPDATE agent_runs SET status=$1,summary=$2 WHERE id=$3',['failed',e.message.slice(0,500),run]);
    throw e;
  }
}

module.exports={runGrowthAgent,draftIdea,SITE_URL,MODEL};
