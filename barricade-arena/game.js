import { randomBytes, randomUUID } from 'node:crypto';

export const MAX_SEATS = 4;
// Barricade Arena 3.0 — classes, mastery, server-authoritative rules and permanent cards.
// Each passive is immediately equipped, levels up to 3 and never expires.
export const CARD_LIBRARY = [
 // COMMON — a few consumables, mostly permanent upgrades.
 {id:'spare_planks',name:'Spare Planks',rarity:'Common',icon:'🪵',desc:'One use · gain 2 walls without ending your turn.',kind:'instant',effect:'walls',power:2},
 {id:'little_boost',name:'Quick Boost',rarity:'Common',icon:'👟',desc:'One use · move 2 clear spaces in a straight line.',kind:'move',effect:'stride',max:2},
 {id:'supply_pouch',name:'Supply Pouch',rarity:'Common',icon:'🎒',desc:'Permanent · gain 2 walls on unlock and 1 per level every 4 turns.',kind:'passive',effect:'gainWalls',power:2},
 {id:'brick_apprentice',name:'Brick Apprentice',rarity:'Common',icon:'🧱',desc:'Permanent · gain 1 wall on unlock and 1 per level every 4 turns.',kind:'passive',effect:'gainWalls',power:1},
 {id:'steady_income',name:'Steady Income',rarity:'Common',icon:'📦',desc:'Permanent · gain 1 wall at the start of every 3rd personal turn. Each upgrade improves the rate.',kind:'passive',effect:'income',every:3,power:1},
 {id:'trail_runner',name:'Trail Runner',rarity:'Common',icon:'🏃',desc:'Permanent · move up to 2 clear tiles in a straight line on your turn.',kind:'passive',effect:'stride',power:2},
 {id:'corner_cutter',name:'Corner Cutter',rarity:'Common',icon:'↗️',desc:'Permanent · move diagonally through an open corner.',kind:'passive',effect:'diagonal'},
 {id:'scavenger',name:'Scavenger',rarity:'Common',icon:'♻️',desc:'Permanent · every 3rd barricade you build refunds 1 wall.',kind:'passive',effect:'refund',every:3},
 {id:'expedition_pack',name:'Expedition Pack',rarity:'Common',icon:'🧰',desc:'Permanent · gain 3 walls each time the arena expands.',kind:'passive',effect:'expansion',power:3},
 {id:'thin_barrier',name:'Thin Barrier',rarity:'Common',icon:'📏',desc:'One use · place a short 1-tile barricade for free.',kind:'wall',effect:'wall',length:1,cost:0},
 // UNCOMMON.
 {id:'builder_kit',name:'Builder Kit',rarity:'Uncommon',icon:'🧰',desc:'One use · gain 4 walls instantly.',kind:'instant',effect:'walls',power:4},
 {id:'long_barricade',name:'Long Barricade',rarity:'Uncommon',icon:'📐',desc:'One use · build a 3-tile barricade.',kind:'wall',effect:'wall',length:3},
 {id:'wall_stretcher',name:'Wall Stretcher',rarity:'Uncommon',icon:'🏗️',desc:'Permanent · normal barricades span 3 tiles (4 at level 2).',kind:'passive',effect:'longwall',power:3},
 {id:'wind_runner',name:'Wind Runner',rarity:'Uncommon',icon:'💨',desc:'Permanent · move up to 3 clear tiles straight ahead.',kind:'passive',effect:'stride',power:3},
 {id:'vault_training',name:'Vault Training',rarity:'Uncommon',icon:'🦘',desc:'Permanent · vault a wall up to 1 tile every 3 personal turns.',kind:'passive',effect:'vault',power:1,every:3},
 {id:'expert_recycler',name:'Expert Recycler',rarity:'Uncommon',icon:'🔄',desc:'Permanent · refund 1 wall every 2 barricades built.',kind:'passive',effect:'refund',every:2},
 {id:'extra_rations',name:'Extra Rations',rarity:'Uncommon',icon:'🥫',desc:'Permanent · gain 2 walls every 3 personal turns.',kind:'passive',effect:'income',every:3,power:2},
 {id:'frontier_cache',name:'Frontier Cache',rarity:'Uncommon',icon:'🌍',desc:'Permanent · gain 5 walls whenever the map expands.',kind:'passive',effect:'expansion',power:5},
 {id:'sprint',name:'Sprint',rarity:'Uncommon',icon:'⚡',desc:'One use · move 3 clear tiles in a straight line.',kind:'move',effect:'stride',max:3},
 // RARE.
 {id:'demolition',name:'Demolition',rarity:'Rare',icon:'🔨',desc:'One use · destroy any barricade.',kind:'remove',effect:'demolition'},
 {id:'blink_scroll',name:'Blink Scroll',rarity:'Rare',icon:'✨',desc:'One use · blink exactly 2 tiles straight across obstacles.',kind:'move',effect:'blink',max:2},
 {id:'grand_architect',name:'Grand Architect',rarity:'Rare',icon:'📐',desc:'Permanent · normal walls stretch 4 tiles.',kind:'passive',effect:'longwall',power:4},
 {id:'wall_jumper',name:'Wall Jumper',rarity:'Rare',icon:'🪂',desc:'Permanent · vault up to 2 tiles across walls every 3 turns.',kind:'passive',effect:'vault',power:2,every:3},
 {id:'blink_boots',name:'Blink Boots',rarity:'Rare',icon:'🌀',desc:'Permanent · blink exactly 2 tiles straight every 4 turns.',kind:'passive',effect:'blink',power:2,every:4},
 {id:'supply_line',name:'Supply Line',rarity:'Rare',icon:'🏭',desc:'Permanent · gain 1 wall at the start of every turn.',kind:'passive',effect:'income',power:1,every:1},
 {id:'efficient_builder',name:'Efficient Builder',rarity:'Rare',icon:'🔧',desc:'Permanent · every 3rd barricade is free.',kind:'passive',effect:'discount',every:3},
 {id:'robber',name:'Supply Heist',rarity:'Rare',icon:'🦝',desc:'One use · steal up to 2 walls from another player.',kind:'target',effect:'steal',power:2},
 {id:'free_long',name:'Free Long Wall',rarity:'Rare',icon:'🏰',desc:'One use · place a 3-tile barricade for free.',kind:'wall',effect:'wall',length:3,cost:0},
 // EPIC.
 {id:'phase_core',name:'Phase Core',rarity:'Epic',icon:'👻',desc:'Permanent · blink exactly 3 tiles straight every 4 turns.',kind:'passive',effect:'blink',power:3,every:4},
 {id:'tempo_master',name:'Tempo Master',rarity:'Epic',icon:'⏳',desc:'Permanent · gain an extra action after moving once every 4 turns.',kind:'passive',effect:'bonusmove',every:4},
 {id:'master_mason',name:'Master Mason',rarity:'Epic',icon:'🛠️',desc:'Permanent · every 2nd wall you place is free.',kind:'passive',effect:'discount',every:2},
 {id:'portal_core',name:'Portal Core',rarity:'Epic',icon:'🔮',desc:'Permanent · teleport within 2 spaces every 4 turns.',kind:'passive',effect:'portal',power:2,every:4},
 {id:'fortress_supply',name:'Fortress Supply',rarity:'Epic',icon:'🏯',desc:'Permanent · gain 2 walls every turn.',kind:'passive',effect:'income',power:2,every:1},
 {id:'wall_storm',name:'Wall Storm',rarity:'Epic',icon:'🌪️',desc:'One use · place a 3-tile wall and take another action.',kind:'wall',effect:'wall',length:3,bonus:1},
 // LEGENDARY.
 {id:'reality_walker',name:'Reality Walker',rarity:'Legendary',icon:'🌌',desc:'Permanent · teleport within 3 spaces every 3 turns.',kind:'passive',effect:'portal',power:3,every:3},
 {id:'world_builder',name:'World Builder',rarity:'Legendary',icon:'👑',desc:'Permanent · place 4-tile walls; every 2nd build is free.',kind:'passive',effect:'longwall',power:4,also:'discount'},
 {id:'time_bender',name:'Time Bender',rarity:'Legendary',icon:'⌛',desc:'Permanent · extra move action every 3 turns.',kind:'passive',effect:'bonusmove',every:3},
 {id:'master_builder',name:'Master Builder',rarity:'Legendary',icon:'💰',desc:'One use · instantly gain 7 walls without spending your turn.',kind:'instant',effect:'walls',power:7},
 {id:'fortress',name:'Fortress',rarity:'Legendary',icon:'⚔️',desc:'One use · build a 4-tile wall for free, then act again.',kind:'wall',effect:'wall',length:4,cost:0,bonus:1},
 // MYTHIC — very rare permanent power.
 {id:'cosmic_architect',name:'Cosmic Architect',rarity:'Mythic',icon:'🌠',desc:'Permanent · build 4-tile walls for free every 2nd placement and gain 2 walls each expansion.',kind:'passive',effect:'longwall',power:4,also:'discount',extraExpansion:2},
 {id:'singularity_stride',name:'Singularity Stride',rarity:'Mythic',icon:'💫',desc:'Permanent · teleport within 4 spaces every 3 turns.',kind:'passive',effect:'portal',power:4,every:3},
 // EVOLUTION expansion cards — all effects work through the same server rules.
 {id:'neon_kicks',name:'Neon Kicks',rarity:'Common',icon:'🛼',desc:'Permanent · move 2 straight tiles. Repeats upgrade your speed.',kind:'passive',effect:'stride',power:2},
 {id:'map_scout',name:'Map Scout',rarity:'Common',icon:'🧭',desc:'Permanent · gain 2 extra walls every map expansion.',kind:'passive',effect:'expansion',power:2},
 {id:'extra_mortar',name:'Extra Mortar',rarity:'Common',icon:'🪣',desc:'Permanent · gain 2 walls now, plus recurring walls every four turns.',kind:'passive',effect:'gainWalls',power:2},
 {id:'route_memory',name:'Route Memory',rarity:'Common',icon:'🗺️',desc:'Permanent · use open diagonal corners to outmaneuver rivals.',kind:'passive',effect:'diagonal'},
 {id:'bounce_kit',name:'Bounce Kit',rarity:'Uncommon',icon:'🪁',desc:'Permanent · vault 1 tile over walls every 4 turns.',kind:'passive',effect:'vault',power:1,every:4},
 {id:'wall_accountant',name:'Wall Accountant',rarity:'Uncommon',icon:'🪙',desc:'Permanent · every fourth wall is free.',kind:'passive',effect:'discount',every:4},
 {id:'crystal_income',name:'Crystal Income',rarity:'Uncommon',icon:'🔷',desc:'Permanent · gain 2 walls every 4 turns.',kind:'passive',effect:'income',every:4,power:2},
 {id:'skybridge_runner',name:'Skybridge Runner',rarity:'Rare',icon:'🌉',desc:'Permanent · move up to 3 straight open tiles.',kind:'passive',effect:'stride',power:3},
 {id:'loop_portal',name:'Loop Portal',rarity:'Rare',icon:'🪬',desc:'Permanent · teleport within 1 tile every 3 turns.',kind:'passive',effect:'portal',power:1,every:3},
 {id:'secret_tunnel',name:'Secret Tunnel',rarity:'Rare',icon:'🕳️',desc:'Permanent · blink 2 tiles through walls every 5 turns.',kind:'passive',effect:'blink',power:2,every:5},
 {id:'spectral_wings',name:'Spectral Wings',rarity:'Epic',icon:'🪽',desc:'Permanent · vault up to 3 tiles every 4 turns.',kind:'passive',effect:'vault',power:3,every:4},
 {id:'overclock',name:'Overclock',rarity:'Epic',icon:'🔋',desc:'Permanent · periodically get a free extra action after moving.',kind:'passive',effect:'bonusmove',every:5},
 {id:'infinite_cache',name:'Infinite Cache',rarity:'Legendary',icon:'🏦',desc:'Permanent · gain 3 walls every personal turn.',kind:'passive',effect:'income',power:3,every:1},
 {id:'chronos_eye',name:'Chronos Eye',rarity:'Mythic',icon:'👁️',desc:'Permanent · gain an extra action after moving every 2 turns.',kind:'passive',effect:'bonusmove',every:2},
 {id:'third_wind',name:'Third Wind',rarity:'Uncommon',icon:'🟩',desc:'One use · sprint up to 4 tiles without crossing walls.',kind:'move',effect:'stride',max:4},
 {id:'rift_blink',name:'Rift Blink',rarity:'Rare',icon:'🟣',desc:'One use · blink exactly 3 tiles through obstacles.',kind:'move',effect:'blink',max:3},
 {id:'instant_foundation',name:'Instant Foundation',rarity:'Epic',icon:'💠',desc:'One use · place a free 4-tile wall.',kind:'wall',effect:'wall',length:4,cost:0},
 // OMEGA season — powerful cards with server-side effects, not cosmetic placeholders.
 {id:'double_scavenge',name:'Lucky Pouch',rarity:'Common',icon:'🍀',desc:'Permanent · get 1 wall every 3 turns.',kind:'passive',effect:'income',power:1,every:3},
 {id:'baby_teleport',name:'Blink Charm',rarity:'Uncommon',icon:'🔹',desc:'Permanent · teleport within 1 square every 2 turns.',kind:'passive',effect:'portal',power:1,every:2},
 {id:'freebuild',name:'Master Contractor',rarity:'Rare',icon:'🔩',desc:'Permanent · every 2nd placed wall costs nothing.',kind:'passive',effect:'discount',every:2},
 {id:'stormrunner',name:'Stormrunner',rarity:'Rare',icon:'🌩️',desc:'Permanent · run up to 4 clear spaces in a straight line.',kind:'passive',effect:'stride',power:4},
 {id:'echo_steps',name:'Echo Steps',rarity:'Epic',icon:'🪞',desc:'Permanent · earn a bonus action after moving every 3 turns.',kind:'passive',effect:'bonusmove',every:3},
 {id:'wall_factory',name:'Wall Factory',rarity:'Epic',icon:'🏭',desc:'Permanent · earn 3 walls every second turn.',kind:'passive',effect:'income',power:3,every:2},
 {id:'superposition',name:'Superposition',rarity:'Epic',icon:'💎',desc:'Permanent · teleport within 3 tiles every 2 turns.',kind:'passive',effect:'portal',power:3,every:2},
 {id:'royal_vault',name:'Royal Vault',rarity:'Legendary',icon:'🪽',desc:'Permanent · vault up to 4 spaces every 2 turns.',kind:'passive',effect:'vault',power:4,every:2},
 {id:'demolition_genius',name:'Demolition Genius',rarity:'Legendary',icon:'🔥',desc:'Permanent · refund 1 wall every time you build.',kind:'passive',effect:'refund',every:1},
 {id:'hyperdrive',name:'Hyperdrive',rarity:'Legendary',icon:'🚀',desc:'Permanent · earn a bonus action after moving every 2 turns.',kind:'passive',effect:'bonusmove',every:2},
 {id:'void_emperor',name:'Void Emperor',rarity:'Mythic',icon:'🌑',desc:'Permanent · blink exactly 4 spaces through obstacles every 2 turns.',kind:'passive',effect:'blink',power:4,every:2},
 {id:'godspeed',name:'Godspeed',rarity:'Mythic',icon:'🌟',desc:'Permanent · teleport within 4 tiles every 2 turns.',kind:'passive',effect:'portal',power:4,every:2},
 {id:'the_mint',name:'Infinite Mint',rarity:'Mythic',icon:'💰',desc:'Permanent · earn 5 walls at the start of every personal turn.',kind:'passive',effect:'income',power:5,every:1},
 {id:'rocket_jump',name:'Rocket Jump',rarity:'Uncommon',icon:'🧨',desc:'One use · leap 3 spaces over barricades in a straight line.',kind:'move',effect:'phase',max:3},
 {id:'prism_gate',name:'Prism Gate',rarity:'Rare',icon:'🌀',desc:'One use · teleport within 3 spaces, ignoring walls.',kind:'move',effect:'portal',max:3},
 {id:'earthshaker',name:'Earthshaker',rarity:'Epic',icon:'🌋',desc:'One use · destroy a wall and every wall that touches it.',kind:'remove',effect:'blast'},
 {id:'kingmaker',name:'Kingmaker',rarity:'Legendary',icon:'♛',desc:'One use · steal up to 6 walls from a rival.',kind:'target',effect:'steal',power:6},
 {id:'rewind_rival',name:'Rewind Rival',rarity:'Legendary',icon:'⏪',desc:'One use · send an opponent back to their starting tile if empty.',kind:'target',effect:'reset',power:1},
 {id:'dimension_flip',name:'Dimension Flip',rarity:'Mythic',icon:'🔁',desc:'One use · swap positions with a rival. Can win if your new position is a goal.',kind:'target',effect:'swap',power:1},
 {id:'timefracture',name:'Time Fracture',rarity:'Mythic',icon:'⏱️',desc:'One use · bank one extra action after your next move or wall.',kind:'instant',effect:'timeburst',power:1},
 {id:'massive_planks',name:'Massive Planks',rarity:'Uncommon',icon:'🪓',desc:'One use · gain 5 walls without ending your turn.',kind:'instant',effect:'walls',power:5},
 {id:'void_wall',name:'Void Wall',rarity:'Legendary',icon:'🖤',desc:'One use · place a free 4-tile barricade and take another action.',kind:'wall',effect:'wall',length:4,cost:0,bonus:1},
 {id:'cataclysm_dash',name:'Cataclysm Dash',rarity:'Mythic',icon:'☄️',desc:'One use · teleport to any unoccupied tile within 5 steps.',kind:'move',effect:'portal',max:5}
];

