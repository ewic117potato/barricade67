const $=(id)=>document.getElementById(id);
const escapeHTML=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const socket=io({reconnection:true,reconnectionDelay:750,reconnectionDelayMax:5000});
const PALETTE=['#35e0c2','#ffb54a','#a48cff','#ff6588'];
let roomRefreshTimer=null,lastEventSeen=0,eventTimeout=null,view=null,selected=null,selectedPassive=null,selectedClass=false,tool='move',orientation='h',hover=null,animation=new Map(),wallAnimation=new Map(),shockwaves=[],lastN=9,toastTimeout=null,lastPhase='',lastRound=0,sparks=[];
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let soundOn=localStorage.getItem('barricade-sound')==='on',audioCtx=null;
function sound(type){if(!soundOn)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();const now=audioCtx.currentTime,osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.connect(gain);gain.connect(audioCtx.destination);osc.type=type==='win'?'triangle':type==='wall'?'sawtooth':'sine';let f=type==='draft'?540:type==='win'?600:type==='wall'?160:type==='skill'?750:380;osc.frequency.setValueAtTime(f,now);osc.frequency.exponentialRampToValueAtTime(f*(type==='wall'?.55:1.35),now+.17);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.035,now+.018);gain.gain.exponentialRampToValueAtTime(.0001,now+.24);osc.start(now);osc.stop(now+.25);}catch{}}
function renderSoundButton(){$('soundBtn').textContent=soundOn?'♫ Sound: on':'♫ Sound: off';$('soundBtn').setAttribute('aria-pressed',String(soundOn));}
$('soundBtn').onclick=()=>{soundOn=!soundOn;localStorage.setItem('barricade-sound',soundOn?'on':'off');renderSoundButton();sound('skill');};renderSoundButton();
const SIDE=720,PAD=51,AREA=618,canvas=$('board'),ctx=canvas.getContext('2d');
// Crisp retina backing store while gameplay coordinates remain the original 720-unit board.
const pixelRatio=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(SIDE*pixelRatio);canvas.height=Math.round(SIDE*pixelRatio);ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
const storage={
 get name(){return localStorage.getItem('arena-name')||'';},
 set name(v){localStorage.setItem('arena-name',v);},
 get token(){let t=sessionStorage.getItem('arena-guest-token');if(!t){t=crypto.randomUUID()+crypto.randomUUID();sessionStorage.setItem('arena-guest-token',t);}return t;},
 set token(v){sessionStorage.setItem('arena-guest-token',v);},
 get room(){return sessionStorage.getItem('arena-room')||'';},
 set room(v){if(v)sessionStorage.setItem('arena-room',v);else sessionStorage.removeItem('arena-room');}
};
$('guestName').value=storage.name||`Guest${Math.floor(Math.random()*900)+100}`;
$('joinCode').value=new URLSearchParams(location.search).get('room')?.toUpperCase()||'';
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.add('hidden'),3200);}
function api(name,data={}){return new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Server did not respond. Check the connection.')),8500);socket.emit(name,data,res=>{clearTimeout(t);if(res?.ok)resolve(res);else reject(Error(res?.error||'Unable to complete request.'));});});}
async function attempt(name,data){try{return await api(name,data);}catch(e){toast(e.message);return null;}}
function settingsFrom(root){return Object.fromEntries([...root.querySelectorAll('[data-setting]')].map(el=>[el.dataset.setting,el.dataset.setting==='centerGoal'?el.value==='true':Number(el.value)]));}
function renderHostSettings(){
 const host=$('lobbySettingsHost');host.classList.toggle('hidden',!view.host);
 if(!view.host)return;
 const target=$('lobbySettings');if(target.dataset.initialized==='yes')return;
 target.innerHTML=$('homeSettings').innerHTML;
 for(const el of target.querySelectorAll('[data-setting]'))el.value=view.settings[el.dataset.setting];
 $('lobbyModeControl').value=String(view.mode);$('lobbyBotsControl').checked=view.fillBots;$('lobbyPublicControl').checked=view.publicRoom;
 target.dataset.initialized='yes';
}

function renderClassChooser(){
 const library=view.classLibrary||[],mine=me(),current=mine?.classId||'vanguard';
 const selectedClassMeta=library.find(x=>x.id===current)||library[0];
 $('selectedClassPill').textContent=`${selectedClassMeta?.icon||'⚡'} ${(selectedClassMeta?.name||'Vanguard').toUpperCase()}`;
 $('classGrid').innerHTML=library.map(c=>`<button class="hero-class ${current===c.id?'picked':''}" style="--class-color:${c.color}" data-class="${c.id}" aria-pressed="${current===c.id}"><span class="hero-class-icon">${c.icon}</span><strong>${escapeHTML(c.name)}</strong><small>${escapeHTML(c.tag)}</small><span class="hero-check">${current===c.id?'✓ SELECTED':'CHOOSE'}</span></button>`).join('');
 $('classDetail').innerHTML=selectedClassMeta?`<span class="panel-kicker">${escapeHTML(selectedClassMeta.title)}</span><p>${escapeHTML(selectedClassMeta.desc)}</p><div><b>✦ ${escapeHTML(selectedClassMeta.skill)}</b> · ${escapeHTML(selectedClassMeta.skillDesc)}</div><small>Starts with ${escapeHTML((window.cardIndex||[]).find(c=>c.id===selectedClassMeta.starter)?.name||selectedClassMeta.starter.replaceAll('_',' '))}. Mastery II after 4 turns; III after 9 turns.</small>`:'';
 for(const b of $('classGrid').querySelectorAll('[data-class]'))b.onclick=async()=>{if(b.dataset.class===current)return;const r=await attempt('class',{classId:b.dataset.class});if(r){toast('Class selected: '+(library.find(x=>x.id===b.dataset.class)?.name||''));sound('skill');}};
}
function renderClassSkill(){
 const meta=(view.classLibrary||[]).find(x=>x.id===me()?.classId),skill=view.classSkill;
 $('myClassBadge').textContent=`${meta?.icon||'⚡'} ${(meta?.name||'Vanguard').toUpperCase()}  /  MASTERY ${skill?.tier||1}`;
 if(!meta||!skill){$('classSkillPanel').innerHTML='';return;}
 if((skill.readyIn>0||!myTurn())&&selectedClass){selectedClass=false;tool='move';}
 const ready=skill.readyIn===0,active=selectedClass;
 const turns=me()?.turnsTaken||1;const masteryProgress=skill.tier===3?100:skill.tier===2?Math.min(100,Math.max(0,(turns-4)*20)):Math.min(100,Math.max(0,(turns-1)*100/3));
 $('classSkillPanel').innerHTML=`<div class="class-special" style="--class-color:${meta.color}"><div class="class-special-symbol">${meta.icon}</div><div class="class-special-text"><div class="class-special-eyebrow">CLASS ABILITY · MASTERY ${skill.tier}</div><strong>${escapeHTML(skill.name)}</strong><small>${escapeHTML(meta.skillDesc)}</small></div><button id="classSkillBtn" class="class-special-button ${active?'engaged':''}" ${(!ready||!myTurn())?'disabled':''}>${!ready?'⏳ '+skill.readyIn+' turn'+(skill.readyIn!==1?'s':''):'✦ '+(active?'CANCEL':'ACTIVATE')}</button></div>`;
 $('classSkillBtn').onclick=async()=>{
  if(!ready||!myTurn())return;
  if(skill.kind==='instant') {const res=await attempt('action',{type:'activate',classSkill:true});if(res)sound('skill');return;}
  if(selectedClass){selectedClass=false;tool='move';}else{selectedClass=true;selected=null;selectedPassive=null;tool=skill.kind==='wall'?'wall':'move';sound('skill');}
  renderGame();
 };
 $('masteryPanel').innerHTML=`<div class="mastery-head"><span>⚔ ${escapeHTML(meta.name)} mastery</span><b>TIER ${skill.tier} / 3</b></div><div class="mastery-track"><span style="width:${masteryProgress}%"></span></div><small>Skill recharge: ${skill.maxCooldown} personal turns · Upgrades on turns 4 & 9</small>`;
}
$('saveSettingsBtn').onclick=async()=>{
 const res=await attempt('settings',{mode:Number($('lobbyModeControl').value),fillBots:$('lobbyBotsControl').checked,publicRoom:$('lobbyPublicControl').checked,settings:settingsFrom($('lobbySettings'))});
 if(res)toast('Host settings updated for everyone.');
};
function currentName(){let name=$('guestName').value.trim().replace(/[^\p{L}\p{N} _.-]/gu,'').slice(0,18)||'Guest';storage.name=name;return name;}
function setRoom(code,token){storage.room=code;if(token)storage.token=token;history.replaceState({},'',`${location.pathname}?room=${encodeURIComponent(code)}`);}
function showScreen(which){for(const x of ['home','lobby','game'])$(`${x}Screen`).classList.toggle('hidden',which!==x);if(which==='home')refreshLobbies();}
async function refreshLobbies(){
 if(!$('homeScreen')||$('homeScreen').classList.contains('hidden')||!socket.connected)return;
 const list=$('publicLobbyList');
 try{
  const data=await api('lobbies');
  if(!data.lobbies.length){list.innerHTML='<div class="empty-lobbies">🔎 No public rooms waiting yet. Create one above and invite players!</div>';return;}
  list.innerHTML=data.lobbies.map(r=>`<button class="public-room" data-public-code="${escapeHTML(r.code)}"><span class="public-room-icon">◈</span><span class="public-room-info"><strong>${escapeHTML(r.host)}’s lobby</strong><small>${r.mode} players · ${r.centerGoal?'🎯 Center win':'🏁 Edge win'} · ${r.eventEvery?'🌪 Events':'Calm'}</small></span><span class="public-occupancy">${r.players}/${r.mode}</span><span class="public-room-join">JOIN ↗</span></button>`).join('');
  for(const btn of list.querySelectorAll('[data-public-code]'))btn.onclick=()=>joinCode(btn.dataset.publicCode);
 }catch(e){list.innerHTML='<p class="muted small">Can’t load public rooms. Try Refresh.</p>';}
}
$('refreshLobbiesBtn').onclick=refreshLobbies;
roomRefreshTimer=setInterval(()=>{if($('homeScreen')&&!$('homeScreen').classList.contains('hidden'))refreshLobbies();},8000);
function me(){return view?.players.find(p=>p.id===view?.me);}
function myTurn(){return view?.phase==='play'&&view?.players[view.turn]?.id===view?.me;}
function selectedCard(){return view?.hand.find(x=>x.uid===selected)?.card||null;}
function resetSelection(){selected=null;selectedPassive=null;selectedClass=false;tool='move';hover=null;}
function render(){if(!view)return;
 if(view.phase==='lobby'){showScreen('lobby');renderLobby();}
 else{showScreen('game');renderGame();}
}
$('createBtn').onclick=async()=>{
 const v=await attempt('create',{name:currentName(),token:storage.token,mode:Number($('modeSelect').value),fillBots:$('botsCheck').checked,settings:settingsFrom($('homeSettings')),publicRoom:$('homePublic').checked});if(v)setRoom(v.code,v.token);
};
async function joinCode(code){
 code=code.trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{4}$/.test(code)){toast('Enter your 4-character room code.');return;}
 const v=await attempt('join',{code,token:storage.token,name:currentName()});if(v)setRoom(v.code,v.token);
}
$('joinBtn').onclick=()=>joinCode($('joinCode').value);
$('joinCode').onkeydown=e=>{if(e.key==='Enter')$('joinBtn').click();};
function leaveToHome(){storage.room='';view=null;$('lobbySettings').dataset.initialized='';resetSelection();history.replaceState({},'',location.pathname);showScreen('home');}
$('leaveLobbyBtn').onclick=async()=>{await attempt('leave');leaveToHome();};
$('leaveGameBtn').onclick=()=>{if(confirm('Leave this game? Your seat will remain in the room, and a bot will take over while you are gone.')){socket.emit('leave',{},()=>{});leaveToHome();}};
$('homeBtn').onclick=()=>{if(view){if(!confirm('Exit the current room?'))return;socket.emit('leave',{},()=>{});}leaveToHome();};
$('backToMenuBtn').onclick=()=>{socket.emit('leave',{},()=>{});leaveToHome();};
$('startBtn').onclick=()=>attempt('start');
$('copyCodeBtn').onclick=()=>copy(view?.code,'Room code copied.');
$('copyLinkBtn').onclick=()=>copy(`${location.origin}${location.pathname}?room=${view?.code}`,'Invite link copied.');
$('shareGameBtn').onclick=()=>copy(`${location.origin}${location.pathname}?room=${view?.code}`,'Invite link copied.');
async function copy(value,msg){try{await navigator.clipboard.writeText(value);toast(msg);}catch{window.prompt('Copy this:',value);}}
function renderLobby(){
 renderClassChooser();
 $('displayCode').textContent=view.code;
 const parts=[];
 for(let seat=0;seat<view.mode;seat++){
  const p=view.players.find(x=>x.seat===seat);
  parts.push(p?`<div class="lobby-seat"><div class="seat-dot" style="background:${PALETTE[seat]};color:${PALETTE[seat]}"></div><div><div class="seat-name">${escapeHTML(p.name)} ${p.id===view.me?'(you)':''}</div><div class="seat-sub">${p.bot?'BOT':p.connected?'CONNECTED':'OFFLINE'} • PLAYER ${seat+1} · ${escapeHTML((view.classLibrary||[]).find(c=>c.id===p.classId)?.name||'Vanguard').toUpperCase()}</div></div></div>`:`<div class="lobby-seat empty-seat"><span style="font-size:20px">＋</span><div><div class="seat-name">Waiting for player</div><div class="seat-sub">PLAYER ${seat+1}</div></div></div>`);
 }
 $('lobbyPlayers').innerHTML=parts.join('');
 $('lobbyMode').textContent=`${view.publicRoom?'PUBLIC':'PRIVATE'} · ${view.mode} players · ${view.fillBots?'Bots enabled':'Humans only'} · Expand ${view.settings.expandEvery?`every ${view.settings.expandEvery} rounds`:'off'} · Draft ${view.settings.draftEvery?`every ${view.settings.draftEvery} rounds`:'off'} · ${view.settings.startingCards} starting cards · ${view.settings.cardsPerDraft}/draft · ${view.settings.cardsPerTurn}/turn · ${view.settings.eventEvery?'Events every '+view.settings.eventEvery+' rounds':'No events'} · ${view.mode===4&&view.settings.centerGoal?'🎯 Center win':'Edge win'}`;
 renderHostSettings();
 $('startBtn').classList.toggle('hidden',!view.host);
 $('startBtn').disabled=!view.fillBots&&view.players.length<view.mode;
 $('lobbyHint').textContent=view.host?(view.fillBots?'Start now, or share the link so friends can join first.':'Waiting for every player to join…'):'Waiting for the host to start the match…';
}
function renderGame(){
 $('roundTitle').textContent=`ROUND ${String(view.round).padStart(2,'0')}  /  ${view.n} × ${view.n}`;
 $('gameRoomLabel').textContent=`${view.publicRoom?'PUBLIC':'PRIVATE'} ROOM ${view.code}  ·  ${view.mode} PLAYERS`;
 const center=view.mode===4&&view.settings.centerGoal;
 $('arenaObjectiveHint').textContent=center?'✦ REACH THE MIDDLE CORE':'◉ REACH YOUR OPPOSITE EDGE';
 $('liveObjective').classList.toggle('hidden',view.mode!==4);
 $('objectiveLabel').textContent=center?'🎯 CENTER CORE TO WIN':'🏁 OPPOSITE EDGE TO WIN';
 $('centerLiveBtn').classList.toggle('hidden',!view.host||view.phase==='finished');
 $('centerLiveBtn').textContent=center?'Disable core goal':'Enable core goal';
 $('eventLiveBtn').classList.toggle('hidden',!view.host||view.phase==='finished');
 $('eventLiveBtn').textContent=view.settings.eventEvery?'🌪 Disable random events':'🌤 Enable random events';
 const active=view.players[view.turn];
 const status=view.phase==='draft'?'Card drafting in progress':view.phase==='finished'?'Match finished':myTurn()?'YOUR TURN — choose an action':`${active?.name||'Another player'} is playing…`;
 $('subStatus').textContent=status;
 $('playerCards').innerHTML=view.players.map(p=>`<div class="player-item ${view.phase==='play'&&active?.id===p.id?'turn':''}" style="--player:${PALETTE[p.seat]}"><div class="player-line"><span class="pawn-mini">${p.seat+1}</span><div class="player-name">${escapeHTML(p.name)}</div>${view.phase==='play'&&active?.id===p.id?'<span class="turn-chip">TURN</span>':''}</div><div class="seat-sub">${(view.classLibrary||[]).find(c=>c.id===p.classId)?.icon||'⚡'} ${escapeHTML((view.classLibrary||[]).find(c=>c.id===p.classId)?.name||'Vanguard')} · ${p.bot?'BOT':p.connected?'ONLINE':'OFFLINE · BOT TAKING OVER'}${p.id===view.me?' • YOU':''}</div><div class="wall-bag">▰ ${p.walls} walls &nbsp;&nbsp;✦ ${p.passiveCount} passives &nbsp;&nbsp;✧ ${p.handCount} items</div><button class="inspect-cards" data-inspect="${escapeHTML(p.id)}">🃏 View cards & passives ↗</button></div>`).join('');
 for(const btn of $('playerCards').querySelectorAll('[data-inspect]'))btn.onclick=()=>showPlayerCards(btn.dataset.inspect);
 $('history').innerHTML=[...view.history].reverse().map(t=>`<p>${escapeHTML(t)}</p>`).join('');
 if(selected&&!view.hand.some(x=>x.uid===selected))resetSelection();
 renderHand();renderPassives();renderClassSkill();
 $('moveTool').classList.toggle('active',tool==='move');$('wallTool').classList.toggle('active',tool==='wall');
 const card=selectedCard();$('wallToolLabel').textContent=`${orientation==='h'?'Horizontal':'Vertical'} · ${selectedClass&&view.classSkill?.kind==='wall'?view.classSkill.power:card?.kind==='wall'?card.length:view.wallLength} tiles`;
 const hint=!myTurn()?'Wait for your turn.':selectedClass&&view.classSkill?.kind==='remove'?'Click a barricade to SHATTER it.':selectedClass?'CLASS ABILITY ACTIVE — choose a glowing target.':card?.kind==='remove'?'Select a glowing wall to remove it.':card?.kind==='target'?'Select an opponent from the target buttons on the right.':tool==='wall'?'Click to place a wall. Press R to rotate.':selectedPassive?'Choose a highlighted destination for your '+selectedPassive+' ability.':card?.kind==='move'?'Choose a highlighted destination for '+card.name+'.':'Click a glowing tile to move, or select Wall mode.';
 $('playHint').textContent=hint;
 $('draftOverlay').classList.toggle('hidden',view.phase!=='draft');
 $('winOverlay').classList.toggle('hidden',view.phase!=='finished');
 if(view.phase==='draft')renderDraft();
 if(view.phase==='finished'){const winner=view.players.find(x=>x.id===view.winner);$('winnerTitle').textContent=`${winner?.name||'Someone'} wins!`;$('winnerDesc').textContent=`${winner?.name||'The winner'} reached ${view.mode===4&&view.settings.centerGoal?'the middle core':'the opposite edge'} first.`;}
}
function renderHand(){
 const hand=$('handCards');
 if(!view.hand.length){hand.innerHTML='<p class="muted small">No cards yet. Draft one at the beginning of every round!</p>';return;}
 hand.innerHTML=view.hand.map(item=>{const c=item.card;return `<button class="card ${selected===item.uid?'equipped':''}" data-card="${escapeHTML(item.uid)}"><span class="card-icon">${c.icon}</span><div class="card-text"><div class="card-name">${escapeHTML(c.name)}</div><div class="rarity ${c.rarity}">${c.rarity}</div><div class="card-detail">${escapeHTML(c.desc)}</div></div></button>`;}).join('');
 for(const b of hand.querySelectorAll('[data-card]'))b.onclick=async()=>{
  const uid=b.dataset.card,item=view.hand.find(x=>x.uid===uid),c=item?.card;if(!c)return;
  if(!myTurn()){toast('Wait until it is your turn to use a card.');return;}
  if(c.kind==='instant'){await attempt('action',{type:'activate',cardId:uid});return;}
  if(selected===uid){resetSelection();renderGame();return;}
  selectedClass=false;selectedPassive=null;selected=uid;tool=c.kind==='wall'?'wall':'move';renderGame();
 };
 const c=selectedCard();
 if(c?.kind==='target'&&myTurn()){
  const wrap=document.createElement('div');wrap.innerHTML=`<p class="panel-kicker">SELECT A TARGET</p><div style="display:flex;flex-direction:column;gap:7px">${view.players.filter(p=>p.id!==view.me).map(p=>`<button class="secondary" data-target="${p.id}" style="justify-content:space-between;padding:10px 12px;font-size:12px">${escapeHTML(p.name)} <span>↗</span></button>`).join('')}</div>`;
  hand.append(wrap);for(const btn of wrap.querySelectorAll('[data-target]'))btn.onclick=()=>attempt('action',{type:'target',targetPlayerId:btn.dataset.target,cardId:selected});
 }
}
function renderPassives(){
 const el=$('passiveCards');$('passiveCount').textContent=`${view.passives.length} equipped`;
 el.innerHTML=view.passives.length?view.passives.map(p=>`<div class="passive-card rarity-border-${p.card.rarity}"><span class="passive-icon">${p.card.icon}</span><div><strong>${escapeHTML(p.card.name)}</strong><span class="passive-level"> LVL ${p.level} / 3</span><div class="rarity ${p.card.rarity}">${p.card.rarity} · PERMANENT</div><p>${escapeHTML(p.card.desc)}</p></div></div>`).join(''):'<p class="muted small">No passive upgrades yet. Draft a permanent ability to build your class.</p>';
 const bar=$('passiveToolbar');const skillNames={stride:'⚡ Sprint',diagonal:'↗ Diagonal',vault:'🦘 Vault',blink:'🌀 Blink',portal:'🌌 Portal'};
 bar.innerHTML=Object.entries(view.passiveOptions||{}).filter(([,moves])=>moves.length).map(([effect,moves])=>`<button class="skill-btn ${selectedPassive===effect?'active':''}" data-skill="${effect}">${skillNames[effect]} <small>${moves.length} tiles</small></button>`).join('');
 for(const b of bar.querySelectorAll('[data-skill]'))b.onclick=()=>{const effect=b.dataset.skill;if(!myTurn())return;selected=null;selectedClass=false;selectedPassive=selectedPassive===effect?null:effect;tool='move';renderGame();};
 if(selectedPassive&&!view.passiveOptions?.[selectedPassive])selectedPassive=null;
}
function renderDraft(){
 const choices=$('draftChoices');const waiting=!view.options.length;
 choices.classList.toggle('hidden',waiting);$('draftWaiting').classList.toggle('hidden',!waiting);
 $('draftEyebrow').textContent=`${view.draftReason||'POWER DRAFT'} · ${view.draftLeft} PICK${view.draftLeft===1?'':'S'} REMAINING`;
 $('draftDesc').textContent='Permanent abilities stay with you all game. Copies level up to 3. Consumables are single-use. Pick one of three.';
 choices.innerHTML=view.options.map(c=>`<button class="draft-choice rarity-border-${c.rarity}" data-pick="${c.id}"><div class="card-flare"></div><span class="card-type">${c.kind==='passive'?'♾ PERMANENT PASSIVE':'✦ ONE-TIME USE'}</span><div class="emoji">${c.icon}</div><div class="rarity ${c.rarity}">${c.rarity}</div><strong>${escapeHTML(c.name)}</strong><div class="description">${escapeHTML(c.desc)}</div><span class="panel-kicker">EQUIP THIS CARD ↗</span></button>`).join('');
 for(const btn of choices.querySelectorAll('[data-pick]'))btn.onclick=()=>attempt('pick',{cardId:btn.dataset.pick});
}
$('eventLiveBtn').onclick=async()=>{if(!view?.host)return;const enabled=view.settings.eventEvery===0;const res=await attempt('eventToggle',{enabled});if(res)toast(enabled?'🌪 Chaos events enabled.':'🌤 Random events turned off.');};
$('centerLiveBtn').onclick=async()=>{if(!view?.host||view.mode!==4)return;const enabled=!view.settings.centerGoal;const res=await attempt('centerGoal',{enabled});if(res){toast(enabled?'🎯 Center goal enabled!':'🏁 Classic edge goal restored.');sound('skill');}};
$('eventDismissBtn').onclick=()=>{$('eventBanner').classList.add('hidden');clearTimeout(eventTimeout);};
function showEventBanner(event){
 if(!event)return;
 $('eventIcon').textContent=event.icon;
 $('eventName').textContent=event.name;
 $('eventDesc').textContent=event.desc;
 const banner=$('eventBanner');banner.classList.remove('hidden');banner.classList.remove('event-animate');void banner.offsetWidth;banner.classList.add('event-animate');
 clearTimeout(eventTimeout);eventTimeout=setTimeout(()=>banner.classList.add('hidden'),6200);
}
function showPlayerCards(id){
 const p=view?.players.find(x=>x.id===id);if(!p)return;
 const passive=(p.loadout?.passives||[]).map(({card,level})=>`<div class="inspected-card rarity-border-${card.rarity}"><span>${card.icon}</span><div><strong>${escapeHTML(card.name)} <em>LVL ${level}</em></strong><small>${escapeHTML(card.desc)}</small></div></div>`).join('')||'<p class="muted small">No permanent passives yet.</p>';
 const items=(p.loadout?.hand||[]).map(card=>`<div class="inspected-card rarity-border-${card.rarity}"><span>${card.icon}</span><div><strong>${escapeHTML(card.name)}</strong><small>${escapeHTML(card.desc)}</small></div></div>`).join('')||'<p class="muted small">No unused one-time cards.</p>';
 openModal('Player Cards',`<p class="inspect-intro">${escapeHTML(p.name)} · ${(view.classLibrary||[]).find(c=>c.id===p.classId)?.name||'Vanguard'} · ${p.walls} walls</p><h3 class="inspect-heading">♾ Active passives (${p.passiveCount})</h3><div class="inspect-list">${passive}</div><h3 class="inspect-heading">🃏 Unused one-time cards (${p.handCount})</h3><div class="inspect-list">${items}</div><p class="muted small">Card loadouts are visible to all players in this version. Your private draft offers stay hidden until chosen.</p>`);
}
$('clearCardBtn').onclick=()=>{resetSelection();render();};
$('moveTool').onclick=()=>{selectedClass=false;const c=selectedCard();if(c&&c.kind!=='move')selected=null;tool='move';render();};
$('wallTool').onclick=()=>{selectedClass=false;const c=selectedCard();if(c&&c.kind!=='wall')selected=null;selectedPassive=null;tool='wall';render();};
$('rotateTool').onclick=()=>{orientation=orientation==='h'?'v':'h';render();};
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(!$('globalModal').classList.contains('hidden')){if(e.key==='Escape')closeModal();return;}if(!view||view.phase!=='play')return;if(e.key==='1')$('moveTool').click();if(e.key==='2')$('wallTool').click();if(e.key.toLowerCase()==='r')$('rotateTool').click();if(e.key==='Escape')$('clearCardBtn').click();});
function rules(){return `<h3>⚔ Hero Classes</h3><p>Choose one of six evolving classes in the lobby. Each starts with a permanent passive and has a special class skill. The skill recharges after a number of your own turns, and upgrades at mastery tiers 2 (turn 4) and 3 (turn 9). Class abilities are validated by the game server.</p><div class="rules-content"><h3>🏁 Winning</h3><p>In classic mode race to the opposite edge. In four-player mode the host can choose <strong>Reach the CORE</strong> instead, where stepping onto the glowing center tile wins instantly. Hosts can switch the active objective during a match, with the new goal applying to the next action.</p><h3>🌪 Random events</h3><p>When events are enabled, the server triggers a random effect after the configured number of rounds: bonus walls, card comet, quake, wall tax, rift rush, or a full Reckoning. Turn them off in the lobby.</p><h3>🌐 Public lobbies</h3><p>Public rooms are listed to anyone visiting this server. Private rooms appear only by room code. In a match, use View cards beside a player to inspect their equipped passives and unused consumables; draft options remain secret until picked.</p><h3>♾ Permanent Passives</h3><p>Passive cards are equipped as soon as you draft them, last the whole match, and stack up to level 3. Examples include Trail Runner (multi-step movement), Wall Jumper (periodic wall vault), larger barricades, recurring wall income, refunds, teleportation and extra actions. Use the glowing skill buttons below the board to activate movement passives. Timed passives reset by personal turns.</p><h3>✦ One-time cards</h3><p>Consumables go into your item hand (maximum 12). Click an item to equip it, then choose a legal target. Supply items activate without ending your turn.</p><h3>🎴 Drafts</h3><p>Every player privately chooses from 3 randomly offered cards simultaneously. A host can set the initial number of card picks, draft frequency, picks per draft, and automatic card awards at the start of personal turns. Higher rarities are harder to find: Common 44%, Uncommon 29%, Rare 16%, Epic 7%, Legendary 3%, Mythic 1%.</p><h3>🧱 Walls and map</h3><p>Each turn move, use a power, or build a barricade. Walls cannot overlap, cross or completely block any player from reaching the finish. Passive abilities can extend regular barricades up to 4 squares. The host chooses how frequently the arena gains a new outer ring, up to 17×17.</p><h3>🌐 Online play</h3><p>Share a four-character lobby code or invite link to play together. The server validates moves and card effects. Private rooms use guest nicknames, no accounts required. Active matches reset if your host restarts the server.</p></div>`;}
let filter='All';
function classesHTML(){const library=view?.classLibrary||window.classIndex||[];return `<p class="muted">Choose a class in the lobby. Each one gets a starter passive, an active skill with a cooldown, and tier upgrades on personal turns 4 and 9.</p><div class="index-grid class-index">${library.map(c=>`<div class="index-card" style="--rarity:${c.color};border-color:${c.color}66"><div class="class-index-emblem">${c.icon}</div><span class="panel-kicker">${escapeHTML(c.tag)}</span><h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.desc)}</p><p><b>${escapeHTML(c.skill)}</b> — ${escapeHTML(c.skillDesc)}</p><small>Starting passive: ${escapeHTML(c.starter.replaceAll('_',' '))}</small></div>`).join('')}</div>`;}
async function loadClasses(){try{window.classIndex=await(await fetch('/classes.json')).json();}catch{window.classIndex=[];}}loadClasses();
function indexHTML(){const tiers=['All','Passive','One-time','Common','Uncommon','Rare','Epic','Legendary','Mythic'];return `<div class="index-filter">${tiers.map(t=>`<button class="filter-btn ${filter===t?'active':''}" data-filter="${t}">${t}</button>`).join('')}</div><div class="index-grid" id="indexGrid"></div>`;}
function drawIndex(){const grid=$('indexGrid');if(!grid)return;grid.innerHTML=(window.cardIndex||[]).filter(c=>filter==='All'||filter==='Passive'&&c.kind==='passive'||filter==='One-time'&&c.kind!=='passive'||c.rarity===filter).map(c=>`<div class="index-card rarity-border-${c.rarity}"><span class="card-type">${c.kind==='passive'?'♾ PASSIVE':'✦ CONSUMABLE'}</span><br><span style="font-size:28px">${c.icon}</span><div style="margin-top:8px"><b>${escapeHTML(c.name)}</b></div><div class="rarity ${c.rarity}">${c.rarity}</div><p>${escapeHTML(c.desc)}</p></div>`).join('');}
// The card index is shipped as a tiny standalone JSON file, so the entire website can show it before joining.
async function loadIndex(){try{window.cardIndex=await(await fetch('/cards.json')).json();if(!$('globalModal').classList.contains('hidden')&&$('modalTitle').textContent==='Card Index')drawIndex();}catch{window.cardIndex=[];}}
loadIndex();
function openModal(title,content){$('modalTitle').textContent=title;$('modalEyebrow').textContent=title==='Rules'?'THE BASICS':title==='Classes'?'CHOOSE YOUR HERO':'YOUR ABILITY COLLECTION';$('modalContent').innerHTML=content;$('globalModal').classList.remove('hidden');if(title==='Card Index'){drawIndex();for(const b of $('modalContent').querySelectorAll('[data-filter]'))b.onclick=()=>{filter=b.dataset.filter;openModal('Card Index',indexHTML());};}}
function closeModal(){$('globalModal').classList.add('hidden');}
$('closeModalBtn').onclick=closeModal;$('globalModal').addEventListener('click',e=>{if(e.target===$('globalModal'))closeModal();});
$('rulesBtn').onclick=()=>openModal('Rules',rules());$('indexBtn').onclick=()=>openModal('Card Index',indexHTML());$('classesBtn').onclick=()=>openModal('Classes',classesHTML());

