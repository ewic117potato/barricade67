const $=(id)=>document.getElementById(id);
const escapeHTML=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const socket=io({reconnection:true,reconnectionDelay:750,reconnectionDelayMax:5000});
const PALETTE=['#35e0c2','#ffb54a','#a48cff','#ff6588'];
let view=null,selected=null,tool='move',orientation='h',hover=null,animation=new Map(),lastN=9,toastTimeout=null;
const SIDE=720,PAD=51,AREA=618,canvas=$('board'),ctx=canvas.getContext('2d');
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
function currentName(){let name=$('guestName').value.trim().replace(/[^\p{L}\p{N} _.-]/gu,'').slice(0,18)||'Guest';storage.name=name;return name;}
function setRoom(code,token){storage.room=code;if(token)storage.token=token;history.replaceState({},'',`${location.pathname}?room=${encodeURIComponent(code)}`);}
function showScreen(which){for(const x of ['home','lobby','game'])$(`${x}Screen`).classList.toggle('hidden',which!==x);}
function me(){return view?.players.find(p=>p.id===view?.me);}
function myTurn(){return view?.phase==='play'&&view?.players[view.turn]?.id===view?.me;}
function selectedCard(){return view?.hand.find(x=>x.uid===selected)?.card||null;}
function resetSelection(){selected=null;tool='move';hover=null;}
function render(){if(!view)return;
 if(view.phase==='lobby'){showScreen('lobby');renderLobby();}
 else{showScreen('game');renderGame();}
}
$('createBtn').onclick=async()=>{
 const v=await attempt('create',{name:currentName(),token:storage.token,mode:Number($('modeSelect').value),fillBots:$('botsCheck').checked});if(v)setRoom(v.code,v.token);
};
$('joinBtn').onclick=async()=>{
 const code=$('joinCode').value.trim().toUpperCase();if(code.length!==6){toast('Enter your 6-character room code.');return;}
 const v=await attempt('join',{code,token:storage.token,name:currentName()});if(v)setRoom(v.code,v.token);
};
$('joinCode').onkeydown=e=>{if(e.key==='Enter')$('joinBtn').click();};
function leaveToHome(){storage.room='';view=null;resetSelection();history.replaceState({},'',location.pathname);showScreen('home');}
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
 $('displayCode').textContent=view.code;
 const parts=[];
 for(let seat=0;seat<view.mode;seat++){
  const p=view.players.find(x=>x.seat===seat);
  parts.push(p?`<div class="lobby-seat"><div class="seat-dot" style="background:${PALETTE[seat]};color:${PALETTE[seat]}"></div><div><div class="seat-name">${escapeHTML(p.name)} ${p.id===view.me?'(you)':''}</div><div class="seat-sub">${p.bot?'BOT':p.connected?'CONNECTED':'OFFLINE'} • PLAYER ${seat+1}</div></div></div>`:`<div class="lobby-seat empty-seat"><span style="font-size:20px">＋</span><div><div class="seat-name">Waiting for player</div><div class="seat-sub">PLAYER ${seat+1}</div></div></div>`);
 }
 $('lobbyPlayers').innerHTML=parts.join('');
 $('lobbyMode').textContent=`${view.mode} players · ${view.fillBots?'Bots enabled':'Human players only'}`;
 $('startBtn').classList.toggle('hidden',!view.host);
 $('startBtn').disabled=!view.fillBots&&view.players.length<view.mode;
 $('lobbyHint').textContent=view.host?(view.fillBots?'Start now, or share the link so friends can join first.':'Waiting for every player to join…'):'Waiting for the host to start the match…';
}
function renderGame(){
 $('roundTitle').textContent=`Round ${view.round}  ·  ${view.n}×${view.n}`;
 $('gameRoomLabel').textContent=`ROOM ${view.code}  ·  ${view.mode} PLAYERS`;
 const active=view.players[view.turn];
 const status=view.phase==='draft'?'Card drafting in progress':view.phase==='finished'?'Match finished':myTurn()?'YOUR TURN — choose an action':`${active?.name||'Another player'} is playing…`;
 $('subStatus').textContent=status;
 $('playerCards').innerHTML=view.players.map(p=>`<div class="player-item ${view.phase==='play'&&active?.id===p.id?'turn':''}" style="--player:${PALETTE[p.seat]}"><div class="player-line"><span class="pawn-mini">${p.seat+1}</span><div class="player-name">${escapeHTML(p.name)}</div>${view.phase==='play'&&active?.id===p.id?'<span class="turn-chip">TURN</span>':''}</div><div class="seat-sub">${p.bot?'BOT':p.connected?'ONLINE':'OFFLINE · BOT TAKING OVER'}${p.id===view.me?' • YOU':''}</div><div class="wall-bag">▰ ${p.walls} walls &nbsp;&nbsp;✦ ${p.handCount} cards</div></div>`).join('');
 $('history').innerHTML=[...view.history].reverse().map(t=>`<p>${escapeHTML(t)}</p>`).join('');
 if(selected&&!view.hand.some(x=>x.uid===selected))resetSelection();
 renderHand();
 $('moveTool').classList.toggle('active',tool==='move');$('wallTool').classList.toggle('active',tool==='wall');
 const card=selectedCard();$('wallToolLabel').textContent=`${orientation==='h'?'Horizontal':'Vertical'} · ${card?.kind==='wall'?card.length:2} tiles`;
 const hint=!myTurn()?'Wait for your turn.':card?.kind==='remove'?'Select a glowing wall to remove it.':card?.kind==='target'?'Select an opponent from the target buttons on the right.':tool==='wall'?'Click to place a wall. Press R to rotate.':card?.kind==='move'?'Choose a highlighted destination for '+card.name+'.':'Click a glowing tile to move, or select Wall mode.';
 $('playHint').textContent=hint;
 $('draftOverlay').classList.toggle('hidden',view.phase!=='draft');
 $('winOverlay').classList.toggle('hidden',view.phase!=='finished');
 if(view.phase==='draft')renderDraft();
 if(view.phase==='finished'){const winner=view.players.find(x=>x.id===view.winner);$('winnerTitle').textContent=`${winner?.name||'Someone'} wins!`;$('winnerDesc').textContent=`${winner?.name||'The winner'} reached the opposite side first.`;}
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
  selected=uid;tool=c.kind==='wall'?'wall':'move';renderGame();
 };
 const c=selectedCard();
 if(c?.kind==='target'&&myTurn()){
  const wrap=document.createElement('div');wrap.innerHTML=`<p class="panel-kicker">SELECT A TARGET</p><div style="display:flex;flex-direction:column;gap:7px">${view.players.filter(p=>p.id!==view.me).map(p=>`<button class="secondary" data-target="${p.id}" style="justify-content:space-between;padding:10px 12px;font-size:12px">${escapeHTML(p.name)} <span>↗</span></button>`).join('')}</div>`;
  hand.append(wrap);for(const btn of wrap.querySelectorAll('[data-target]'))btn.onclick=()=>attempt('action',{type:'target',targetPlayerId:btn.dataset.target,cardId:selected});
 }
}
function renderDraft(){
 const choices=$('draftChoices');const waiting=!view.options.length;
 choices.classList.toggle('hidden',waiting);$('draftWaiting').classList.toggle('hidden',!waiting);
 choices.innerHTML=view.options.map(c=>`<button class="draft-choice" data-pick="${c.id}"><div class="emoji">${c.icon}</div><div class="rarity ${c.rarity}">${c.rarity}</div><strong>${escapeHTML(c.name)}</strong><div class="description">${escapeHTML(c.desc)}</div><span class="panel-kicker">PICK THIS CARD →</span></button>`).join('');
 for(const btn of choices.querySelectorAll('[data-pick]'))btn.onclick=()=>attempt('pick',{cardId:btn.dataset.pick});
}
$('clearCardBtn').onclick=()=>{resetSelection();render();};
$('moveTool').onclick=()=>{const c=selectedCard();if(c&&c.kind!=='move')selected=null;tool='move';render();};
$('wallTool').onclick=()=>{const c=selectedCard();if(c&&c.kind!=='wall')selected=null;tool='wall';render();};
$('rotateTool').onclick=()=>{orientation=orientation==='h'?'v':'h';render();};
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(!$('globalModal').classList.contains('hidden')){if(e.key==='Escape')closeModal();return;}if(!view||view.phase!=='play')return;if(e.key==='1')$('moveTool').click();if(e.key==='2')$('wallTool').click();if(e.key.toLowerCase()==='r')$('rotateTool').click();if(e.key==='Escape')$('clearCardBtn').click();});
function rules(){return `<div class="rules-content"><h3>Goal</h3><p>Reach the board edge opposite your starting edge before anyone else. Player 1 starts at the bottom and races up; Player 2 starts at the top and races down. Players 3 and 4 begin on the left and right edges.</p><h3>Turns and movement</h3><p>Each turn, move one tile up/down/left/right OR place a barricade. You may jump straight over a neighboring player if the square behind them is clear. If that jump is blocked, jump to a free tile beside them instead. Power cards introduce additional movement options.</p><h3>Barricade rules</h3><p>Standard barricades span 2 tile edges, horizontal or vertical. They cannot overlap or cross another wall and must leave a path from every player to their finish edge. Walls are permanent unless a card removes them. Use the Wall button and press R to rotate.</p><h3>Drafting and rarities</h3><p>Before every round (one turn per player), all players simultaneously choose one card from three options. Common (48%), Uncommon (29%), Rare (15%), Epic (6%), Legendary (2%) are the approximate appearance weights for each slot. Card effects happen when you use them on your turn; instant supply cards do not consume a turn. Hold up to 9 cards.</p><h3>Expanding arena and bots</h3><p>The arena starts at 9×9 and expands to 11×11 after round 4, then 13×13 after round 8. The added outer ring increases the distance to the finishing edge. If someone disconnects during a game, a bot can play their turns until they reconnect with the same browser.</p><h3>Online multiplayer</h3><p>One friend creates a lobby and shares its room code or invite link. All players must open the same hosted website. No email is required. The server validates moves, card ownership, turns, and legal wall placements.</p></div>`;}
let filter='All';
function indexHTML(){const tiers=['All','Common','Uncommon','Rare','Epic','Legendary'];return `<div class="index-filter">${tiers.map(t=>`<button class="filter-btn ${filter===t?'active':''}" data-filter="${t}">${t}</button>`).join('')}</div><div class="index-grid" id="indexGrid"></div>`;}
function drawIndex(){const grid=$('indexGrid');if(!grid)return;grid.innerHTML=(window.cardIndex||[]).filter(c=>filter==='All'||c.rarity===filter).map(c=>`<div class="index-card"><span style="font-size:28px">${c.icon}</span><div style="margin-top:8px"><b>${escapeHTML(c.name)}</b></div><div class="rarity ${c.rarity}">${c.rarity}</div><p>${escapeHTML(c.desc)}</p></div>`).join('');}
// The card index is shipped as a tiny standalone JSON file, so the entire website can show it before joining.
async function loadIndex(){try{window.cardIndex=await(await fetch('/cards.json')).json();if(!$('globalModal').classList.contains('hidden')&&$('modalTitle').textContent==='Card Index')drawIndex();}catch{window.cardIndex=[];}}
loadIndex();
function openModal(title,content){$('modalTitle').textContent=title;$('modalEyebrow').textContent=title==='Rules'?'THE BASICS':'YOUR ABILITY COLLECTION';$('modalContent').innerHTML=content;$('globalModal').classList.remove('hidden');if(title==='Card Index'){drawIndex();for(const b of $('modalContent').querySelectorAll('[data-filter]'))b.onclick=()=>{filter=b.dataset.filter;openModal('Card Index',indexHTML());};}}
function closeModal(){$('globalModal').classList.add('hidden');}
$('closeModalBtn').onclick=closeModal;$('globalModal').addEventListener('click',e=>{if(e.target===$('globalModal'))closeModal();});
$('rulesBtn').onclick=()=>openModal('Rules',rules());$('indexBtn').onclick=()=>openModal('Card Index',indexHTML());