// Six pre-match classes. Mastery tiers are earned after 4 and 9 personal turns.
// Skills are performed as normal server-validated actions; cooldowns cannot be bypassed by clients.
export const CLASS_LIBRARY = Object.freeze([
 {id:'vanguard',name:'Vanguard',icon:'⚡',title:'THE SPEEDSTER',color:'#57e7c2',tag:'MOBILITY',starter:'trail_runner',desc:'Run circles around your rivals. Your stride grows stronger as the match goes on.',skill:'Overdrive',skillDesc:'Dash up to 3 / 4 / 4 open tiles in a straight line.',kind:'move',effect:'stride',power:[3,4,4],cooldown:[3,3,2]},
 {id:'architect',name:'Architect',icon:'◈',title:'THE MASTER BUILDER',color:'#ffbd68',tag:'CONTROL',starter:'brick_apprentice',desc:'Build more for less and bend the board to your plan.',skill:'Blueprint',skillDesc:'Place a free 3 / 3 / 4-tile barricade.',kind:'wall',power:[3,3,4],cooldown:[4,3,3]},
 {id:'wraith',name:'Wraith',icon:'☾',title:'THE GHOST',color:'#ba8aff',tag:'ESCAPE',starter:'corner_cutter',desc:'Glide around corners and slip straight through obstacles.',skill:'Phase Shift',skillDesc:'Blink exactly 2 / 3 / 3 tiles through barriers.',kind:'move',effect:'blink',power:[2,3,3],cooldown:[3,3,2]},
 {id:'saboteur',name:'Saboteur',icon:'✹',title:'THE DISRUPTOR',color:'#ff758f',tag:'DISRUPTION',starter:'expert_recycler',desc:'Take down rival walls and rewrite the best route.',skill:'Shatter',skillDesc:'Destroy a barricade. Recharges faster as you master the class.',kind:'remove',power:[1,1,1],cooldown:[4,3,2]},
 {id:'oracle',name:'Oracle',icon:'✧',title:'THE SPACEBENDER',color:'#63c9ff',tag:'TELEPORT',starter:'expedition_pack',desc:'Sense the path ahead and hop between distant tiles.',skill:'Warp Gate',skillDesc:'Teleport within 2 / 3 / 3 tiles, ignoring barriers.',kind:'move',effect:'portal',power:[2,3,3],cooldown:[4,3,3]},
 {id:'sentinel',name:'Sentinel',icon:'⬡',title:'THE FORTRESS',color:'#a8f38a',tag:'DEFENCE',starter:'steady_income',desc:'Outlast every rival with reliable reinforcement supplies.',skill:'Resupply',skillDesc:'Gain 3 / 4 / 5 walls without ending your turn.',kind:'instant',power:[3,4,5],cooldown:[4,4,3]}
]);
export const classById=id=>CLASS_LIBRARY.find(x=>x.id===id);
export function classTier(player){return player.turnsTaken>=9?3:player.turnsTaken>=4?2:1;}
export function classSkillFor(room,player){
 const cls=classById(player.classId)||CLASS_LIBRARY[0],tier=classTier(player),ix=tier-1;
 const cooldown=cls.cooldown[ix],readyIn=Math.max(0,cooldown-(player.turnsTaken-(player.cooldowns.classSkill??-999)));
 const result={id:cls.id,name:cls.skill,kind:cls.kind,icon:cls.icon,desc:cls.skillDesc,tier,readyIn,maxCooldown:cooldown,power:cls.power[ix],color:cls.color};
 result.moves=readyIn===0&&cls.kind==='move'?specialMoves(room,player,{effect:cls.effect,max:result.power}):[];
 return result;
}
export function chooseClass(room,token,classId){
 if(room.phase!=='lobby')throw Error('Choose your class before the match starts.');
 const p=room.players.find(x=>x.token===token&&!x.bot);
 if(!p)throw Error('Join the room first.');
 if(!classById(classId))throw Error('Unknown class.');
 p.classId=classId;
 return p;
}