// Responsive high-DPI canvas board, with interpolation on pawn movements.
function coord(e){const rect=canvas.getBoundingClientRect();return{x:(e.clientX-rect.left)*SIDE/rect.width,y:(e.clientY-rect.top)*SIDE/rect.height};}
function tileSize(){return AREA/(view?.n||9);}
function clickTarget(pt){if(!view)return null;const s=tileSize(),n=view.n,x=(pt.x-PAD)/s,y=(pt.y-PAD)/s;
 if(x<0||y<0||x>=n||y>=n)return null;
 const card=selectedCard();
 if(card?.kind==='remove'||selectedClass&&view.classSkill?.kind==='remove'){
  const candidates=view.walls.map(w=>({w,d:wallDistance(pt,w,s)})).filter(x=>x.d<s*.25).sort((a,b)=>a.d-b.d);
  return candidates[0]?{type:'remove',wallId:candidates[0].w.id,...(selectedClass?{classSkill:true}:{cardId:selected})}:null;
 }
 if(card?.kind==='target')return null;
 if(tool==='move')return{type:'move',to:{r:Math.floor(y),c:Math.floor(x)},...(selectedClass?{classSkill:true}:selected?{cardId:selected}:selectedPassive?{passiveId:selectedPassive}:{})};
 const len=selectedClass&&view.classSkill?.kind==='wall'?view.classSkill.power:card?.kind==='wall'?card.length:view.wallLength;
 const o=orientation;
 const w=o==='h'?{o,r:Math.round(y-1),c:Math.round(x-len/2)}:{o,r:Math.round(y-len/2),c:Math.round(x-1)};
 if(w.r<0||w.c<0||(o==='h'?(w.r>=n-1||w.c+len>n):(w.c>=n-1||w.r+len>n)))return null;
 return{type:'wall',wall:w,...(selectedClass?{classSkill:true}:selected?{cardId:selected}:{})};
}
function wallDistance(pt,w,s){const ax=PAD+(w.o==='h'?w.c:w.c+1)*s,ay=PAD+(w.o==='h'?w.r+1:w.r)*s,bx=ax+(w.o==='h'?w.len:0)*s,by=ay+(w.o==='v'?w.len:0)*s;return w.o==='h'?Math.hypot(pt.x-Math.max(ax,Math.min(bx,pt.x)),pt.y-ay):Math.hypot(pt.x-ax,pt.y-Math.max(ay,Math.min(by,pt.y)));}
canvas.addEventListener('pointermove',e=>{hover=clickTarget(coord(e));});
canvas.addEventListener('pointerleave',()=>hover=null);
canvas.addEventListener('pointerdown',async e=>{if(!myTurn())return;const action=clickTarget(coord(e));if(!action){toast('Select a valid destination or target.');return;}const result=await attempt('action',action);if(result){sound(action.classSkill?'skill':action.type==='wall'?'wall':'step');if(action.classSkill){selectedClass=false;tool='move';}}});
function rounded(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function wall(w,s,ghost=false,ts=performance.now()){
 const x=PAD+(w.o==='h'?w.c:w.c+1)*s,y=PAD+(w.o==='h'?w.r+1:w.r)*s;
 const x2=x+(w.o==='h'?w.len:0)*s,y2=y+(w.o==='v'?w.len:0)*s;
 const centerX=(x+x2)/2,centerY=(y+y2)/2;
 const born=wallAnimation.get(w.id);let reveal=1;
 if(!ghost&&born&&!reduceMotion){reveal=Math.min(1,(ts-born)/360);reveal=1-Math.pow(1-reveal,3);if(reveal>=1)wallAnimation.delete(w.id);}
 const sx=centerX+(x-centerX)*reveal,sy=centerY+(y-centerY)*reveal,ex=centerX+(x2-centerX)*reveal,ey=centerY+(y2-centerY)*reveal;
 const color=ghost?'#74ffe9':PALETTE[view.players.find(p=>p.id===w.owner)?.seat??0];
 ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=color;ctx.shadowBlur=ghost?17:16;
 ctx.lineWidth=Math.max(10,s*.18);ctx.strokeStyle='#081425';ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
 ctx.lineWidth=Math.max(7,s*.125);ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.shadowBlur=0;
 ctx.lineWidth=Math.max(2,s*.028);ctx.strokeStyle=ghost?'#f2fffd':'#e8faffac';ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
 if(!ghost&&reveal>.75){const nodes=Math.max(2,Math.floor(w.len+1));for(let i=0;i<=nodes;i++){const t=i/nodes,nx=sx+(ex-sx)*t,ny=sy+(ey-sy)*t;ctx.fillStyle='#081425';ctx.beginPath();ctx.arc(nx,ny,Math.max(2,s*.057),0,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.arc(nx,ny,Math.max(1.3,s*.028),0,Math.PI*2);ctx.fill();}}
}
function frame(ts){requestAnimationFrame(frame);if(!view||view.phase==='lobby'||$('gameScreen').classList.contains('hidden'))return;
 const n=view.n,s=tileSize();ctx.clearRect(0,0,SIDE,SIDE);
 const bg=ctx.createLinearGradient(0,0,SIDE,SIDE);bg.addColorStop(0,'#18314e');bg.addColorStop(.55,'#0c182d');bg.addColorStop(1,'#091428');ctx.fillStyle=bg;rounded(20,20,SIDE-40,SIDE-40,21);ctx.fill();
 ctx.save();ctx.strokeStyle='#70bfff0c';ctx.lineWidth=1;for(let k=18;k<SIDE-18;k+=22){ctx.beginPath();ctx.moveTo(k,18);ctx.lineTo(k,SIDE-18);ctx.stroke();}ctx.restore();
 ctx.fillStyle='#869ab7';ctx.font='bold 14px Outfit, sans-serif';ctx.textAlign='center';ctx.fillText('NORTH ▲',SIDE/2,32);ctx.fillText('SOUTH ▼',SIDE/2,SIDE-23);
 ctx.save();ctx.translate(30,SIDE/2);ctx.rotate(-Math.PI/2);ctx.fillText('WEST',0,0);ctx.restore();ctx.save();ctx.translate(SIDE-30,SIDE/2);ctx.rotate(Math.PI/2);ctx.fillText('EAST',0,0);ctx.restore();
 for(let r=0;r<n;r++)for(let c=0;c<n;c++){
  const alt=(r+c)%2===0;ctx.fillStyle=alt?'#192c49':'#101f36';
  rounded(PAD+c*s+1,PAD+r*s+1,s-2,s-2,Math.max(4,s*.105));ctx.fill();
  const goals=[];if(!((view.mode===4)&&view.settings.centerGoal)&&r===0)goals.push(PALETTE[0]);if(!((view.mode===4)&&view.settings.centerGoal)&&r===n-1)goals.push(PALETTE[1]);if(c===n-1&&view.mode>=3&&!(view.mode===4&&view.settings.centerGoal))goals.push(PALETTE[2]);if(c===0&&view.mode>=4&&!(view.mode===4&&view.settings.centerGoal))goals.push(PALETTE[3]);
  if(goals.length){ctx.fillStyle=goals[0]+'1b';rounded(PAD+c*s+3,PAD+r*s+3,s-6,s-6,Math.max(3,s*.09));ctx.fill();}
 }
 if(view.mode===4&&view.settings.centerGoal){
  const mid=(n-1)/2,cx=PAD+(mid+.5)*s,cy=PAD+(mid+.5)*s;
  const pulse=reduceMotion?0.8:0.7+0.3*Math.sin(ts/280);
  ctx.save();const aura=ctx.createRadialGradient(cx,cy,2,cx,cy,s*.85);aura.addColorStop(0,'#ffe7a960');aura.addColorStop(1,'#ffb54300');ctx.fillStyle=aura;ctx.fillRect(cx-s,cy-s,s*2,s*2);
  ctx.shadowBlur=25*pulse;ctx.shadowColor='#ffdd8a';ctx.strokeStyle='#ffdb84';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(cx,cy,s*.35,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffefb5';ctx.textAlign='center';ctx.font=`900 ${Math.max(12,s*.19)}px Outfit, sans-serif`;ctx.fillText('CORE',cx,cy+4);
  ctx.restore();
 }
 if(myTurn()&&tool==='move'){
  const card=selectedCard();const moves=selectedClass&&view.classSkill?.kind==='move'?view.classSkill.moves:selectedPassive?view.passiveOptions?.[selectedPassive]||[]:card?.kind==='move'?view.moveOptions?.[selected]||[]:view.legal||[];
  for(const m of moves){ctx.fillStyle='#5ceac83c';rounded(PAD+m.c*s+4,PAD+m.r*s+4,s-8,s-8,Math.max(5,s*.12));ctx.fill();ctx.beginPath();ctx.arc(PAD+(m.c+.5)*s,PAD+(m.r+.5)*s,Math.max(5,s*.10),0,Math.PI*2);ctx.fillStyle='#8bffe3';ctx.fill();}
 }
 for(const w of view.walls)wall(w,s,false,ts);
 // Short-lived impact fragments, drawn above walls and below pawns.
 sparks=sparks.filter(q=>ts-q.start<800);
 for(const q of sparks){const elapsed=Math.max(0,ts-q.start),t=Math.min(1,elapsed/750);
  ctx.globalAlpha=(1-t)*(.8+Math.sin(t*15)*.2);ctx.fillStyle=q.color;
  ctx.shadowColor=q.color;ctx.shadowBlur=9;
  ctx.beginPath();ctx.arc(q.x+q.vx*t,q.y+q.vy*t+30*t*t,Math.max(.4,q.size*(1-t)),0,Math.PI*2);ctx.fill();
 }
 ctx.shadowBlur=0;ctx.globalAlpha=1;
 if(myTurn()&&hover?.type==='move'&&tool==='move'){const moves=selectedClass?view.classSkill?.moves:selectedPassive?view.passiveOptions?.[selectedPassive]:selectedCard()?.kind==='move'?view.moveOptions?.[selected]:view.legal;if(moves?.some(m=>m.r===hover.to.r&&m.c===hover.to.c)){const x=PAD+(hover.to.c+.5)*s,y=PAD+(hover.to.r+.5)*s;ctx.strokeStyle='#ebfffd';ctx.lineWidth=3;ctx.strokeRect(x-s*.33,y-s*.33,s*.66,s*.66);}}
 if(myTurn()&&hover?.type==='wall')wall({...hover.wall,len:selectedClass&&view.classSkill?.kind==='wall'?view.classSkill.power:selectedCard()?.kind==='wall'?selectedCard().length:view.wallLength},s,true);
 if(myTurn()&&(selectedCard()?.kind==='remove'||selectedClass&&view.classSkill?.kind==='remove'))for(const w of view.walls){if(selectedCard().effect==='reclaim'&&w.owner!==view.me)continue;ctx.strokeStyle='#f4cc7d';ctx.setLineDash([5,5]);ctx.lineWidth=2;ctx.strokeRect(PAD+(w.c-.08)*s,PAD+(w.r-.08)*s,s*.3,s*.3);ctx.setLineDash([]);}
 for(const p of view.players){
  let r=p.pos.r,c=p.pos.c,hop=0;
  const a=animation.get(p.id);
  if(a){const t=Math.min(1,(ts-a.start)/(reduceMotion?1:330)),ease=1-Math.pow(1-t,4);
   r=a.from.r+(p.pos.r-a.from.r)*ease;c=a.from.c+(p.pos.c-a.from.c)*ease;
   hop=Math.sin(t*Math.PI)*s*.18;
   if(!reduceMotion){
    const x0=PAD+(a.from.c+.5)*s,y0=PAD+(a.from.r+.5)*s;
    ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(PAD+(c+.5)*s,PAD+(r+.5)*s);
    ctx.strokeStyle=PALETTE[p.seat]+'70';ctx.lineWidth=Math.max(3,s*.12)*(1-t);ctx.lineCap='round';ctx.shadowBlur=14;ctx.shadowColor=PALETTE[p.seat];ctx.stroke();ctx.shadowBlur=0;
   }
   if(t>=1)animation.delete(p.id);
  }
  const cx=PAD+(c+.5)*s,cy=PAD+(r+.5)*s-hop,rad=s*.29;
  const cls=(view.classLibrary||[]).find(x=>x.id===p.classId),color=PALETTE[p.seat];
  ctx.beginPath();ctx.ellipse(cx,cy+rad*.87,rad*.97,rad*.4,0,0,Math.PI*2);ctx.fillStyle='#020914a8';ctx.fill();
  if(view.phase==='play'&&view.players[view.turn]?.id===p.id){
   ctx.strokeStyle=color+'ad';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy,rad+7+Math.sin(ts/290)*1.5,0,Math.PI*2);ctx.stroke();
   const ang=ts/850;ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,rad+10,ang,ang+Math.PI*.55);ctx.strokeStyle='#edfffd';ctx.stroke();
  }
  const gradient=ctx.createLinearGradient(cx-rad,cy-rad,cx+rad,cy+rad);gradient.addColorStop(0,'#f8ffff');gradient.addColorStop(.13,color);gradient.addColorStop(1,'#101e36');
  ctx.shadowBlur=23;ctx.shadowColor=color;ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='#faffffb0';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(cx,cy,rad-2,Math.PI*1.05,Math.PI*1.87);ctx.stroke();
  ctx.fillStyle='#091625';ctx.font=`900 ${Math.max(17,s*.32)}px Outfit,system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(cls?.icon||String(p.seat+1),cx,cy+1);ctx.textBaseline='alphabetic';
  // Seat indicator is always visible, regardless of emoji font availability.
  ctx.fillStyle='#0d1826';ctx.beginPath();ctx.arc(cx+rad*.78,cy-rad*.7,Math.max(6,s*.115),0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font=`900 ${Math.max(10,s*.15)}px Outfit,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(p.seat+1),cx+rad*.78,cy-rad*.7);ctx.textBaseline='alphabetic';
 }
 // Pulses follow new movements, explosions and class activations.
 shockwaves=shockwaves.filter(q=>ts-q.start<650);
 for(const q of shockwaves){const t=Math.min(1,(ts-q.start)/650);ctx.save();ctx.globalAlpha=(1-t)*.55;ctx.strokeStyle=q.color;ctx.shadowColor=q.color;ctx.shadowBlur=20;ctx.lineWidth=4*(1-t)+.7;ctx.beginPath();ctx.arc(q.x,q.y,6+t*q.radius,0,Math.PI*2);ctx.stroke();ctx.restore();}
}
requestAnimationFrame(frame);