// Responsive high-DPI canvas board, with interpolation on pawn movements.
function coord(e){const rect=canvas.getBoundingClientRect();return{x:(e.clientX-rect.left)*SIDE/rect.width,y:(e.clientY-rect.top)*SIDE/rect.height};}
function tileSize(){return AREA/(view?.n||9);}
function clickTarget(pt){if(!view)return null;const s=tileSize(),n=view.n,x=(pt.x-PAD)/s,y=(pt.y-PAD)/s;
 if(x<0||y<0||x>=n||y>=n)return null;
 const card=selectedCard();
 if(card?.kind==='remove'){
  const candidates=view.walls.map(w=>({w,d:wallDistance(pt,w,s)})).filter(x=>x.d<s*.25).sort((a,b)=>a.d-b.d);
  return candidates[0]?{type:'remove',wallId:candidates[0].w.id,cardId:selected}:null;
 }
 if(card?.kind==='target')return null;
 if(tool==='move')return{type:'move',to:{r:Math.floor(y),c:Math.floor(x)},...(selected?{cardId:selected}:{})};
 const len=card?.kind==='wall'?card.length:2;
 const o=orientation;
 const w=o==='h'?{o,r:Math.round(y-1),c:Math.round(x-len/2)}:{o,r:Math.round(y-len/2),c:Math.round(x-1)};
 if(w.r<0||w.c<0||(o==='h'?(w.r>=n-1||w.c+len>n):(w.c>=n-1||w.r+len>n)))return null;
 return{type:'wall',wall:w,...(selected?{cardId:selected}:{})};
}
function wallDistance(pt,w,s){const ax=PAD+(w.o==='h'?w.c:w.c+1)*s,ay=PAD+(w.o==='h'?w.r+1:w.r)*s,bx=ax+(w.o==='h'?w.len:0)*s,by=ay+(w.o==='v'?w.len:0)*s;return w.o==='h'?Math.hypot(pt.x-Math.max(ax,Math.min(bx,pt.x)),pt.y-ay):Math.hypot(pt.x-ax,pt.y-Math.max(ay,Math.min(by,pt.y)));}
canvas.addEventListener('pointermove',e=>{hover=clickTarget(coord(e));});
canvas.addEventListener('pointerleave',()=>hover=null);
canvas.addEventListener('pointerdown',async e=>{if(!myTurn())return;const action=clickTarget(coord(e));if(!action){toast('Select a valid destination or target.');return;}await attempt('action',action);});
function rounded(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function wall(w,s,ghost=false){
 const x=PAD+(w.o==='h'?w.c:w.c+1)*s,y=PAD+(w.o==='h'?w.r+1:w.r)*s;
 const x2=x+(w.o==='h'?w.len:0)*s,y2=y+(w.o==='v'?w.len:0)*s;
 ctx.lineCap='round';ctx.lineWidth=Math.max(7,s*.13);ctx.strokeStyle=ghost?'#66f3c9':PALETTE[view.players.find(p=>p.id===w.owner)?.seat??0];ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=ghost?18:11;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();ctx.shadowBlur=0;
 ctx.lineWidth=Math.max(2,s*.042);ctx.strokeStyle=ghost?'#d3ffed':'#e5f3ff88';ctx.stroke();
}
function frame(ts){requestAnimationFrame(frame);if(!view||view.phase==='lobby'||$('gameScreen').classList.contains('hidden'))return;
 const n=view.n,s=tileSize();ctx.clearRect(0,0,SIDE,SIDE);
 const bg=ctx.createLinearGradient(0,0,SIDE,SIDE);bg.addColorStop(0,'#12263e');bg.addColorStop(1,'#0d1a2d');ctx.fillStyle=bg;rounded(20,20,SIDE-40,SIDE-40,21);ctx.fill();
 ctx.fillStyle='#869ab7';ctx.font='bold 14px Outfit, sans-serif';ctx.textAlign='center';ctx.fillText('NORTH ▲',SIDE/2,32);ctx.fillText('SOUTH ▼',SIDE/2,SIDE-23);
 ctx.save();ctx.translate(30,SIDE/2);ctx.rotate(-Math.PI/2);ctx.fillText('WEST',0,0);ctx.restore();ctx.save();ctx.translate(SIDE-30,SIDE/2);ctx.rotate(Math.PI/2);ctx.fillText('EAST',0,0);ctx.restore();
 for(let r=0;r<n;r++)for(let c=0;c<n;c++){
  const alt=(r+c)%2===0;ctx.fillStyle=alt?'#192c44':'#162940';
  rounded(PAD+c*s+1,PAD+r*s+1,s-2,s-2,Math.max(4,s*.105));ctx.fill();
  const goals=[];if(r===0)goals.push(PALETTE[0]);if(r===n-1)goals.push(PALETTE[1]);if(c===n-1&&view.mode>=3)goals.push(PALETTE[2]);if(c===0&&view.mode>=4)goals.push(PALETTE[3]);
  if(goals.length){ctx.fillStyle=goals[0]+'1b';rounded(PAD+c*s+3,PAD+r*s+3,s-6,s-6,Math.max(3,s*.09));ctx.fill();}
 }
 if(myTurn()&&tool==='move'){
  const card=selectedCard();const moves=card?.kind==='move'?view.moveOptions?.[selected]||[]:view.legal||[];
  for(const m of moves){ctx.fillStyle='#5ceac83c';rounded(PAD+m.c*s+4,PAD+m.r*s+4,s-8,s-8,Math.max(5,s*.12));ctx.fill();ctx.beginPath();ctx.arc(PAD+(m.c+.5)*s,PAD+(m.r+.5)*s,Math.max(5,s*.10),0,Math.PI*2);ctx.fillStyle='#78fbd0';ctx.fill();}
 }
 for(const w of view.walls)wall(w,s);
 if(myTurn()&&hover?.type==='wall')wall({...hover.wall,len:selectedCard()?.kind==='wall'?selectedCard().length:2},s,true);
 if(myTurn()&&selectedCard()?.kind==='remove')for(const w of view.walls){if(selectedCard().effect==='reclaim'&&w.owner!==view.me)continue;ctx.strokeStyle='#f4cc7d';ctx.setLineDash([5,5]);ctx.lineWidth=2;ctx.strokeRect(PAD+(w.c-.08)*s,PAD+(w.r-.08)*s,s*.3,s*.3);ctx.setLineDash([]);}
 for(const p of view.players){
  let r=p.pos.r,c=p.pos.c;
  const a=animation.get(p.id);
  if(a){const t=Math.min(1,(ts-a.start)/210);const ease=1-Math.pow(1-t,3);r=a.from.r+(p.pos.r-a.from.r)*ease;c=a.from.c+(p.pos.c-a.from.c)*ease;if(t>=1)animation.delete(p.id);}
  const cx=PAD+(c+.5)*s,cy=PAD+(r+.5)*s,rad=s*.29;
  if(view.phase==='play'&&view.players[view.turn]?.id===p.id){ctx.strokeStyle=PALETTE[p.seat]+'8a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,rad+7,0,Math.PI*2);ctx.stroke();}
  ctx.shadowBlur=17;ctx.shadowColor=PALETTE[p.seat];ctx.fillStyle=PALETTE[p.seat];ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='#112033';ctx.font=`900 ${Math.max(14,s*.29)}px Outfit, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(p.seat+1),cx,cy+1);ctx.textBaseline='alphabetic';
 }
}
requestAnimationFrame(frame);

socket.on('connect',()=>{
 $('connText').textContent='Connected';$('connLight').classList.add('on');
 if(storage.room)api('join',{code:storage.room,token:storage.token,name:storage.name||$('guestName').value}).then(()=>{}).catch(err=>{toast(err.message);leaveToHome();});
});
socket.on('disconnect',()=>{$('connText').textContent='Reconnecting…';$('connLight').classList.remove('on');});
socket.on('state',v=>{
 if(view&&v.n===view.n){for(const p of v.players){const prev=view.players.find(x=>x.id===p.id);if(prev&&(prev.pos.r!==p.pos.r||prev.pos.c!==p.pos.c)){animation.set(p.id,{from:{...prev.pos},start:performance.now()});}}}else animation.clear();
 view=v;lastN=v.n;render();
});
showScreen('home');
