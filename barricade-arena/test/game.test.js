import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createRoom,joinHuman,addBotsAndStart,pickCard,act,legalMoves,wallFits,
 shortestPath,CARD_LIBRARY,viewFor,specialMoves,botTurn,roomCode,
 validateSettings,equipCard,baseWallLength,passiveMoves,draftCards,changeSettings,CLASS_LIBRARY,chooseClass,classSkillFor,classTier,toggleCenterGoal,centerObjective,triggerRandomEvent,RANDOM_EVENTS,goalReached,toggleRandomEvents
} from '../game.js';
const HOST='guest-host-0123456789';
function resolveDraft(room){
 let loops=0;
 while(room.phase==='draft'){
  if(++loops>300)throw Error('Draft did not complete');
  const p=room.players.find(x=>!x.picked);
  pickCard(room,p.id,p.options[0]);
 }
}
function game(n=2,settings={}){const r=createRoom({hostToken:HOST,hostName:'Alpha',mode:n,fillBots:true,settings});addBotsAndStart(r,r.host);resolveDraft(r);return r;}
function move(room,dr,dc){const p=room.players[room.turn];act(room,p.id,{type:'move',to:{r:p.pos.r+dr,c:p.pos.c+dc}});}
test('four-character codes are human friendly, room join and name validation',()=>{
 for(let i=0;i<40;i++)assert.match(roomCode(),/^[A-HJ-NP-Z2-9]{4}$/);
 const r=createRoom({hostToken:HOST,hostName:'A',mode:4});
 assert.match(r.code,/^[A-HJ-NP-Z2-9]{4}$/);
 const p=joinHuman(r,'person-0123456789012','B<script>');assert.equal(p.name,'Bscript');
 assert.equal(joinHuman(r,'person-0123456789012','B2').id,p.id);assert.equal(r.players.length,2);
});
test('host controls settings, server validates options',()=>{
 const r=createRoom({hostToken:HOST,hostName:'A'});
 assert.equal(r.settings.expandEvery,4);
 changeSettings(r,HOST,3,true,{expandEvery:2,draftEvery:3,startingCards:5,cardsPerDraft:3,cardsPerTurn:1});
 assert.deepEqual(r.settings,{expandEvery:2,draftEvery:3,startingCards:5,cardsPerDraft:3,cardsPerTurn:1,eventEvery:3,centerGoal:false});
 assert.throws(()=>changeSettings(r,'no',3,true,{}),/host/i);
 assert.throws(()=>validateSettings({expandEvery:17}),/Invalid/);
});
test('passives equip immediately, duplicate levels and supply perks',()=>{
 const r=game(2,{startingCards:0,draftEvery:0});const p=r.players[0];
 const initial=p.walls;
 equipCard(p,'supply_pouch');assert.equal(p.walls,initial+2);
 equipCard(p,'supply_pouch');equipCard(p,'supply_pouch');equipCard(p,'supply_pouch');
 assert.equal(p.passives.find(x=>x.id==='supply_pouch').level,3);
 assert.equal(p.walls,initial+6); // only 3 levels grant supplies
 equipCard(p,'wall_stretcher');assert.equal(baseWallLength(p),3);
 equipCard(p,'wall_stretcher');assert.equal(baseWallLength(p),4);
 equipCard(p,'trail_runner');
 assert.ok(passiveMoves(r,p).stride.some(x=>x.r===6&&x.c===4));
});
test('all players can inspect chosen cards, but draft offers and tokens are hidden',()=>{
 const r=game(4);
 const me=r.players[0];assert.equal(r.phase,'play');
 assert.equal(me.passives.reduce((total,x)=>total+x.level,0)+me.hand.length,3); // two draft cards and one class starter
 const v=viewFor(r,me.token);
 assert.equal(v.me,me.id);assert.equal(v.players[1].hand,undefined);
 assert.equal(v.players[1].passives,undefined);
 assert.ok(Array.isArray(v.players[1].loadout.hand));
 assert.ok(Array.isArray(v.players[1].loadout.passives));
 assert.equal(JSON.stringify(v).includes('guest-host-0123456789'),false);
 assert.equal(JSON.stringify(v.players).includes('options'),false);
 assert.deepEqual(v.settings,r.settings);
});
test('basic legal moves and turn gating',()=>{
 const r=game(2,{startingCards:0,draftEvery:0});const a=r.players[0],b=r.players[1];
 assert.deepEqual(legalMoves(r,a).sort((x,y)=>x.r-y.r||x.c-y.c),[{r:7,c:4},{r:8,c:3},{r:8,c:5}].sort((x,y)=>x.r-y.r||x.c-y.c));
 assert.throws(()=>act(r,b.id,{type:'move',to:{r:1,c:4}}),/not your turn/i);
 move(r,-1,0);assert.equal(r.turn,1);
 assert.throws(()=>act(r,b.id,{type:'move',to:{r:7,c:4}}),/Illegal move/);
});
test('regular barricades block overlap, crossings, and paths',()=>{
 const r=game();const w={o:'h',r:5,c:3,len:2};assert.equal(wallFits(r,w),true);
 act(r,r.players[0].id,{type:'wall',wall:w});assert.equal(r.walls.length,1);
 assert.equal(wallFits(r,{o:'v',r:5,c:3,len:2}),false);
 assert.equal(wallFits(r,{o:'h',r:5,c:4,len:2}),false);
 r.walls=[{id:'a',owner:'none',o:'h',r:0,c:0,len:4},{id:'b',owner:'none',o:'h',r:0,c:4,len:4}];
 assert.equal(wallFits(r,{o:'h',r:0,c:8,len:1}),false);
 assert.equal(shortestPath(r,r.players[0])<Infinity,true);
});
test('one use item supply, movement and removal are enforced',()=>{
 const r=game();const a=r.players[0];const before=a.walls;
 a.hand.push({uid:'sup',id:'spare_planks'},{uid:'dash',id:'sprint'});
 act(r,a.id,{type:'activate',cardId:'sup'});assert.equal(a.walls,before+2);assert.equal(r.turn,0);
 assert.ok(specialMoves(r,a,CARD_LIBRARY.find(x=>x.id==='sprint')).some(x=>x.r===5&&x.c===4));
 act(r,a.id,{type:'move',to:{r:5,c:4},cardId:'dash'});
 assert.equal(a.pos.r,5);assert.equal(a.hand.some(x=>x.uid==='dash'),false);
});
test('vault cooldown and forged passives cannot bypass action validation',()=>{
 const r=game(2,{startingCards:0,draftEvery:0});const p=r.players[0];equipCard(p,'wall_jumper');
 assert.ok(passiveMoves(r,p).vault.length);
 act(r,p.id,{type:'move',to:{r:7,c:4},passiveId:'vault'});
 assert.ok(!passiveMoves(r,p).vault);
 assert.throws(()=>act(r,r.players[1].id,{type:'move',to:{r:3,c:4},passiveId:'vault'}),/Illegal move/);
});
test('rounds, expansion timing and draft cadence are adjustable',()=>{
 const r=game(2,{startingCards:0,draftEvery:2,expandEvery:2});
 for(let round=1;round<=2;round++){
  move(r,round%2?-1:1,0);move(r,round%2?1:-1,0);
  resolveDraft(r);
 }
 assert.equal(r.n,11);assert.equal(r.round,3);
 assert.equal(r.players[0].pos.r,9);
 assert.ok(r.players[0].hand.length+r.players[0].passives.length>=1);
});
test('draft slots are distinct and common passives are valid cards',()=>{
 const p=game(2,{startingCards:0,draftEvery:0}).players[0];
 const offers=draftCards(()=>0.1,p);assert.equal(new Set(offers).size,3);
 assert.equal(offers.every(x=>CARD_LIBRARY.some(c=>c.id===x)),true);
});
test('auto cards per turn are awarded by server',()=>{
 const r=game(2,{startingCards:0,draftEvery:0,cardsPerTurn:2});
 const a=r.players[0];assert.equal(a.hand.length+a.passives.reduce((total,x)=>total+x.level,0),3);
 move(r,-1,0);
 assert.equal(r.players[1].hand.length+r.players[1].passives.reduce((total,x)=>total+x.level,0),3);
});
test('card index has majority permanent upgrades and 6 rarity tiers',()=>{
 assert.ok(CARD_LIBRARY.filter(x=>x.kind==='passive').length>CARD_LIBRARY.length/2);
 assert.ok(CARD_LIBRARY.some(x=>x.rarity==='Mythic'));
 assert.equal(new Set(CARD_LIBRARY.map(x=>x.id)).size,CARD_LIBRARY.length);
});
test('victory ends the match immediately',()=>{
 const r=game();r.players[0].pos={r:1,c:3};
 act(r,r.players[0].id,{type:'move',to:{r:0,c:3}});
 assert.equal(r.phase,'finished');assert.equal(r.winner,r.players[0].id);
});
test('fake card and invalid wall are rejected with no state mutation',()=>{
 const r=game(),p=r.players[0],count=r.walls.length;
 assert.throws(()=>act(r,p.id,{type:'wall',wall:{o:'h',r:999,c:0}}),/wall overlaps/i);
 assert.throws(()=>act(r,p.id,{type:'move',to:{r:6,c:4},cardId:'fake'}),/not own/i);
 assert.equal(r.walls.length,count);
});
test('bots make progress under the same authoritative rules',()=>{
 const r=game(3,{startingCards:0,draftEvery:0});move(r,-1,0);assert.equal(r.turn,1);
 botTurn(r,r.players[1]);assert.equal(r.turn,2);
});