function announce(msg,cls=''){
 const el=$('fxAnnounce');el.textContent=msg;el.className='fx-announce '+cls;
 clearTimeout(announce.timer);announce.timer=setTimeout(()=>el.classList.add('hidden'),1500);
 const box=$('particles');for(let i=0;i<26;i++){const particle=document.createElement('i');
  particle.style.setProperty('--x',`${Math.random()*100}%`);particle.style.setProperty('--y',`${Math.random()*90}%`);
  particle.style.setProperty('--dx',`${Math.random()*250-125}px`);particle.style.setProperty('--dy',`${Math.random()*-240-60}px`);
  particle.style.setProperty('--delay',`${Math.random()*.28}s`);box.appendChild(particle);setTimeout(()=>particle.remove(),1800);
 }
}
socket.on('connect',()=>{
 if(!storage.room)refreshLobbies();
 $('connText').textContent='Connected';$('connLight').classList.add('on');
 if(storage.room)api('join',{code:storage.room,token:storage.token,name:storage.name||$('guestName').value}).then(()=>{}).catch(err=>{toast(err.message);leaveToHome();});
});
socket.on('disconnect',()=>{$('connText').textContent='Reconnecting…';$('connLight').classList.remove('on');});
socket.on('state',v=>{
 if(view&&v.n===view.n){for(const p of v.players){const prev=view.players.find(x=>x.id===p.id);if(prev&&(prev.pos.r!==p.pos.r||prev.pos.c!==p.pos.c)){animation.set(p.id,{from:{...prev.pos},start:performance.now()});if(!reduceMotion){const ss=AREA/v.n;shockwaves.push({x:PAD+(p.pos.c+.5)*ss,y:PAD+(p.pos.r+.5)*ss,start:performance.now(),radius:ss*.7,color:p.color});}}}}else{animation.clear();wallAnimation.clear();}
 if(view&&v.n===view.n){
  const prevIds=new Set(view.walls.map(w=>w.id));
  const s=AREA/v.n;
  for(const w of v.walls.filter(w=>!prevIds.has(w.id))){
   wallAnimation.set(w.id,performance.now());
   const owner=v.players.find(p=>p.id===w.owner);
   const cx=PAD+(w.o==='h'?w.c+w.len/2:w.c+1)*s;
   const cy=PAD+(w.o==='v'?w.r+w.len/2:w.r+1)*s;
   for(let i=0;i<22;i++){const angle=Math.random()*Math.PI*2,force=25+Math.random()*85;
    sparks.push({x:cx,y:cy,vx:Math.cos(angle)*force,vy:Math.sin(angle)*force,start:performance.now(),color:owner?.color||'#76ffe0',size:2+Math.random()*3});
   }
  }
  const newIds=new Set(v.walls.map(w=>w.id));
  for(const old of view.walls.filter(w=>!newIds.has(w.id))){
   const cx=PAD+(old.o==='h'?old.c+old.len/2:old.c+1)*s,cy=PAD+(old.o==='v'?old.r+old.len/2:old.r+1)*s;
   shockwaves.push({x:cx,y:cy,start:performance.now(),radius:85,color:'#ff9ba7'});
   for(let i=0;i<18;i++){const angle=Math.random()*6.28,force=35+Math.random()*85;sparks.push({x:cx,y:cy,vx:Math.cos(angle)*force,vy:Math.sin(angle)*force,start:performance.now(),color:'#ffb0bb',size:2+Math.random()*4});}
   wallAnimation.delete(old.id);
  }
 }
 const newEvent=v.lastEvent?.seq&&(!view||v.lastEvent.seq!==view.lastEvent?.seq)?v.lastEvent:null;
 const objectiveSwitched=view&&v.settings.centerGoal!==view.settings.centerGoal&&v.mode===4;
 const expanded=view&&v.n>view.n;
 const evolved=view&&view.me&&v.players.find(p=>p.id===v.me)?.mastery>view.players.find(p=>p.id===view.me)?.mastery;
 const startedDraft=v.phase==='draft'&&lastPhase!=='draft';
 const finished=v.phase==='finished'&&lastPhase!=='finished';
 view=v;lastN=v.n;lastPhase=v.phase;lastRound=v.round;render();
 if(newEvent){showEventBanner(newEvent);announce(`${newEvent.icon} ${newEvent.name}`,'event');sound('skill');}
 if(objectiveSwitched){announce(v.settings.centerGoal?'🎯 REACH THE CORE':'🏁 CLASSIC EDGE RACE','evolution');}
 if(expanded){announce(`ARENA EXPANSION · ${v.n} × ${v.n}`,'expansion');sound('skill');}
 else if(evolved){announce(`MASTERY ${v.players.find(p=>p.id===v.me)?.mastery} UNLOCKED`,'evolution');sound('skill');}
 else if(startedDraft){announce('NEW POWER DRAFT','draft');sound('draft');}
 else if(finished){announce(v.winner===v.me?'VICTORY':'MATCH COMPLETE','victory');sound('win');}
});
showScreen('home');
