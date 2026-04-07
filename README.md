# Kittengame ScriptMod - Automation and QOL Suite
A bookmarklet-based automation and quality-of-life suite for Kittens Game. No extensions or installations required.

## Table of Contents
1. Features
2. Installation 
3. Updating
4. Planned Features
5. Notes

### Features 

#### Speed Ticker
Accelerates the game speed by calling `gamePage.tick()` at a multiplier of your choice. Supports 1x (off, default speed), 30x, and 50x. 

#### AutoCraft
Automatically crafts resources based on configurable conditions:
- **Capped resources** (Wood, Beam, Slab, Steel, Plate) — crafts when the source resource is at or near its storage cap
- **Knowledge chain** (Parchment → Manuscript → Compendium) — crafts when all ingredients clear their defined buffer floors
- **Scaffold** — crafts independently when ingredients are available
- Per-resource toggles and adjustable buffer values for uncapped ingredients

#### AutoTrade (Zebras)
Automates zebra trades with resource awareness:
- Triggers only when gold is at or near storage cap (≥ 99%)
- Respects a configurable gold reserve floor (default 25% of max)
- Computes trade count using both gold budget and the game's native catpower/slab ceiling
- Season-gated — enable or disable trading per season independently

### Installation 
**1.** Create a new bookmark in your browser and paste the following as the URL:
```javascript
javascript:(function(){var s=document.createElement("script");s.src="YOUR_RAW_URL?_="+Date.now();document.head.appendChild(s);})();
```

**2.** Open Kittens Game and click the bookmark. An **Automation** tab will appear in the right panel alongside Log and Queue.

### Updating
Nothing to do. The bookmarklet always loads the latest version automatically every time you click it.

### Planned Features


### Notes
- Tested against Kittens Game running in-browser (kittensgame.com). May require adjustments for the Steam version.
- The bookmarklet is safe to re-click — if the panel is already injected, it simply brings it into focus.
- All automation runs client-side. Nothing is sent externally.
