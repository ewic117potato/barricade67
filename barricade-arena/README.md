# Barricade Arena — Multiplayer Game

A complete multiplayer browser game (not just a mock-up): **1v1, 3 players, 4 players, private lobbies, guest nicknames, bots, wall placement, jumping, 28 power-up cards, card drafting every round, an index, expanding maps, and server-authoritative moves.** No Base44/Lovable credits required.

> This is a custom fan-inspired wall-racing strategy game. It is not affiliated with the operators of barricade.gg.

## Start playing on Windows

1. Install **Node.js LTS** from https://nodejs.org if you haven't already.
2. Unzip this project. Double-click **`start-windows.bat`**.
3. Visit **http://localhost:3000** to create a lobby or join one. The script installs the two required packages the first time (internet needed for install only).
4. Keep the black terminal window running to keep your game online.

Alternative terminal commands from this folder:

```sh
npm install
npm start
```

Run automated checks with `npm test` (no server packages required for core unit tests).

## Play ONLINE with friends in different homes

`localhost` only works **on your own computer**, not your friends' computers. You must **host the Node.js app publicly** to use the invite links over the internet. One straightforward option is Render (or any Node.js host supporting long-lived WebSocket connections):

1. Create a new GitHub repository and upload the contents of this folder (except `node_modules`, which is not included).
2. On https://render.com create a **Web Service** and connect that repository (or use the included `render.yaml` blueprint).
3. Build command: `npm install` — Start command: `npm start`. Use Node.js 20+.
4. Open the web address your host gives you, enter a guest nickname, and create a lobby. Select 2/3/4 players, optionally fill vacant slots with bots, and click **Copy link**.
5. Send the copied **public** link to friends. They use their nicknames to join and the host clicks Start.

Your hosting provider may charge for an always-on service. Free hosting plans (when available) can sleep while idle, disconnect active rooms on restart, or limit usage. The game stores active rooms **in memory**: restarts reset rooms. Run one server process/instance so all players share the same rooms.

### Same home / Wi-Fi

You can optionally open `http://YOUR-LAN-IP:3000` on another computer/phone connected to the same Wi-Fi if your firewall permits inbound port 3000. The host computer must remain running.

## How to play

- **Goal:** each player races from their starting board edge to the opposite edge.
- **Each turn:** move one tile orthogonally, or place a wall (2 tiles long by default). Adjacent opposing pawns can be jumped; if a straight jump is obstructed, a diagonal jump may be allowed.
- **Walls:** can't overlap, cross, or completely block any player from reaching their goal. Click Wall to place; press **R** to rotate.
- **Cards:** everybody drafts one of three cards **simultaneously at the start of each round**. Rare cards appear less often. Click a card on your turn, then choose its move/wall/removal target; supply cards activate instantly without using up a turn. Hand limit: 9 (oldest replaced).
- **Board:** begins 9×9. Expands to 11×11 after completing round 4 and 13×13 after completing round 8.
- **Bots:** if enabled, empty seats are filled with bots when the host starts. A disconnected player's seat is temporarily controlled by a bot until that player reconnects in the same browser.

## Files

- `server.js`: Express + Socket.IO room code server, reconnection, guest token association, bots, session management.
- `game.js`: shared authoritative rules, wall/path validation, movement, cards, drafting, board expansion.
- `public/index.html`, `public/style.css`, `public/app.js`, `public/cards.json`: client UI, interactive board, card index, action picker, animations.
- `test/game.test.js`: unit tests for movement, wall rules, power-ups, rounds, victory, security.
- `start-windows.bat`: quick launcher for Windows.
- `render.yaml`: optional deployment configuration.

## Notes & limitations

- There is **no external account**, matchmaking, persistence, ranked leaderboard, or chat. Rooms are private and in memory.
- Anonymous local guest tokens are stored by the browser, so don't treat them as secure accounts. Invite codes are meant to be shared only with your group.
- A single Node.js server holds all player actions. This resolves the common “host sees the game immediately, but guests lag and desync” issue of client-authoritative games. Actual network delay still depends on your host, and remote players need a reliable connection.
- This project is **not deployed automatically** by the downloadable files. You need to run/host it to give your friends a real link.