test('six hero classes have unique identities, active powers and starter passives',()=>{
 assert.equal(CLASS_LIBRARY.length,6);
 assert.equal(new Set(CLASS_LIBRARY.map(c=>c.id)).size,6);
 assert.equal(new Set(CLASS_LIBRARY.map(c=>c.skill)).size,6);
 for(const cls of CLASS_LIBRARY){
  const r=createRoom({hostToken:HOST,hostName:'Test',fillBots:true,settings:{startingCards:0,draftEvery:0}});
  chooseClass(r,HOST,cls.id);addBotsAndStart(r,HOST);
  assert.equal(r.players[0].classId,cls.id);
  assert.ok(r.players[0].passives.some(x=>x.id===cls.starter),cls.id+' starter missing');
  assert.equal(classSkillFor(r,r.players[0]).readyIn,0);
  assert.equal(classSkillFor(r,r.players[0]).name,cls.skill);
 }
});
test('classes can be chosen only by owning seat and before game starts',()=>{
 const r=createRoom({hostToken:HOST,hostName:'Test'});
 assert.throws(()=>chooseClass(r,HOST,'ghost'),/Unknown class/);
 assert.throws(()=>chooseClass(r,'invalid','wraith'),/Join/);
 const visitor=joinHuman(r,'visitor-1234567890123','Beta');
 chooseClass(r,visitor.token,'oracle');
 assert.equal(visitor.classId,'oracle');
 addBotsAndStart(r,HOST);
 assert.throws(()=>chooseClass(r,HOST,'sentinel'),/before.*match/);
});
test('vanguard class dash is server validated and obeys recharge time',()=>{
 const r=game(2,{startingCards:0,draftEvery:0});const p=r.players[0];
 const ability=classSkillFor(r,p);
 assert.ok(ability.moves.some(x=>x.r===5&&x.c===4));
 assert.throws(()=>act(r,p.id,{type:'move',to:{r:1,c:4},classSkill:true}),/Illegal move/);
 act(r,p.id,{type:'move',to:{r:5,c:4},classSkill:true});
 assert.equal(p.pos.r,5);assert.equal(p.cooldowns.classSkill,1);
 assert.equal(classSkillFor(r,p).readyIn,3);
});
test('architect skill lays free extra-long wall without using wall supply',()=>{
 const r=createRoom({hostToken:HOST,hostName:'A',fillBots:true,settings:{startingCards:0,draftEvery:0}});
 chooseClass(r,HOST,'architect');addBotsAndStart(r,HOST);
 const p=r.players[0],before=p.walls;
 act(r,p.id,{type:'wall',wall:{o:'h',r:5,c:2},classSkill:true});
 assert.equal(r.walls[0].len,3);assert.equal(p.walls,before);
 assert.equal(classSkillFor(r,p).readyIn,4);
});
test('wraith class can phase through blocked edges and validates exact distance',()=>{
 const r=createRoom({hostToken:HOST,hostName:'A',fillBots:true,settings:{startingCards:0,draftEvery:0}});
 chooseClass(r,HOST,'wraith');addBotsAndStart(r,HOST);
 const p=r.players[0];
 r.walls.push({id:'block',owner:r.players[1].id,o:'h',r:7,c:3,len:3});
 assert.equal(legalMoves(r,p).some(x=>x.r===7&&x.c===4),false);
 assert.ok(classSkillFor(r,p).moves.some(x=>x.r===6&&x.c===4));
 act(r,p.id,{type:'move',to:{r:6,c:4},classSkill:true});
 assert.equal(p.pos.r,6);
});
test('saboteur class destroys a wall, but cannot repeat the ability immediately',()=>{
 const r=createRoom({hostToken:HOST,hostName:'A',fillBots:true,settings:{startingCards:0,draftEvery:0}});
 chooseClass(r,HOST,'saboteur');addBotsAndStart(r,HOST);
 r.walls.push({id:'opponent_wall',owner:r.players[1].id,o:'h',r:5,c:3,len:2});
 const p=r.players[0];act(r,p.id,{type:'remove',wallId:'opponent_wall',classSkill:true});
 assert.equal(r.walls.length,0);assert.equal(classSkillFor(r,p).readyIn,4);
});
test('oracle warp can move in diamond radius, sentinel resupply is non-turn skill',()=>{
 const r=createRoom({hostToken:HOST,hostName:'A',fillBots:true,settings:{startingCards:0,draftEvery:0}});
 chooseClass(r,HOST,'oracle');addBotsAndStart(r,HOST);
 const p=r.players[0];assert.ok(classSkillFor(r,p).moves.some(x=>x.r===7&&x.c===3));
 act(r,p.id,{type:'move',to:{r:7,c:3},classSkill:true});assert.equal(p.pos.c,3);
 const w=createRoom({hostToken:HOST,hostName:'B',fillBots:true,settings:{startingCards:0,draftEvery:0}});
 chooseClass(w,HOST,'sentinel');addBotsAndStart(w,HOST);
 const sent=w.players[0],before=sent.walls;
 act(w,sent.id,{type:'activate',classSkill:true});assert.equal(sent.walls,before+3);assert.equal(w.turn,0);
 assert.throws(()=>act(w,sent.id,{type:'activate',classSkill:true}),/recharge/);
});
test('classes evolve at turn 4 and turn 9, progression stays private',()=>{
 const r=game(2,{startingCards:0,draftEvery:0});const p=r.players[0];
 p.turnsTaken=4;assert.equal(classTier(p),2);assert.equal(classSkillFor(r,p).power,4);
 p.turnsTaken=9;assert.equal(classTier(p),3);assert.equal(classSkillFor(r,p).maxCooldown,2);
 const v=viewFor(r,p.token);
 assert.equal(v.classSkill.tier,3);assert.equal(v.players[0].mastery,3);
 assert.equal(v.players[1].hand,undefined);assert.equal(v.players[1].passives,undefined);
});
test('new walls block movement from BOTH sides of horizontal and vertical segments',()=>{
 const r=game(2,{startingCards:0,draftEvery:0});const p=r.players[0];
 r.walls=[{id:'w1',owner:'x',o:'h',r:7,c:3,len:3}];
 assert.equal(legalMoves(r,p).some(x=>x.r===7&&x.c===4),false);
 p.pos={r:7,c:4};assert.equal(legalMoves(r,p).some(x=>x.r===8&&x.c===4),false);
 p.pos={r:4,c:3};r.walls=[{id:'w2',owner:'x',o:'v',r:3,c:3,len:3}];
 assert.equal(legalMoves(r,p).some(x=>x.r===4&&x.c===4),false);
 p.pos={r:4,c:4};assert.equal(legalMoves(r,p).some(x=>x.r===4&&x.c===3),false);
});


