import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname,join } from 'node:path';
import { randomToken, createRoom,joinHuman,changeSettings,addBotsAndStart,pickCard,act,viewFor,botTurn,validateName } from './game.js';

const app=express(),http=createServer(app),io=new Server(http,{transports:['websocket','polling'],maxHttpBufferSize:20000,pingTimeout:25000});
const root=dirname(fileURLToPath(import.meta.url));
const rooms=new Map(),liveSockets=new Map(),tickers=new Map();
app.disable('x-powered-by');
app.use(express.static(join(root,'public'),{maxAge:'1h'}));
app.get('/health',(req,res)=>res.json({ok:true,rooms:rooms.size,online:io.engine.clientsCount}));
function err(ack,msg){if(typeof ack==='function')ack({ok:false,error:String(msg).slice(0,170)});}
function success(ack,payload={}){if(typeof ack==='function')ack({ok:true,...payload});}
function touch(room){room.version++;room.lastActive=Date.now();}
function broadcast(room){touch(room);for(const player of room.players.filter(x=>!x.bot)){
 const socketId=liveSockets.get(`${room.code}:${player.token}`);if(socketId){const sock=io.sockets.sockets.get(socketId);if(sock)sock.emit('state',viewFor(room,player.token));}
}}
function joinSocket(socket,room,player){
 if(socket.data.code&&socket.data.code!==room.code)leaveSocket(socket,false);
 const k=`${room.code}:${player.token}`,oldId=liveSockets.get(k);
 if(oldId&&oldId!==socket.id){const old=io.sockets.sockets.get(oldId);if(old){old.data.code=null;old.disconnect(true);}}
 liveSockets.set(k,socket.id);socket.data={...socket.data,code:room.code,token:player.token};socket.join(room.code);player.connected=true;
}
function leaveSocket(socket,explicit){
 const {code,token}=socket.data;
 if(!code||!token)return;
 const room=rooms.get(code),k=`${code}:${token}`;
 if(liveSockets.get(k)===socket.id)liveSockets.delete(k);
 socket.leave(code);socket.data.code=null;
 if(!room)return;
 const p=room.players.find(x=>x.token===token&&!x.bot);
 if(!p)return;
 if(explicit&&room.phase==='lobby'){
  room.players=room.players.filter(x=>x.id!==p.id);
  if(room.host===token)room.host=room.players[0]?.token||null;
  if(!room.players.length){rooms.delete(code);return;}
 } else {
  p.connected=liveSockets.has(k);
  if(!p.connected&&room.phase==='draft'&&!p.picked){try{pickCard(room,p.id,p.options[0],true);}catch{}}
 }
 broadcast(room);
}
function withRoom(socket,cb,ack){
 const room=rooms.get(socket.data.code);
 const p=room?.players.find(x=>x.token===socket.data.token&&!x.bot);
 if(!room||!p){err(ack,'You are not in a room.');return;}
 try{cb(room,p);broadcast(room);success(ack);}catch(e){err(ack,e.message||'Unknown error');}
}
io.on('connection',socket=>{
 socket.data={code:null,token:null};
 socket.on('create',(args={},ack)=>{
  try{
   if(rooms.size>=300)throw Error('Server room limit reached.');
   const token=typeof args.token==='string'&&args.token.length>=12&&args.token.length<161?args.token:randomToken();
   const room=createRoom({hostToken:token,hostName:validateName(args.name),mode:args.mode,fillBots:args.fillBots});
   while(rooms.has(room.code))room.code=randomToken().slice(0,6).toUpperCase();
   rooms.set(room.code,room);joinSocket(socket,room,room.players[0]);
   broadcast(room);success(ack,{code:room.code,token});
  }catch(e){err(ack,e.message);}
 });
 socket.on('join',(args={},ack)=>{
  try{
   const code=String(args.code||'').trim().toUpperCase();const room=rooms.get(code);
   if(!room)throw Error('Room not found. Check the room code or server address.');
   const token=typeof args.token==='string'&&args.token.length>=12&&args.token.length<161?args.token:randomToken();
   const p=joinHuman(room,token,args.name);
   joinSocket(socket,room,p);broadcast(room);success(ack,{code:room.code,token});
  }catch(e){err(ack,e.message);}
 });
 socket.on('settings',(args={},ack)=>withRoom(socket,(room,p)=>changeSettings(room,p.token,args.mode,args.fillBots),ack));
 socket.on('start',(_,ack)=>withRoom(socket,(room,p)=>addBotsAndStart(room,p.token),ack));
 socket.on('pick',(args={},ack)=>withRoom(socket,(room,p)=>pickCard(room,p.id,args.cardId),ack));
 socket.on('action',(args={},ack)=>withRoom(socket,(room,p)=>act(room,p.id,args),ack));
 socket.on('leave',(_,ack)=>{leaveSocket(socket,true);success(ack);});
 socket.on('disconnect',()=>leaveSocket(socket,false));
});

// Server-owned clock. Disconnected players temporarily play as bots; their seat is reclaimable.
setInterval(()=>{
 const now=Date.now();
 for(const room of rooms.values()){
  if(now-room.lastActive>12*60*60*1000){rooms.delete(room.code);continue;}
  if(room.phase==='draft'){
   let changed=false;
   for(const p of room.players){if(!p.bot&&!p.connected&&!p.picked){pickCard(room,p.id,p.options[0],true);changed=true;}}
   if(changed)broadcast(room);
   continue;
  }
  if(room.phase!=='play')continue;
  const p=room.players[room.turn];if(!p||(p.connected&&!p.bot))continue;
  const k=`${room.code}:${room.turn}:${room.round}:${room.acted}:${room.bonus}:${room.history.join('|')}`;
  if(tickers.get(room.code)?.key!==k){tickers.set(room.code,{key:k,at:now});continue;}
  const elapsed=now-tickers.get(room.code).at;
  if(elapsed<(p.bot?750:7000))continue;
  try{botTurn(room,p);broadcast(room);}catch(e){console.warn('Bot action:',e.message);}
  tickers.delete(room.code);
 }
},350).unref();
const port=Number(process.env.PORT)||3000;
http.listen(port,'0.0.0.0',()=>console.log(`Barricade Arena at http://localhost:${port}`));