export const RARITIES = {Common:44,Uncommon:29,Rare:16,Epic:7,Legendary:3,Mythic:1};
export const DEFAULT_SETTINGS = Object.freeze({ expandEvery:4,draftEvery:1,startingCards:2,cardsPerDraft:1,cardsPerTurn:0,eventEvery:3,centerGoal:false });
const SETTING_VALUES={expandEvery:[0,2,3,4,5,6,8,10],draftEvery:[0,1,2,3,4,5],startingCards:[0,1,2,3,4,5],cardsPerDraft:[1,2,3],cardsPerTurn:[0,1,2],eventEvery:[0,2,3,4,5,6],centerGoal:[false,true]};
export function validateSettings(input={}){
 const settings={...DEFAULT_SETTINGS};
 for(const [key,allowed] of Object.entries(SETTING_VALUES)){
  if(input[key]!==undefined){if(key==='centerGoal'){if(typeof input[key]!=='boolean')throw Error('Invalid centerGoal setting.');settings[key]=input[key];}else{if(!allowed.includes(Number(input[key])))throw Error(`Invalid ${key} setting.`);settings[key]=Number(input[key]);}}
 }
 return settings;
}
export const COLORS = ['#35e0c2','#ffb54a','#a48cff','#ff6588'];
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
const eq = (a,b) => a.r===b.r && a.c===b.c;
const inside=(n,r,c)=>Number.isInteger(r)&&Number.isInteger(c)&&r>=0&&c>=0&&r<n&&c<n;
const key=(r,c)=>`${r},${c}`;
export function randomToken(){return randomBytes(18).toString('hex');}
export function roomCode(){const abc='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=randomBytes(4);return [...bytes].map(b=>abc[b%abc.length]).join('');}
export function validateName(name){return typeof name==='string' ? name.trim().replace(/[^\p{L}\p{N} _.-]/gu,'').slice(0,18)||'Guest' : 'Guest';}
export function cardById(id){return CARD_LIBRARY.find(c=>c.id===id);}
export function draftCards(rng=Math.random,player=null){
 const result=[];
 for(let i=0;i<3;i++){
  const options=CARD_LIBRARY.filter(c=>!result.includes(c.id)&&!(c.kind==='passive'&&(player?.passives?.find(p=>p.id===c.id)?.level||0)>=3));
  const k=rng()*100;let acc=0,rarity='Common';
  for(const [r,w] of Object.entries(RARITIES)){acc+=w;if(k<acc){rarity=r;break;}}
  const pool=options.filter(c=>c.rarity===rarity);
  const group=pool.length?pool:options;
  if(!group.length)break;
  const picked=group[Math.min(group.length-1,Math.floor(rng()*group.length))];result.push(picked.id);
 }
 return result;
}
function newPlayer({token,name,seat,bot=false}){return {id:randomUUID(),token:bot?null:token,name:bot?name:validateName(name),seat,bot,connected:true,classId:'vanguard',walls:10,hand:[],passives:[],options:[],picked:false,draftLeft:0,turnsTaken:0,wallsBuilt:0,cooldowns:{},pos:spawn(seat,9)};}
export function passiveLevel(p,id){return p.passives?.find(x=>x.id===id)?.level||0;}
export function equipCard(p,cardId){
 const card=cardById(cardId);if(!card)throw Error('Unknown card.');
 if(card.kind!=='passive'){
  p.hand.push({uid:randomUUID(),id:cardId});if(p.hand.length>12)p.hand.shift();return 'item';
 }
 const owned=p.passives.find(x=>x.id===cardId);
 if(owned){if(owned.level>=3)return 'maxed';owned.level++;}else p.passives.push({id:cardId,level:1});
 if(card.effect==='gainWalls')p.walls=Math.min(60,p.walls+card.power);
 return 'passive';
}
function passivesFor(p,effect){return (p.passives||[]).map(x=>({...cardById(x.id),level:x.level})).filter(c=>c.effect===effect||c.also===effect);}
function strongest(p,effect,score){return passivesFor(p,effect).sort((a,b)=>score(b)-score(a))[0]||null;}
export function baseWallLength(p){const c=strongest(p,'longwall',x=>Math.min(4,x.power+Math.min(x.level-1,1)));return c?Math.min(4,c.power+Math.min(c.level-1,1)):2;}
export function passiveMoves(room,p){
 const result={};
 for(const effect of ['stride','diagonal','vault','blink','portal']){
  const c=strongest(p,effect,x=>x.power||1);if(!c)continue;
  const cd=effect==='vault'||effect==='blink'||effect==='portal';
  const rate=Math.max(1,(c.every||1)-Math.floor((c.level-1)/2));
  if(cd&&p.turnsTaken-(p.cooldowns[effect]??-999)<rate)continue;
  const max=Math.min(4,(c.power||1)+(c.level>1&&effect==='stride'?1:0));
  const card={effect:effect==='vault'?'phase':effect,max};result[effect]=specialMoves(room,p,card);
 }
 return result;
}
function awardTurn(room){
 if(room.phase!=='play')return;
 const p=room.players[room.turn];if(!p)return;
 p.turnsTaken++;
 for(const c of passivesFor(p,'gainWalls'))if(p.turnsTaken%4===0)p.walls=Math.min(60,p.walls+c.level);
 for(const c of passivesFor(p,'income')){
  const every=Math.max(1,c.every-Math.min(c.level-1,1));
  if(p.turnsTaken%every===0)p.walls=Math.min(60,p.walls+c.power);
 }
 for(let i=0;i<room.settings.cardsPerTurn;i++){
  const options=draftCards(Math.random,p);if(options.length)equipCard(p,options[0]);
 }
}
const spawn=(seat,n)=> seat===0?{r:n-1,c:Math.floor(n/2)}:seat===1?{r:0,c:Math.floor(n/2)}:seat===2?{r:Math.floor(n/2),c:0}:{r:Math.floor(n/2),c:n-1};
export function createRoom({hostToken,hostName,mode=2,fillBots=false,settings={},publicRoom=false}={}){
 const num=[2,3,4].includes(+mode)?+mode:2;
 return {code:roomCode(),host:hostToken,mode:num,fillBots:!!fillBots,publicRoom:publicRoom===true,settings:validateSettings(settings),phase:'lobby',createdAt:Date.now(),lastActive:Date.now(),n:9,walls:[],players:[newPlayer({token:hostToken,name:hostName,seat:0})],turn:0,round:1,acted:0,bonus:0,winner:null,history:[],version:0,lastEvent:null,eventSeq:0};
}
export function joinHuman(room,token,name){
 if(!token||typeof token!=='string'||token.length>160)throw Error('Invalid guest identity');
 const existing=room.players.find(p=>p.token===token && !p.bot);
 if(existing){ existing.name=validateName(name); existing.connected=true; room.lastActive=Date.now(); return existing; }
 if(room.phase!=='lobby')throw Error('Match already started; only existing players can reconnect.');
 if(room.players.length>=room.mode)throw Error('Room is full.');
 const taken=new Set(room.players.map(p=>p.seat));
 let seat=0;while(taken.has(seat))seat++;
 const p=newPlayer({token,name,seat});
 room.players.push(p);room.players.sort((a,b)=>a.seat-b.seat);room.lastActive=Date.now();return p;
}
export function changeSettings(room,token,mode,fillBots,settings={},publicRoom=room.publicRoom){
 if(room.phase!=='lobby')throw Error('Match has already started.');
 if(token!==room.host)throw Error('Only the host can change settings.');
 if(![2,3,4].includes(+mode))throw Error('Invalid player count.');
 if(+mode<room.players.length)throw Error('There are too many players for that mode.');
 room.mode=+mode;room.fillBots=!!fillBots;room.settings=validateSettings(settings);room.publicRoom=publicRoom===true;
}
// The host may switch the 4-player objective during an active match. The new goal
// applies from the NEXT action; changing it does not award an instant victory.
export function toggleRandomEvents(room,token,enabled){
 if(token!==room.host)throw Error('Only the host can toggle events.');
 if(!['play','draft','lobby'].includes(room.phase))throw Error('The match has ended.');
 if(typeof enabled!=='boolean')throw Error('Choose on or off.');
 if(enabled){room.settings.eventEvery=room.eventsPreferredEvery||3;}
 else{room.eventsPreferredEvery=room.settings.eventEvery||room.eventsPreferredEvery||3;room.settings.eventEvery=0;}
 log(room,`CHAOS EVENTS ${enabled?'ENABLED':'DISABLED'} by the host.`);
 return enabled;
}

export function toggleCenterGoal(room,token,enabled){
 if(token!==room.host)throw Error('Only the host can change the win condition.');
 if(room.mode!==4)throw Error('Middle objective is only available for four players.');
 if(!['play','draft','lobby'].includes(room.phase))throw Error('This match has ended.');
 if(typeof enabled!=='boolean')throw Error('Choose on or off.');
 room.settings.centerGoal=enabled;
 if(enabled){
  // A previously legal edge-race wall configuration might fully surround the CORE.
  // Safely clear newest barricades until every player has a route to the new target.
  let cleared=0;
  while(room.walls.length&&room.players.some(p=>shortestPath(room,p)===Infinity)){
   room.walls.pop();cleared++;
  }
  if(cleared)log(room,`CORE UNSEALED · cleared ${cleared} wall${cleared===1?'':'s'} for fair paths.`);
 }
 log(room,`OBJECTIVE SWITCHED · ${enabled?'Reach the CENTER to win!':'Race to the opposite EDGE to win!'}`);
 return enabled;
}

export function addBotsAndStart(room,token){
 if(room.phase!=='lobby'||room.host!==token)throw Error('Only the host can start.');
 if(!room.fillBots&&room.players.length!==room.mode)throw Error('Wait for players or enable Fill With Bots.');
 for(let i=room.players.length;i<room.mode;i++){
  const taken=new Set(room.players.map(p=>p.seat));let seat=0;while(taken.has(seat))seat++;
  const bot=newPlayer({token:null,name:`Bot ${seat+1}`,seat,bot:true});bot.classId=CLASS_LIBRARY[seat%CLASS_LIBRARY.length].id;room.players.push(bot);
 }
 room.players.sort((a,b)=>a.seat-b.seat);room.walls=[];room.n=9;room.round=1;room.acted=0;room.turn=0;room.bonus=0;room.winner=null;room.history=[];room.lastEvent=null;room.eventSeq=0;
 for(const p of room.players){p.pos=spawn(p.seat,9);p.walls=room.mode===2?10:room.mode===3?8:7;p.hand=[];p.passives=[];p.cooldowns={};p.wallsBuilt=0;p.turnsTaken=0;
  const cls=classById(p.classId)||CLASS_LIBRARY[0];
  equipCard(p,cls.starter);
  if(cls.id==='architect')p.walls+=3;
  if(cls.id==='sentinel')p.walls+=2;
 }
 if(room.settings.startingCards>0)beginDraft(room,room.settings.startingCards,'OPENING DRAFT');
 else{room.phase='play';log(room,'The race begins!');awardTurn(room);}
 return room;
}
function log(room,msg){room.history.push(msg);if(room.history.length>12)room.history.shift();}
function beginDraft(room,count=room.settings.cardsPerDraft,reason='NEW ROUND'){
 room.phase='draft';room.acted=0;room.bonus=0;room.draftReason=reason;
 for(const p of room.players){p.picked=false;p.draftLeft=count;p.options=draftCards(Math.random,p);}
 log(room,`${reason} · choose ${count} card${count===1?'':'s'}!`);
 // Auto-pick for bots and disconnected seats without stalling human players.
 for(const p of room.players){if(p.bot||!p.connected){while(!p.picked)pickCard(room,p.id,p.options[0],true);}}
}
export function pickCard(room,playerId,cardId,auto=false){
 if(room.phase!=='draft')throw Error('Card selection is closed.');
 const p=room.players.find(x=>x.id===playerId);
 if(!p||p.picked||!p.options.includes(cardId))throw Error('Card is not in your selection.');
 equipCard(p,cardId);p.draftLeft--;
 if(p.draftLeft>0)p.options=draftCards(Math.random,p);
 else{p.picked=true;p.options=[];}
 if(room.players.every(x=>x.picked)){
  room.phase='play';log(room,'All cards locked in — let the round begin!');awardTurn(room);
 }
 return p;
}
function edgeBlocked(room,r,c,nr,nc){
 for(const w of room.walls){
  if(w.o==='h'&&nc===c&&((r===w.r&&nr===w.r+1)||(r===w.r+1&&nr===w.r))&&c>=w.c&&c<w.c+w.len)return true;
  if(w.o==='v'&&nr===r&&((c===w.c&&nc===w.c+1)||(c===w.c+1&&nc===w.c))&&r>=w.r&&r<w.r+w.len)return true;
 }
 return false;
}
export function centerObjective(room){return room.mode===4&&room.settings.centerGoal===true;}
export function goalReached(p,n,room=null){if(room&&centerObjective(room))return p.pos.r===Math.floor(n/2)&&p.pos.c===Math.floor(n/2);return p.seat===0?p.pos.r===0:p.seat===1?p.pos.r===n-1:p.seat===2?p.pos.c===n-1:p.pos.c===0;}
function goalAt(seat,n,r,c,room=null){if(room&&centerObjective(room))return r===Math.floor(n/2)&&c===Math.floor(n/2);return seat===0?r===0:seat===1?r===n-1:seat===2?c===n-1:c===0;}
export function shortestPath(room,player,start){
 const n=room.n,from=start||player.pos;if(!inside(n,from.r,from.c))return Infinity;
 const q=[[from.r,from.c,0]],seen=new Set([key(from.r,from.c)]);
 for(let i=0;i<q.length;i++){
  const [r,c,d]=q[i];if(goalAt(player.seat,n,r,c,room))return d;
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
export const RANDOM_EVENTS=Object.freeze([
 {id:'supply_rain',icon:'🎁',name:'SUPPLY RAIN',desc:'Every player receives 4 bonus walls.'},
 {id:'quake',icon:'💥',name:'WALLQUAKE',desc:'Up to 4 random barricades crumble.'},
 {id:'card_comet',icon:'☄️',name:'CARD COMET',desc:'Every player receives a surprise card.'},
 {id:'wall_tax',icon:'🪙',name:'WALL TAX',desc:'Everyone loses up to 2 stored walls.'},
 {id:'rift_rush',icon:'🌀',name:'RIFT RUSH',desc:'Each player teleports to an available adjacent tile.'},
 {id:'gold_rush',icon:'🏆',name:'GOLD RUSH',desc:'Every player gains 7 walls.'},
 {id:'reckoning',icon:'🔥',name:'RECKONING',desc:'All player walls are removed from the arena.'}
]);
export function triggerRandomEvent(room,rng=Math.random,forcedId=null){
 const picked=forcedId?RANDOM_EVENTS.find(x=>x.id===forcedId):RANDOM_EVENTS[Math.floor(rng()*RANDOM_EVENTS.length)];
 if(!picked)throw Error('Unknown random event.');
 if(picked.id==='supply_rain'||picked.id==='gold_rush')for(const p of room.players)p.walls=Math.min(60,p.walls+(picked.id==='gold_rush'?7:4));
 if(picked.id==='wall_tax')for(const p of room.players)p.walls=Math.max(0,p.walls-2);
 if(picked.id==='quake'){const count=Math.min(4,room.walls.length);for(let i=0;i<count;i++)room.walls.splice(Math.floor(rng()*room.walls.length),1);}
 if(picked.id==='reckoning')room.walls=[];
 if(picked.id==='card_comet')for(const p of room.players){const opt=draftCards(rng,p);if(opt.length)equipCard(p,opt[0]);}
 if(picked.id==='rift_rush'){
  // Simultaneous moves are resolved seat by seat. Never overlap players.
  for(const p of room.players){const positions=legalMoves(room,p).filter(x=>Math.abs(x.r-p.pos.r)+Math.abs(x.c-p.pos.c)===1);if(positions.length)p.pos={...positions[Math.floor(rng()*positions.length)]};}
 }
 room.lastEvent={...picked,seq:++room.eventSeq,round:room.round};
 log(room,`${picked.icon} ${picked.name} · ${picked.desc}`);
 return room.lastEvent;
}

function finishAction(room,p,bonus=0,actionType='other'){
 if(goalReached(p,room.n,room)){room.phase='finished';room.winner=p.id;log(room,`${p.name} wins the match!`);return;}
 // Tempo passives trigger at most once on a normal personal turn; no recursive bonus loops.
 if(actionType==='move'&&room.bonus===0){
  const buff=strongest(p,'bonusmove',x=>1/(x.every||10));
  if(buff){const every=Math.max(2,buff.every-Math.floor((buff.level-1)/2));
   if(p.turnsTaken-(p.cooldowns.bonusmove??-999)>=every){p.cooldowns.bonusmove=p.turnsTaken;bonus=Math.max(1,bonus);}}
 }
 if(bonus)room.bonus+=bonus;
 if(room.bonus>0){room.bonus--;log(room,`${p.name} gained an extra action!`);return;}
 room.acted++;
 if(room.acted>=room.players.length){
  room.acted=0;room.round++;room.turn=0;
  const expandEvery=room.settings.expandEvery;
  if(expandEvery>0&&(room.round-1)%expandEvery===0&&room.n<17){
   room.n+=2;for(const x of room.players){x.pos.r++;x.pos.c++;for(const buff of passivesFor(x,'expansion'))x.walls=Math.min(60,x.walls+buff.power*buff.level);for(const buff of x.passives.map(y=>cardById(y.id)))if(buff?.extraExpansion)x.walls=Math.min(60,x.walls+buff.extraExpansion);}
   for(const w of room.walls){w.r++;w.c++;}
   log(room,`ARENA EXPANSION · ${room.n} × ${room.n}!`);
  }
  if(room.settings.eventEvery>0&&(room.round-1)%room.settings.eventEvery===0)triggerRandomEvent(room);
  if(room.settings.draftEvery>0&&(room.round-1)%room.settings.draftEvery===0)beginDraft(room,room.settings.cardsPerDraft,`ROUND ${room.round} DRAFT`);
  else awardTurn(room);
 }else{room.turn=(room.turn+1)%room.players.length;awardTurn(room);}
}
export function act(room,playerId,action){
 if(room.phase!=='play')throw Error('The game is not accepting moves.');
 const p=room.players[room.turn];if(!p||p.id!==playerId)throw Error('It is not your turn.');
 if(!action||typeof action!=='object')throw Error('Invalid action.');
 if((action.classSkill&&(action.cardId||action.passiveId))||(action.cardId&&action.passiveId))throw Error('Choose one ability.');
 const skill=action.classSkill?classSkillFor(room,p):null;
 if(skill&&skill.readyIn>0)throw Error(`${skill.name} needs ${skill.readyIn} more personal turn(s) to recharge.`);
 if(action.classSkill&&!['move','wall','remove','activate'].includes(action.type))throw Error('Unknown class skill action.');
 const item=action.cardId?p.hand.find(x=>x.uid===action.cardId):null;
 if(action.cardId&&!item)throw Error('You do not own that card.');
 const card=item?cardById(item.id):null;
 if(item&&!card)throw Error('Unknown card.');
 if(action.type==='activate'){
  if(skill){
   if(skill.kind!=='instant')throw Error('This class ability is not a supply power.');
   p.walls=Math.min(p.walls+skill.power,60);p.cooldowns.classSkill=p.turnsTaken;
   log(room,`${p.name} activated ${skill.name} (+${skill.power} walls)!`);return;
  }
  if(!card||card.kind!=='instant')throw Error('Select an instant card.');
  if(card.effect==='timeburst'){
   if(room.bonus>=2)throw Error('You already have the maximum two banked extra actions.');
   room.bonus++;useCard(p,item);log(room,`${p.name} bent time and banked an extra action!`);return;
  }
  p.walls=Math.min(p.walls+card.power,60);useCard(p,item);log(room,`${p.name} used ${card.name} (+${card.power} walls).`);return;
 }
 if(action.type==='move'){
  if(card&&card.kind!=='move'||skill&&skill.kind!=='move')throw Error('That ability cannot be used to move.');
  const to=action.to;
  if(!to||!Number.isInteger(to.r)||!Number.isInteger(to.c))throw Error('Invalid destination.');
  if(action.passiveId&&typeof action.passiveId!=='string')throw Error('Invalid passive.');
  const passiveOptions=passiveMoves(room,p);
  const allowed=skill?skill.moves:card?specialMoves(room,p,card):action.passiveId?passiveOptions[action.passiveId]:legalMoves(room,p);
  if(!allowed?.some(m=>eq(m,to)))throw Error('Illegal move.');
  p.pos={r:to.r,c:to.c};
  if(['vault','blink','portal'].includes(action.passiveId))p.cooldowns[action.passiveId]=p.turnsTaken;
  if(skill)p.cooldowns.classSkill=p.turnsTaken;
  useCard(p,item);log(room,`${p.name} moved${skill?` using ${skill.name}`:card?` using ${card.name}`:action.passiveId?` with ${action.passiveId}`:''}.`);finishAction(room,p,card?.bonus||0,'move');return;
 }
 if(action.type==='wall'){
  if(card&&card.kind!=='wall'||skill&&skill.kind!=='wall')throw Error('That ability cannot place walls.');
  const length=skill?skill.power:card?.length||baseWallLength(p);
  const disc=strongest(p,'discount',x=>1/(x.every||10));
  const freeEvery=disc?Math.max(1,(disc.every||2)-(disc.level>=3?1:0)):0;
  const cost=skill?0:freeEvery&&(p.wallsBuilt+1)%freeEvery===0?0:(card?.cost??1);
  if(p.walls<cost)throw Error('You have no walls left.');
  const w={r:action.wall?.r,c:action.wall?.c,o:action.wall?.o,len:length};
  if(!wallFits(room,w))throw Error('That wall overlaps, crosses, or blocks the only path.');
  room.walls.push({...w,id:randomUUID(),owner:p.id});p.walls-=cost;p.wallsBuilt++;
  for(const buff of passivesFor(p,'refund')){const every=Math.max(1,buff.every-(buff.level>1?1:0));if(p.wallsBuilt%every===0)p.walls=Math.min(60,p.walls+1);}
  if(skill)p.cooldowns.classSkill=p.turnsTaken;
  useCard(p,item);log(room,`${p.name} ${skill?`used ${skill.name} to build`:'built'} a ${length}-tile wall${cost===0?' for FREE':''}.`);finishAction(room,p,card?.bonus||0,'wall');return;
 }
 if(action.type==='remove'){
  if((!card||card.kind!=='remove')&&(!skill||skill.kind!=='remove'))throw Error('Select a removal ability first.');
  const index=room.walls.findIndex(w=>w.id===action.wallId);if(index<0)throw Error('Wall not found.');
  const wall=room.walls[index];
  if(card?.effect==='reclaim'&&wall.owner!==p.id)throw Error('Only your walls can be reclaimed.');
  const removed=card?.effect==='blast'?room.walls.filter(w=>wallsTouch(wall,w)): [wall];
  const ids=new Set(removed.map(w=>w.id));room.walls=room.walls.filter(w=>!ids.has(w.id));
  if(card?.effect==='reclaim')p.walls=Math.min(60,p.walls+card.power);
  if(skill)p.cooldowns.classSkill=p.turnsTaken;
  useCard(p,item);log(room,`${p.name} destroyed ${removed.length} wall${removed.length!==1?'s':''} with ${skill?.name||card.name}.`);finishAction(room,p);return;
 }
 if(action.type==='target'){
  if(!card||card.kind!=='target')throw Error('Select a targeting card first.');
  const target=room.players.find(x=>x.id===action.targetPlayerId);
  if(!target||target.id===p.id)throw Error('Select a different player.');
  if(card.effect==='reset'){
   const destination=spawn(target.seat,room.n);
   if(room.players.some(x=>x.id!==target.id&&eq(x.pos,destination)))throw Error('The target spawn tile is occupied.');
   target.pos=destination;
  } else if(card.effect==='swap'){
   const old={...p.pos};p.pos={...target.pos};target.pos=old;
  } else {
   const amount=Math.min(target.walls,card.power);target.walls-=amount;
   if(card.effect==='steal')p.walls=Math.min(60,p.walls+amount);
  }
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
 const me=room.players.find(p=>p.token===token&&!p.bot);
 const isTurn=!!me&&room.phase==='play'&&room.players[room.turn]?.id===me.id;
 return {code:room.code,mode:room.mode,fillBots:room.fillBots,publicRoom:room.publicRoom,settings:room.settings,lastEvent:room.lastEvent,phase:room.phase,n:room.n,round:room.round,turn:room.turn,acted:room.acted,bonus:room.bonus,draftReason:room.draftReason||'',draftLeft:me?.draftLeft||0,host:token===room.host,winner:room.winner,
  players:room.players.map(p=>({id:p.id,name:p.name,seat:p.seat,classId:p.classId,mastery:classTier(p),turnsTaken:p.turnsTaken,bot:p.bot,connected:p.connected,pos:p.pos,walls:p.walls,handCount:p.hand.length,passiveCount:p.passives.length,loadout:{hand:p.hand.map(item=>cardById(item.id)).filter(Boolean),passives:p.passives.map(item=>({card:cardById(item.id),level:item.level})).filter(item=>item.card)},picked:p.picked,color:COLORS[p.seat]})),
  walls:room.walls,history:room.history,me:me?.id||null,hand:me?.hand.map(x=>({...x,card:cardById(x.id)}))||[],
  passives:me?.passives.map(x=>({...x,card:cardById(x.id)}))||[],
  wallLength:me?baseWallLength(me):2,classLibrary:CLASS_LIBRARY,classSkill:me&&room.phase==='play'?classSkillFor(room,me):null,
  options:me&&room.phase==='draft'&&!me.picked?me.options.map(id=>cardById(id)):[],
  legal:isTurn?legalMoves(room,me):[],
  moveOptions:isTurn?Object.fromEntries(me.hand.filter(x=>cardById(x.id)?.kind==='move').map(x=>[x.uid,specialMoves(room,me,{...cardById(x.id),max:cardById(x.id).max})])):{},
  passiveOptions:isTurn?passiveMoves(room,me):{}
 };
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
   const r=enemy.pos.r+d,c=enemy.pos.c+e,w={r,c,o,len:baseWallLength(p)};
   if(!wallFits(room,w))continue;
   room.walls.push({...w,id:'test',owner:p.id});const their=shortestPath(room,enemy),my=shortestPath(room,p);room.walls.pop();
   const score=(their-oldEnemy)-(my-ownDist)*1.2;
   if(their-oldEnemy>0&&score>0)candidate.push({w,score});
  }
  if(candidate.length){candidate.sort((a,b)=>b.score-a.score);try{act(room,p.id,{type:'wall',wall:candidate[0].w});return;}catch{}}
 }
 const skill=classSkillFor(room,p);
 if(skill.readyIn===0&&skill.kind==='remove'&&room.walls.length>0){
  const enemyWall=room.walls.find(w=>w.owner!==p.id)||room.walls[0];
  try{act(room,p.id,{type:'remove',wallId:enemyWall.id,classSkill:true});return;}catch{}
 }
 if(skill.readyIn===0&&skill.kind==='instant'){
  try{act(room,p.id,{type:'activate',classSkill:true});}catch{}
 }
 const moves=legalMoves(room,p);
 if(skill.readyIn===0&&skill.kind==='move'&&skill.moves.length){
  const best=skill.moves.map(to=>({to,dist:shortestPath(room,p,to)})).sort((a,b)=>a.dist-b.dist)[0];
  const basic=Math.min(...moves.map(to=>shortestPath(room,p,to)));
  if(best.dist+0.3<basic){try{act(room,p.id,{type:'move',to:best.to,classSkill:true});return;}catch{}}
 }
 if(skill.readyIn===0&&skill.kind==='wall'&&Math.random()<0.12){
  const opponent=room.players.filter(x=>x.id!==p.id).sort((a,b)=>shortestPath(room,a)-shortestPath(room,b))[0];
  for(const o of ['h','v'])for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
   const w={r:opponent.pos.r+dr,c:opponent.pos.c+dc,o,len:skill.power};
   if(wallFits(room,w)){try{act(room,p.id,{type:'wall',wall:w,classSkill:true});return;}catch{}}
  }
 }

 if(!moves.length)return;
 const bestBasic=Math.min(...moves.map(to=>shortestPath(room,p,to)));
 const pass=passiveMoves(room,p);
 for(const [effect,poss] of Object.entries(pass)){
  const candidates=poss.map(to=>({to,dist:shortestPath(room,p,to)})).sort((a,b)=>a.dist-b.dist);
  if(candidates.length&&candidates[0].dist+.2<bestBasic){try{act(room,p.id,{type:'move',to:candidates[0].to,passiveId:effect});return;}catch{}}
 }
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
