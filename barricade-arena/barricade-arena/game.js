import { randomBytes, randomUUID } from 'node:crypto';

export const MAX_SEATS = 4;
export const CARD_LIBRARY = [
  { id:'spare_planks', name:'Spare Planks', rarity:'Common', icon:'🪵', desc:'Instantly gain 1 wall. Does not use your turn.', kind:'instant', effect:'walls', power:1 },
  { id:'builder_kit', name:'Builder Kit', rarity:'Common', icon:'🧰', desc:'Instantly gain 2 walls. Does not use your turn.', kind:'instant', effect:'walls', power:2 },
  { id:'thin_barrier', name:'Thin Barrier', rarity:'Common', icon:'📏', desc:'Place a short wall, 1 tile long.', kind:'wall', effect:'wall', length:1 },
  { id:'free_brick', name:'Free Brick', rarity:'Common', icon:'🧱', desc:'Place a normal wall without spending a wall.', kind:'wall', effect:'wall', length:2, cost:0 },
  { id:'quick_stride', name:'Quick Stride', rarity:'Common', icon:'👟', desc:'Move up to 2 squares in a straight, unblocked line.', kind:'move', effect:'stride', max:2 },
  { id:'side_step', name:'Side Step', rarity:'Common', icon:'↗️', desc:'Move diagonally one tile via an open corner.', kind:'move', effect:'diagonal' },
  { id:'emergency_stash', name:'Emergency Stash', rarity:'Uncommon', icon:'📦', desc:'Instantly gain 3 walls. Does not use your turn.', kind:'instant', effect:'walls', power:3 },
  { id:'long_barricade', name:'Long Barricade', rarity:'Uncommon', icon:'📐', desc:'Place a wall 3 tiles long, costs 1 wall.', kind:'wall', effect:'wall', length:3 },
  { id:'wall_hopper', name:'Wall Hopper', rarity:'Uncommon', icon:'🦘', desc:'Step across an adjacent wall; destination must remain escapable.', kind:'move', effect:'phase', max:1 },
  { id:'sprint', name:'Sprint', rarity:'Uncommon', icon:'💨', desc:'Travel up to 3 clear squares in a straight line.', kind:'move', effect:'stride', max:3 },
  { id:'reclaim', name:'Reclaim', rarity:'Uncommon', icon:'♻️', desc:'Remove one of your walls and regain 2 wall units.', kind:'remove', effect:'reclaim', power:2 },
  { id:'drain', name:'Drain Supplies', rarity:'Uncommon', icon:'🕳️', desc:'Choose an opponent; they lose 1 wall.', kind:'target', effect:'drain', power:1 },
  { id:'reserve', name:'Reserve Supply', rarity:'Uncommon', icon:'🎒', desc:'Instantly gain 2 walls and keep your turn.', kind:'instant', effect:'walls', power:2 },
  { id:'cross_jump', name:'Cross Jump', rarity:'Rare', icon:'🧿', desc:'Blink exactly 2 tiles in a straight line, over walls if needed.', kind:'move', effect:'blink', max:2 },
  { id:'demolition', name:'Demolition', rarity:'Rare', icon:'🔨', desc:'Remove any wall on the board.', kind:'remove', effect:'demolition' },
  { id:'free_long', name:'Free Long Wall', rarity:'Rare', icon:'🏗️', desc:'Place a 3-tile wall for free.', kind:'wall', effect:'wall', length:3, cost:0 },
  { id:'double_build', name:'Double Build', rarity:'Rare', icon:'🔧', desc:'Build a normal wall, then receive one extra action.', kind:'wall', effect:'wall', length:2, bonus:1 },
  { id:'long_vault', name:'Long Vault', rarity:'Rare', icon:'🚀', desc:'Move up to 2 tiles, crossing walls on the way.', kind:'move', effect:'phase', max:2 },
  { id:'robber', name:'Supply Heist', rarity:'Rare', icon:'🦝', desc:'Take up to 2 walls from a chosen opponent.', kind:'target', effect:'steal', power:2 },
  { id:'extra_action', name:'Second Wind', rarity:'Rare', icon:'⚡', desc:'Move normally, then take one extra action.', kind:'move', effect:'normal', bonus:1 },
  { id:'great_wall', name:'Great Wall', rarity:'Epic', icon:'🏰', desc:'Place a 4-tile wall for one wall unit.', kind:'wall', effect:'wall', length:4 },
  { id:'phantom', name:'Phantom Step', rarity:'Epic', icon:'👻', desc:'Blink exactly 3 tiles in a straight line, ignoring intervening walls.', kind:'move', effect:'blink', max:3 },
  { id:'wall_storm', name:'Wall Storm', rarity:'Epic', icon:'🌪️', desc:'Place a 3-tile wall, then take one extra action.', kind:'wall', effect:'wall', length:3, bonus:1 },
  { id:'super_cache', name:'Super Cache', rarity:'Epic', icon:'💰', desc:'Instantly gain 5 walls. Does not use your turn.', kind:'instant', effect:'walls', power:5 },
  { id:'wrecking_ball', name:'Wrecking Ball', rarity:'Legendary', icon:'💥', desc:'Destroy a selected wall plus any wall touching it.', kind:'remove', effect:'blast' },
  { id:'portal', name:'Portal', rarity:'Legendary', icon:'🌀', desc:'Teleport to any free square within 3 steps (Manhattan distance).', kind:'move', effect:'portal', max:3 },
  { id:'fortress', name:'Fortress', rarity:'Legendary', icon:'👑', desc:'Place a 4-tile wall for free and receive an extra action.', kind:'wall', effect:'wall', length:4, cost:0, bonus:1 },
  { id:'master_builder', name:'Master Builder', rarity:'Legendary', icon:'🛠️', desc:'Instantly gain 7 walls, without ending your turn.', kind:'instant', effect:'walls', power:7 }
];
export const RARITIES = { Common:48, Uncommon:29, Rare:15, Epic:6, Legendary:2 };
export const COLORS = ['#35e0c2','#ffb54a','#a48cff','#ff6588'];
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
const eq = (a,b) => a.r===b.r && a.c===b.c;
const inside=(n,r,c)=>Number.isInteger(r)&&Number.isInteger(c)&&r>=0&&c>=0&&r<n&&c<n;
const key=(r,c)=>`${r},${c}`;
export function randomToken(){return randomBytes(18).toString('hex');}
export function roomCode(){return randomBytes(4).toString('hex').slice(0,6).toUpperCase();}
export function validateName(name){return typeof name==='string' ? name.trim().replace(/[^\p{L}\p{N} _.-]/gu,'').slice(0,18)||'Guest' : 'Guest';}
export function cardById(id){return CARD_LIBRARY.find(c=>c.id===id);}
export function draftCards(rng=Math.random){
  const result=[];
  for(let i=0;i<3;i++){
    const k=rng()*100; let acc=0; let rarity='Common';
    for(const [r,w] of Object.entries(RARITIES)){acc+=w;if(k<acc){rarity=r;break;}}
    const choices=CARD_LIBRARY.filter(c=>c.rarity===rarity && !result.includes(c.id));
    result.push((choices.length?choices:CARD_LIBRARY.filter(c=>!result.includes(c.id)))[Math.floor(rng()*(choices.length||CARD_LIBRARY.length-result.length))].id);
  }
  return result;
}
const spawn=(seat,n)=> seat===0?{r:n-1,c:Math.floor(n/2)}:seat===1?{r:0,c:Math.floor(n/2)}:seat===2?{r:Math.floor(n/2),c:0}:{r:Math.floor(n/2),c:n-1};
export function createRoom({hostToken,hostName,mode=2,fillBots=false}={}){
 const num=[2,3,4].includes(+mode)?+mode:2;
 return {code:roomCode(), host:hostToken, mode:num, fillBots:!!fillBots, phase:'lobby', createdAt:Date.now(), lastActive:Date.now(), n:9, walls:[], players:[{id:randomUUID(), token:hostToken, name:validateName(hostName), seat:0, bot:false, connected:true, walls:10, hand:[], options:[], picked:false, pos:spawn(0,9)}], turn:0, round:1, acted:0, bonus:0, winner:null, history:[], version:0 };
}
export function joinHuman(room,token,name){
 if(!token||typeof token!=='string'||token.length>160)throw Error('Invalid guest identity');
 const existing=room.players.find(p=>p.token===token && !p.bot);
 if(existing){ existing.name=validateName(name); existing.connected=true; room.lastActive=Date.now(); return existing; }
 if(room.phase!=='lobby')throw Error('Match already started; only existing players can reconnect.');
 if(room.players.length>=room.mode)throw Error('Room is full.');
 const taken=new Set(room.players.map(p=>p.seat));
 let seat=0;while(taken.has(seat))seat++;
 const p={id:randomUUID(),token,name:validateName(name),seat,bot:false,connected:true,walls:10,hand:[],options:[],picked:false,pos:spawn(seat,9)};
 room.players.push(p);room.players.sort((a,b)=>a.seat-b.seat);room.lastActive=Date.now();return p;
}
export function changeSettings(room,token,mode,fillBots){
 if(room.phase!=='lobby')throw Error('Match has already started.');
 if(token!==room.host)throw Error('Only the host can change settings.');
 if(![2,3,4].includes(+mode))throw Error('Invalid player count.');
 if(+mode<room.players.length)throw Error('There are too many players for that mode.');
 room.mode=+mode;room.fillBots=!!fillBots;
}
export function addBotsAndStart(room,token){
 if(room.phase!=='lobby'||room.host!==token)throw Error('Only the host can start.');
 if(!room.fillBots&&room.players.length!==room.mode)throw Error('Wait for players or enable Fill With Bots.');
 for(let i=room.players.length;i<room.mode;i++){
  const taken=new Set(room.players.map(p=>p.seat));let seat=0;while(taken.has(seat))seat++;
  room.players.push({id:randomUUID(),token:null,name:`Bot ${seat+1}`,seat,bot:true,connected:true,walls:10,hand:[],options:[],picked:false,pos:spawn(seat,9)});
 }
 room.players.sort((a,b)=>a.seat-b.seat);room.walls=[];room.n=9;room.round=1;room.acted=0;room.turn=0;room.bonus=0;room.winner=null;room.history=[];
 for(const p of room.players){p.pos=spawn(p.seat,9);p.walls=room.mode===2?10:room.mode===3?8:7;p.hand=[];}
 beginDraft(room);
 return room;
}
function log(room,msg){room.history.push(msg); if(room.history.length>8)room.history.shift();}
function beginDraft(room){
 room.phase='draft';room.acted=0;room.bonus=0;
 for(const p of room.players){p.picked=false;p.options=draftCards();}
 for(const p of room.players){if(p.bot||!p.connected)pickCard(room,p.id,p.options[0],true);}
 if(room.players.every(p=>p.picked))room.phase='play';
 log(room,`Round ${room.round} · choose your power card`);
}
export function pickCard(room,playerId,cardId,auto=false){
 if(room.phase!=='draft'&&!auto)throw Error('Card selection is closed.');
 const p=room.players.find(x=>x.id===playerId);
 if(!p||p.picked||!p.options.includes(cardId))throw Error('Card is not in your selection.');
 p.hand.push({uid:randomUUID(),id:cardId});
 if(p.hand.length>9)p.hand.shift();
 p.picked=true;p.options=[];
 if(room.phase==='draft'&&room.players.every(x=>x.picked)) {room.phase='play';log(room,'Everyone has chosen. Your turn!');}
 return p;
}
function edgeBlocked(room,r,c,nr,nc){
 for(const w of room.walls){
  if(w.o==='h'&&nc===c&&((r===w.r&&nr===r+1)||(r===w.r+1&&nr===r))&&c>=w.c&&c<w.c+w.len)return true;
  if(w.o==='v'&&nr===r&&((c===w.c&&nc===c+1)||(c===w.c+1&&nc===c))&&r>=w.r&&r<w.r+w.len)return true;
 }
 return false;
}
export function goalReached(p,n){return p.seat===0?p.pos.r===0:p.seat===1?p.pos.r===n-1:p.seat===2?p.pos.c===n-1:p.pos.c===0;}
function goalAt(seat,n,r,c){return seat===0?r===0:seat===1?r===n-1:seat===2?c===n-1:c===0;}
export function shortestPath(room,player,start){
 const n=room.n,from=start||player.pos;if(!inside(n,from.r,from.c))return Infinity;
 const q=[[from.r,from.c,0]],seen=new Set([key(from.r,from.c)]);
 for(let i=0;i<q.length;i++){
  const [r,c,d]=q[i];if(goalAt(player.seat,n,r,c))return d;
  for(const [dr,dc]of DIRS){const nr=r+dr,nc=c+dc,k=key(nr,nc);if(inside(n,nr,nc)&&!seen.has(k)&&!edgeBlocked(room,r,c,nr,nc)){seen.add(k);q.push([nr,nc,d+1]);}}
 }
 return Infinity;
}
export function reachable(room,position,seat){return shortestPath(room,{pos:position,seat})!==Infinity;}
export function legalMoves(room,player){
 const n=room.n,{r,c}=player.pos,occ=room.players.filter(p=>p.id!==player.id).map(p=>p.pos),moves=[],seen=new Set();
 function add(nr,nc){const k=key(nr,nc);if(inside(n,nr,nc)&&!seen.has(k)&&!occ.some(p=>p.r===nr&&p.c===nc)){seen.add(k);moves.push({r:nr,c:nc});}}
 for(const [dr,dc] of DIRS){
  const nr=r+dr,nc=c+dc;
  if(!inside(n,nr,nc)||edgeBlocked(room,r,c,nr,nc))continue;
  if(!occ.some(p=>p.r===nr&&p.c===nc)){add(nr,nc);continue;}
  const br=nr+dr,bc=nc+dc;
  if(inside(n,br,bc)&&!edgeBlocked(room,nr,nc,br,bc)&&!occ.some(p=>p.r===br&&p.c===bc))add(br,bc);
  else{
   const perps=dr!==0?[[0,1],[0,-1]]:[[1,0],[-1,0]];
   for(const [pr,pc] of perps){const sr=nr+pr,sc=nc+pc;if(inside(n,sr,sc)&&!edgeBlocked(room,nr,nc,sr,sc))add(sr,sc);}
  }
 }
 return moves;
}
export function specialMoves(room,p,card){
 const {r,c}=p.pos,n=room.n,occ=room.players.filter(x=>x.id!==p.id).map(x=>x.pos),res=[];
 const add=(nr,nc)=>{if(inside(n,nr,nc)&&!(nr===r&&nc===c)&&!occ.some(q=>q.r===nr&&q.c===nc)&&reachable(room,{r:nr,c:nc},p.seat)&&!res.some(q=>q.r===nr&&q.c===nc))res.push({r:nr,c:nc});};
 if(card.effect==='normal')return legalMoves(room,p);
 if(card.effect==='diagonal'){
  for(const dr of [-1,1])for(const dc of [-1,1]){
   if(!inside(n,r+dr,c+dc))continue;
   const via1=inside(n,r+dr,c)&&!edgeBlocked(room,r,c,r+dr,c)&&!edgeBlocked(room,r+dr,c,r+dr,c+dc);
   const via2=inside(n,r,c+dc)&&!edgeBlocked(room,r,c,r,c+dc)&&!edgeBlocked(room,r,c+dc,r+dr,c+dc);
   if(via1||via2)add(r+dr,c+dc);
  }
 }else if(card.effect==='portal'){
  for(let dr=-card.max;dr<=card.max;dr++)for(let dc=-card.max;dc<=card.max;dc++)if(Math.abs(dr)+Math.abs(dc)<=card.max)add(r+dr,c+dc);
 }else for(const [dr,dc]of DIRS){
  if(card.effect==='blink'){add(r+dr*card.max,c+dc*card.max);continue;}
  if(card.effect==='phase'){
   for(let step=1;step<=card.max;step++)add(r+dr*step,c+dc*step);
  }else if(card.effect==='stride'){
   let pr=r,pc=c;
   for(let step=1;step<=card.max;step++){
    const nr=pr+dr,nc=pc+dc;if(!inside(n,nr,nc)||edgeBlocked(room,pr,pc,nr,nc)||occ.some(q=>q.r===nr&&q.c===nc))break;
    add(nr,nc);pr=nr;pc=nc;
   }
  }
 }
 return res;
}
export function wallFits(room,w){
 if(!w||!['h','v'].includes(w.o)||!Number.isInteger(w.r)||!Number.isInteger(w.c)||!Number.isInteger(w.len)||w.len<1||w.len>4)return false;
 const n=room.n;
 if(w.o==='h'&&(w.r<0||w.r>n-2||w.c<0||w.c+w.len>n))return false;
 if(w.o==='v'&&(w.c<0||w.c>n-2||w.r<0||w.r+w.len>n))return false;
 for(const e of room.walls){
  if(e.o===w.o){
   if(w.o==='h'&&e.r===w.r&&w.c<e.c+e.len&&e.c<w.c+w.len)return false;
   if(w.o==='v'&&e.c===w.c&&w.r<e.r+e.len&&e.r<w.r+w.len)return false;
  }else{
   const h=e.o==='h'?e:w,v=e.o==='v'?e:w;
   if(v.c+1>h.c&&v.c+1<h.c+h.len&&h.r+1>v.r&&h.r+1<v.r+v.len)return false;
  }
 }
 const tmp={...w,id:'preview',owner:'preview'};
 room.walls.push(tmp);
 const okay=room.players.every(p=>reachable(room,p.pos,p.seat));
 room.walls.pop();return okay;
}
function useCard(p,cardItem){if(cardItem){const i=p.hand.findIndex(x=>x.uid===cardItem.uid);if(i<0)throw Error('That card is no longer in your hand.');p.hand.splice(i,1);}}
function finishAction(room,p,bonus=0){
 if(goalReached(p,room.n)){room.phase='finished';room.winner=p.id;log(room,`${p.name} has won the match!`);return;}
 if(bonus)room.bonus+=bonus;
 if(room.bonus>0){room.bonus--;log(room,`${p.name} has an extra action!`);return;}
 room.acted++;
 if(room.acted>=room.players.length){
  room.acted=0;room.round++;
  if((room.round-1)%4===0&&room.n<13){
   room.n+=2;for(const x of room.players){x.pos.r++;x.pos.c++;}
   for(const w of room.walls){w.r++;w.c++;}
   log(room,`The arena expanded to ${room.n}×${room.n}!`);
  }
  room.turn=0;beginDraft(room);
 }else{room.turn=(room.turn+1)%room.players.length;}
}
export function act(room,playerId,action){
 if(room.phase!=='play')throw Error('The game is not accepting moves.');
 const p=room.players[room.turn];if(!p||p.id!==playerId)throw Error('It is not your turn.');
 if(!action||typeof action!=='object')throw Error('Invalid action.');
 const item=action.cardId?p.hand.find(x=>x.uid===action.cardId):null;
 if(action.cardId&&!item)throw Error('You do not own that card.');
 const card=item?cardById(item.id):null;
 if(item&&!card)throw Error('Unknown card.');
 if(action.type==='activate'){
  if(!card||card.kind!=='instant')throw Error('Select an instant card.');
  p.walls=Math.min(p.walls+card.power,40);useCard(p,item);log(room,`${p.name} used ${card.name} (+${card.power} walls).`);return;
 }
 if(action.type==='move'){
  if(card&&card.kind!=='move')throw Error('That card cannot be used to move.');
  const to=action.to;
  if(!to||!Number.isInteger(to.r)||!Number.isInteger(to.c))throw Error('Invalid destination.');
  const allowed=card?specialMoves(room,p,card):legalMoves(room,p);
  if(!allowed.some(m=>eq(m,to)))throw Error('Illegal move.');
  p.pos={r:to.r,c:to.c};useCard(p,item);log(room,`${p.name} moved${card?` using ${card.name}`:''}.`);finishAction(room,p,card?.bonus||0);return;
 }
 if(action.type==='wall'){
  if(card&&card.kind!=='wall')throw Error('That card cannot place walls.');
  const length=card?.length||2,cost=card?.cost??1;
  if(p.walls<cost)throw Error('You have no walls left.');
  const w={r:action.wall?.r,c:action.wall?.c,o:action.wall?.o,len:length};
  if(!wallFits(room,w))throw Error('That wall overlaps, crosses, or blocks the only path.');
  room.walls.push({...w,id:randomUUID(),owner:p.id});p.walls-=cost;useCard(p,item);log(room,`${p.name} placed a ${length}-tile wall${card?' with '+card.name:''}.`);finishAction(room,p,card?.bonus||0);return;
 }
 if(action.type==='remove'){
  if(!card||card.kind!=='remove')throw Error('Select a removal card first.');
  const index=room.walls.findIndex(w=>w.id===action.wallId);if(index<0)throw Error('Wall not found.');
  const wall=room.walls[index];
  if(card.effect==='reclaim'&&wall.owner!==p.id)throw Error('Only your walls can be reclaimed.');
  const removed=card.effect==='blast'?room.walls.filter(w=>wallsTouch(wall,w)): [wall];
  const ids=new Set(removed.map(w=>w.id));room.walls=room.walls.filter(w=>!ids.has(w.id));
  if(card.effect==='reclaim')p.walls=Math.min(40,p.walls+card.power);
  useCard(p,item);log(room,`${p.name} destroyed ${removed.length} wall${removed.length!==1?'s':''} with ${card.name}.`);finishAction(room,p);return;
 }
 if(action.type==='target'){
  if(!card||card.kind!=='target')throw Error('Select a targeting card first.');
  const target=room.players.find(x=>x.id===action.targetPlayerId);
  if(!target||target.id===p.id)throw Error('Select a different player.');
  const amount=Math.min(target.walls,card.power);target.walls-=amount;
  if(card.effect==='steal')p.walls=Math.min(40,p.walls+amount);
  useCard(p,item);log(room,`${p.name} used ${card.name} on ${target.name}.`);finishAction(room,p);return;
 }
 throw Error('Unknown action.');
}
function wallsTouch(a,b){
 if(a.id===b.id)return true;
 const aStart=a.o==='h'?[a.c,a.r+1]:[a.c+1,a.r],aEnd=a.o==='h'?[a.c+a.len,a.r+1]:[a.c+1,a.r+a.len];
 const bStart=b.o==='h'?[b.c,b.r+1]:[b.c+1,b.r],bEnd=b.o==='h'?[b.c+b.len,b.r+1]:[b.c+1,b.r+b.len];
 if(a.o===b.o){if(a.o==='h')return a.r===b.r&&aStart[0]<=bEnd[0]&&bStart[0]<=aEnd[0];return a.c===b.c&&aStart[1]<=bEnd[1]&&bStart[1]<=aEnd[1];}
 const h=a.o==='h'?{s:aStart,e:aEnd}:{s:bStart,e:bEnd};
 const v=a.o==='v'?{s:aStart,e:aEnd}:{s:bStart,e:bEnd};
 return v.s[0]>=h.s[0]&&v.s[0]<=h.e[0]&&h.s[1]>=v.s[1]&&h.s[1]<=v.e[1];
}
export function viewFor(room,token){
 const me=room.players.find(p=>p.token===token && !p.bot);
 return {code:room.code,mode:room.mode,fillBots:room.fillBots,phase:room.phase,n:room.n,round:room.round,turn:room.turn,acted:room.acted,bonus:room.bonus,host:token===room.host,winner:room.winner,players:room.players.map(p=>({id:p.id,name:p.name,seat:p.seat,bot:p.bot,connected:p.connected,pos:p.pos,walls:p.walls,handCount:p.hand.length,picked:p.picked,color:COLORS[p.seat]})),walls:room.walls,history:room.history,me:me?.id||null,hand:me?.hand.map(x=>({...x,card:cardById(x.id)}))||[],options:me&&room.phase==='draft'&&!me.picked?me.options.map(id=>cardById(id)):[],legal:me&&room.phase==='play'&&room.players[room.turn]?.id===me.id?legalMoves(room,me):[],moveOptions:me&&room.phase==='play'&&room.players[room.turn]?.id===me.id?Object.fromEntries(me.hand.filter(x=>cardById(x.id)?.kind==='move').map(x=>[x.uid,specialMoves(room,me,cardById(x.id))])):{}};
}
// Offline-player/bot turn: prefer progress; sometimes place a strategically useful blocking wall.
export function botTurn(room,p){
 if(room.phase!=='play'||room.players[room.turn]?.id!==p.id)return;
 // Bots spend no-turn supply cards and use tactical movement cards when useful.
 for(const item of [...p.hand]){const c=cardById(item.id);if(c?.kind==='instant')act(room,p.id,{type:'activate',cardId:item.uid});}
 const ownDist=shortestPath(room,p);
 const foes=room.players.filter(x=>x.id!==p.id).sort((a,b)=>shortestPath(room,a)-shortestPath(room,b));
 if(foes.length&&p.walls>0&&Math.random()<0.30&&shortestPath(room,foes[0])<ownDist+1){
  const enemy=foes[0],candidate=[],oldEnemy=shortestPath(room,foes[0]);
  for(const o of ['h','v'])for(let d=-2;d<=1;d++)for(let e=-2;e<=1;e++){
   const r=enemy.pos.r+d,c=enemy.pos.c+e,w={r,c,o,len:2};
   if(!wallFits(room,w))continue;
   room.walls.push({...w,id:'test',owner:p.id});const their=shortestPath(room,enemy),my=shortestPath(room,p);room.walls.pop();
   const score=(their-oldEnemy)-(my-ownDist)*1.2;
   if(their-oldEnemy>0&&score>0)candidate.push({w,score});
  }
  if(candidate.length){candidate.sort((a,b)=>b.score-a.score);try{act(room,p.id,{type:'wall',wall:candidate[0].w});return;}catch{}}
 }
 const moves=legalMoves(room,p);
 if(!moves.length)return;
 const bestBasic=Math.min(...moves.map(to=>shortestPath(room,p,to)));
 for(const item of [...p.hand]){
  const card=cardById(item.id);if(card?.kind!=='move')continue;
  const candidates=specialMoves(room,p,card).map(to=>({to,dist:shortestPath(room,p,to)})).sort((a,b)=>a.dist-b.dist);
  if(candidates.length&&candidates[0].dist+0.5<bestBasic){
   try{act(room,p.id,{type:'move',to:candidates[0].to,cardId:item.uid});return;}catch{}
  }
 }
 const scored=moves.map(to=>({to,dist:shortestPath(room,p,to),noise:Math.random()*0.45})).sort((a,b)=>a.dist+a.noise-b.dist-b.noise);
 act(room,p.id,{type:'move',to:scored[0].to});
}
