# BARRICADE // OMEGA — v4.0

A multiplayer browser strategy game with wall placement, six evolving classes, 81 power cards, online public/private rooms, animated effects, bots and a server-authoritative rules engine.

**This is source code, not an automatically deployed website.** It is an independent game, not an official barricade.gg client.

## What's new in V4

- **Public lobby browser:** Make your room public or private. Public waiting rooms appear in a live list, with name, four-character room code, player count, rules and a direct Join button. Private rooms remain accessible via the four-character code or invite link. Only waiting rooms with open human slots are listed.
- **Inspect opponents:** Each player panel now has **View cards & passives**. Everyone can see selected/equipped passive upgrades and unspent consumables; opponents' draft offers, guest tokens and action identifiers are not revealed.
- **81 cards in the index:** 23 new cards, including extremely powerful Legendary/Mythic passives and consumables with actual server-side effects. Examples: Godspeed, Void Emperor, Infinite Mint, Time Fracture, Dimension Flip, Rewind Rival, Kingmaker and Earthshaker. Mythic is rare, not guaranteed.
- **Seven random events:** Supply Rain, Wallquake, Card Comet, Wall Tax, Rift Rush, Gold Rush, and Reckoning. Host selects events every 2, 3, 4, 5 or 6 rounds, or off. Live in-game event popups have their own audiovisual treatment.
- **Four-player CORE victory:** Optional glowing central tile as the winning square in 1v1v1v1; by default victory still requires reaching the opposite edge. Host can enable or disable the middle goal **during a running game**, regardless of turn. The server makes sure the new center target remains reachable by all players if the objective is switched on after building walls. New objective applies from the next player action.
- **Live event switch:** Host can also turn random events on/off after the match starts, without disrupting turn order.
- **Refinements:** New matchmaking panel, collectible card hover/gloss effects, player-inspection UI, center-glow Canvas effects, UI feedback on rule switches, and cinematic event banners with reduced-motion support.
- **Retained from V3:** Six selectable classes with three mastery tiers, short room codes, private invites, selectable 2/3/4 player games, bot-fill, growing map sizes, configurable card drafting and automatic drawing, turn synchronization, and reconnection support.

## Local use

1. Install Node.js 20 or later.
2. Extract the ZIP. Open the **`barricade-arena`** folder.
3. Run `npm install` and then `npm start` in a terminal, or double-click `start-windows.bat` on Windows.
4. Visit `http://localhost:3000`. Only you (and devices with access to your PC's server) can use this address.

To play with friends outside your home, deploy a single running Node.js server somewhere that supports WebSockets, such as Render. This package is intended to replace the existing Node project on that service.

## Update existing GitHub + Render installation

If your code is in `ewic117potato/barricade67` and your Render Root Directory is `barricade-arena`, **keep that repository, service and web address**.

1. Finish active matches and back up your repository on GitHub (**Code → Download ZIP**).
2. Clone the repository with GitHub Desktop (or use your own Git workflow).
3. Extract `barricade-omega-v4.zip` to a separate location. **Copy the contents of the extracted `barricade-arena` folder into the existing `barricade-arena` folder in your cloned repo**. Replace the old files; do not create a second nested `barricade-arena` folder.
4. Commit and push the updated files to `main`.
5. On Render, use the existing service. If GitHub auto-deploy is enabled, deployment should start. Otherwise choose **Manual Deploy → Deploy latest commit**.
6. Once Render reports **Live**, press **Ctrl+Shift+R** on the game website.

Render settings should be: Root Directory `barricade-arena`, Build Command `npm install`, Start Command `npm start`. Set instance type according to your Render plan; free-tier service availability and behavior are determined by Render.

**The source code cannot automatically update your Render deployment from this chat.** You must push the files. All in-memory matches and rooms reset after server restarts or deployments. Guests do not need to install the game; they just open the deployed site.

## Testing status and limits

- **32 automated Node rule tests pass**, including visibility, host permissions, midgame center win, random events, targeting cards and action banking.
- Frontend home/lobby/game screens and player-card inspection were checked using Chromium with **simulated Socket.IO events**; no browser script errors were observed in that mock walkthrough. This is not a live real-user multiplayer test.
- `npm install` could not complete in the isolated build environment due to external package access; the dependencies in `package.json` still need to be installed where you run or deploy it.
- No real Render website was changed or deployed here. Two real browsers on the live host should be used to verify lobby discovery, joining, drafting, turns and reconnection before inviting a large group.
- Rooms, hands and lobby states are held in RAM. They disappear when the service restarts. One instance is supported; multiple instances need shared state and a Socket.IO adapter.
- Public lobbies are publicly discoverable; private lobby codes are short convenience codes, not secure access credentials.
- The UI displays all chosen cards/unused consumables intentionally. Private draft offers remain hidden.

## Source tree

```text
barricade-arena/
├── game.js                server game mechanics and cards
├── server.js              online Socket.IO room server
├── package.json
├── render.yaml
├── start-windows.bat
├── public/
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── cards.json          81 actual game cards
│   └── classes.json
└── test/
    └── game.test.js       32 tests
```
