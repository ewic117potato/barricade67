import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom,joinHuman,addBotsAndStart,pickCard,act,legalMoves,wallFits,shortestPath,CARD_LIBRARY,viewFor,specialMoves,botTurn } from '../game.js';

function game(n=2){const r=createRoom({hostToken:'guest-host-0123456789',hostName:'Alpha',mode:n,fillBots:true});addBotsAndStart(r,r.host);for(const p of r.players)if(!p.picked)pickCard(r,p.id,p.options[0]);return r;}
function move(room,dr,dc){const p=room.players[room.turn];act(room,p.id,{type:'move',to:{r:p.pos.r+dr,c:p.pos.c+dc}});}

test('room settings, guests and player modes',()=>{
 const r=createRoom({hostToken:'host-01234567890123',hostName:'A',mode:4});
 assert.equal(r.phase,'lobby');const p=joinHuman(r,'person-0123456789012','B');assert.equal(p.seat,1);
 const again=joinHuman(r,'person-0123456789012','B2');assert.equal(again.id,p.id);
 assert.equal(r.players.length,2);
});
test('starting and simultaneous drafting, server only leaks own hand',()=>{
 const r=game(4);
 assert.equal(r.players.length,4);assert.equal(r.phase,'play');
 assert.equal(r.players[0].hand.length,1);
 const v=viewFor(r,r.players[0].token);assert.equal(v.hand.length,1);assert.equal(v.players[1].handCount,1);
 assert.equal(v.players[1].hand,undefined);
});
test('normal move legal and turn validation',()=>{
 const r=game();const first=r.players[0],second=r.players[1];
 assert.deepEqual(legalMoves(r,first).sort((a,b)=>a.r-b.r||a.c-b.c),[{r:7,c:4},{r:8,c:3},{r:8,c:5}].sort((a,b)=>a.r-b.r||a.c-b.c));
 assert.throws(()=>act(r,second.id,{type:'move',to:{r:1,c:4}}),/not your turn/i);
 act(r,first.id,{type:'move',to:{r:7,c:4}});assert.equal(r.turn,1);
 assert.throws(()=>act(r,second.id,{type:'move',to:{r:7,c:4}}),/Illegal move/);
});
test('basic walls and overlap/cross protection',()=>{
 const r=game();const w={o:'h',r:5,c:3,len:2};assert.equal(wallFits(r,w),true);
 act(r,r.players[0].id,{type:'wall',wall:w});assert.equal(r.walls.length,1);
 assert.equal(wallFits(r,{o:'v',r:5,c:3,len:2}),false);
 assert.equal(wallFits(r,{o:'h',r:5,c:4,len:2}),false);
});
test('pathfinding rejects enclosure of goal and players',()=>{
 const r=game();
 // One long wall across the entire board width would seal paths.
 r.walls=[{id:'a',owner:'any',o:'h',r:0,c:0,len:4},{id:'b',owner:'any',o:'h',r:0,c:4,len:4}];
 assert.equal(wallFits(r,{o:'h',r:0,c:8,len:1}),false);
 assert.equal(shortestPath(r,r.players[0])<Infinity,true);
});
test('power card choices are real and consume on use',()=>{
 const r=game();const p=r.players[0];
 p.hand.push({uid:'inst',id:'spare_planks'});let before=p.walls;
 act(r,p.id,{type:'activate',cardId:'inst'});assert.equal(p.walls,before+1);assert.equal(r.turn,0);
 p.hand.push({uid:'dash',id:'sprint'});
 const m=specialMoves(r,p,CARD_LIBRARY.find(x=>x.id==='sprint'));
 assert.ok(m.some(x=>x.r===5&&x.c===4));
 act(r,p.id,{type:'move',to:{r:5,c:4},cardId:'dash'});
 assert.equal(p.pos.r,5);assert.ok(!p.hand.some(x=>x.uid==='dash'));
});
test('round drafting and map grows after four full rounds',()=>{
 const r=game();
 for(let round=1;round<=4;round++){
  move(r,round%2?-1:1,0);move(r,round%2?1:-1,0);
  if(r.phase==='draft')for(const p of r.players)if(!p.picked)pickCard(r,p.id,p.options[0]);
 }
 assert.equal(r.n,11);assert.equal(r.round,5);assert.equal(r.phase,'play');
 assert.equal(r.players[0].pos.r,9);
});
test('victory occurs when a pawn reaches the opposing edge',()=>{
 const r=game();r.players[0].pos={r:1,c:3};
 act(r,r.players[0].id,{type:'move',to:{r:0,c:3}});
 assert.equal(r.phase,'finished');assert.equal(r.winner,r.players[0].id);
});
test('bad wall positions and forged cards never mutate state',()=>{
 const r=game(),p=r.players[0],oldWalls=r.walls.length;
 assert.throws(()=>act(r,p.id,{type:'wall',wall:{o:'h',r:999,c:0}}),/wall overlaps/i);
 assert.throws(()=>act(r,p.id,{type:'move',to:{r:6,c:4},cardId:'fake'}),/not own/i);
 assert.equal(r.walls.length,oldWalls);assert.equal(r.turn,0);
});

test('cards for removal, stealing and long walls obey turn and ownership',()=>{
 const r=game(),a=r.players[0],b=r.players[1];
 a.hand=[{uid:'long',id:'long_barricade'},{uid:'bomb',id:'demolition'},{uid:'steal',id:'robber'}];
 act(r,a.id,{type:'wall',wall:{o:'h',r:3,c:2},cardId:'long'});
 assert.equal(r.walls[0].len,3);
 act(r,b.id,{type:'move',to:{r:1,c:4}});
 if(r.phase==='draft')for(const x of r.players)if(!x.picked)pickCard(r,x.id,x.options[0]);
 act(r,a.id,{type:'remove',wallId:r.walls[0].id,cardId:'bomb'});
 assert.equal(r.walls.length,0);
 if(r.phase==='draft')for(const x of r.players)if(!x.picked)pickCard(r,x.id,x.options[0]);
 act(r,b.id,{type:'move',to:{r:2,c:4}});
 if(r.phase==='draft')for(const x of r.players)if(!x.picked)pickCard(r,x.id,x.options[0]);
 const oldB=b.walls;act(r,a.id,{type:'target',targetPlayerId:b.id,cardId:'steal'});
 assert.equal(b.walls,oldB-2);
});
test('bots can make legitimate moves under server rules',()=>{
 const r=game(3);const bot=r.players[1];
 // Player 1 must act before player 2 (bot).
 act(r,r.players[0].id,{type:'move',to:{r:7,c:4}});
 const old={...bot.pos};
 botTurn(r,bot);
 assert.notDeepEqual(bot.pos,old);
 assert.equal(r.turn,2);
});