test('public visibility is a host setting and cannot be edited by guests',()=>{
 const r=createRoom({hostToken:HOST,hostName:'Test',mode:4,publicRoom:true});
 assert.equal(r.publicRoom,true);
 changeSettings(r,HOST,4,false,{centerGoal:true,eventEvery:2},false);
 assert.equal(r.publicRoom,false);assert.equal(r.settings.centerGoal,true);assert.equal(r.settings.eventEvery,2);
 assert.throws(()=>changeSettings(r,'intruder',4,true,{},true),/host/);
 assert.throws(()=>validateSettings({centerGoal:'true'}),/Invalid/);
});
test('4-player center target ends a game, classic mode still aims for edges',()=>{
 const r=game(4,{startingCards:0,draftEvery:0,eventEvery:0,centerGoal:true});
 assert.equal(centerObjective(r),true);
 assert.equal(shortestPath(r,r.players[0]),4);
 const p=r.players[0];p.pos={r:5,c:4};
 act(r,p.id,{type:'move',to:{r:4,c:4}});
 assert.equal(r.phase,'finished');assert.equal(r.winner,p.id);
 const classic=game(4,{startingCards:0,draftEvery:0,eventEvery:0});
 assert.equal(centerObjective(classic),false);
 assert.equal(goalReached({...classic.players[0],pos:{r:4,c:4}},9,classic),false);
});
test('host switches center objective mid-match, denied to other players',()=>{
 const r=game(4,{startingCards:0,draftEvery:0,eventEvery:0});
 assert.throws(()=>toggleCenterGoal(r,'intruder',true),/host/);
 assert.equal(toggleCenterGoal(r,HOST,true),true);assert.equal(centerObjective(r),true);
 assert.equal(toggleCenterGoal(r,HOST,false),false);assert.equal(centerObjective(r),false);
 assert.throws(()=>toggleCenterGoal(game(2),HOST,true),/four players/);
 assert.throws(()=>toggleCenterGoal(r,HOST,'yes'),/on or off/);
});
test('host switching to center guarantees navigability and goal is never blocked by newly placed walls',()=>{
 const r=game(4,{startingCards:0,draftEvery:0,eventEvery:0,centerGoal:true});
 const middle={r:4,c:4};
 for(const p of r.players)assert.ok(shortestPath(r,p)<Infinity);
 // Last segment of a full ring would trap players outside the objective.
 r.walls=[{id:'a',o:'h',r:3,c:4,len:1,owner:'x'},
  {id:'b',o:'h',r:4,c:4,len:1,owner:'x'},
  {id:'c',o:'v',r:4,c:3,len:1,owner:'x'}];
 assert.equal(wallFits(r,{o:'v',r:4,c:4,len:1}),false);
 assert.ok(middle);
 toggleCenterGoal(r,HOST,false);
 r.walls.push({id:'d',o:'v',r:4,c:4,len:1,owner:'x'});
 toggleCenterGoal(r,HOST,true);
 assert.ok(r.players.every(p=>shortestPath(r,p)<Infinity));
});
test('round events create a server-owned, numbered announcement and bounded effect',()=>{
 const r=game(4,{startingCards:0,draftEvery:0,eventEvery:0});
 assert.equal(RANDOM_EVENTS.length,7);
 const initial=r.players.map(p=>p.walls);
 const ev=triggerRandomEvent(r,()=>.1,'supply_rain');
 assert.equal(ev.id,'supply_rain');assert.equal(ev.seq,1);
 assert.deepEqual(r.players.map(p=>p.walls),initial.map(x=>x+4));
 const other=triggerRandomEvent(r,()=>.1,'wall_tax');assert.equal(other.seq,2);
 assert.deepEqual(r.players.map(p=>p.walls),initial.map(x=>x+2));
 const state=viewFor(r,r.players[0].token);assert.equal(state.lastEvent.seq,2);
 assert.throws(()=>triggerRandomEvent(r,Math.random,'BOGUS'),/Unknown/);
});
test('wild events transform walls and award real cards',()=>{
 const r=game(2,{startingCards:0,draftEvery:0,eventEvery:0});
 r.walls=[{id:'w1',o:'v',r:3,c:4,len:2,owner:'x'},{id:'w2',o:'h',r:2,c:1,len:2,owner:'x'}];
 triggerRandomEvent(r,()=>0,'quake');assert.equal(r.walls.length,0);
 const before=r.players.map(p=>p.hand.length+p.passives.reduce((a,b)=>a+b.level,0));
 triggerRandomEvent(r,()=>0.1,'card_comet');
 assert.equal(r.players.every((p,i)=>p.hand.length+p.passives.reduce((a,b)=>a+b.level,0)>before[i]),true);
});
test('omega targeting powers and action banking apply on authoritative server',()=>{
 const r=game(2,{startingCards:0,draftEvery:0,eventEvery:0});const a=r.players[0],b=r.players[1];
 a.hand.push({uid:'flip',id:'dimension_flip'});
 act(r,a.id,{type:'target',targetPlayerId:b.id,cardId:'flip'});
 assert.equal(a.pos.r,0);assert.equal(b.pos.r,8);
 // The classic win condition: the swap moved A to the north edge.
 assert.equal(r.phase,'finished');assert.equal(r.winner,a.id);
 const q=game(2,{startingCards:0,draftEvery:0,eventEvery:0});const player=q.players[0];
 player.hand.push({uid:'time',id:'timefracture'});
 act(q,player.id,{type:'activate',cardId:'time'});assert.equal(q.bonus,1);
 act(q,player.id,{type:'move',to:{r:7,c:4}});assert.equal(q.turn,0);
});

test('host can switch random events off and back on during play',()=>{
 const r=game(4,{startingCards:0,draftEvery:0,eventEvery:5});
 assert.throws(()=>toggleRandomEvents(r,'bad',false),/host/);
 toggleRandomEvents(r,HOST,false);assert.equal(r.settings.eventEvery,0);
 toggleRandomEvents(r,HOST,true);assert.equal(r.settings.eventEvery,5);
});
