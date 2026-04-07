// ==================================================
//  KittensGame Automation Suite
//  github.com/JLS-bz/Kittengame-ScriptMod-Automation-QOL-Suite
//  Quality-of-Life improvements for automating common tasks in KittensGame.
// ==================================================
(function() {

    // --------------------------------------------------
    //  CORE — guard, constants, shared utilities
    // --------------------------------------------------
    var Core = (function() {

        function init() {
            if (typeof gamePage === "undefined") {
                alert("KittensGame not loaded!");
                return false;
            }
            return true;
        }

        function getRes(name) {
            return gamePage.resPool.get(name);
        }

        function isAtCap(resName, threshold) {
            var res = getRes(resName);
            if (!res || res.maxValue <= 0) return false;
            return (res.value / res.maxValue) >= (threshold || 0.99);
        }

        return { init, getRes, isAtCap };
    })();


    // --------------------------------------------------
    //  UI — panel, tab link, tab switching, status lines
    // --------------------------------------------------
    var UI = (function() {

        var panel;
        var automationLink;

        function buildTab() {
            var linkParent = document.getElementById("logLink").parentElement;
            automationLink = document.createElement("a");
            automationLink.id        = "automationLink";
            automationLink.href      = "#";
            automationLink.innerText = "Automation";
            linkParent.appendChild(automationLink);

            panel = document.createElement("div");
            panel.id        = "rightTabAutomation";
            panel.className = "right-tab";
            panel.style.cssText = "display:none; padding:5px; font-size:12px;";
            document.getElementById("rightTabQueue").parentElement.appendChild(panel);

            automationLink.onclick = function(e) {
                e.preventDefault();
                showPanel();
            };

            /* Hide panel when switching to other tabs */
            ["logLink", "queueLink"].forEach(function(id) {
                var orig = document.getElementById(id).onclick;
                document.getElementById(id).onclick = function(e) {
                    hidePanel();
                    return orig.call(this, e);
                };
            });
        }

        function showPanel() {
            document.getElementById("rightTabLog").style.display   = "none";
            document.getElementById("rightTabQueue").style.display = "none";
            panel.style.display = "block";
        }

        function hidePanel() {
            panel.style.display = "none";
        }

        function addSection(html) {
            panel.insertAdjacentHTML("beforeend", html);
        }

        function setStatus(id, text) {
            var el = document.getElementById(id);
            if (el) el.textContent = text;
        }

        return { buildTab, addSection, setStatus };
    })();


    // --------------------------------------------------
    //  TICKER — game speed multiplier
    // --------------------------------------------------
    var Ticker = (function() {

        var state = {
            enabled:    false,
            interval:   null,
            multiplier: 1
        };

        var HTML =
            "<div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;'>" +
                "<span style='font-weight:bold; font-size:14px;'>Speed:</span>" +
                "<span style='display:flex; gap:18px;'>" +
                    "<a href='#' class='speed-btn' data-val='1'  style='text-decoration:underline; font-weight:bold; font-size:14px; color:#5d8aa8;'>1x</a>" +
                    "<a href='#' class='speed-btn' data-val='30' style='text-decoration:underline; font-weight:bold; font-size:14px;'>30x</a>" +
                    "<a href='#' class='speed-btn' data-val='50' style='text-decoration:underline; font-weight:bold; font-size:14px;'>50x</a>" +
                "</span>" +
            "</div><hr>";

        function apply() {
            if (state.interval) clearInterval(state.interval);
            state.interval = null;
            if (!state.enabled || state.multiplier <= 1) return;
            state.interval = setInterval(function() { gamePage.tick(); }, Math.round(1000 / state.multiplier));
        }

        function init() {
            UI.addSection(HTML);

            document.getElementById("rightTabAutomation").addEventListener("click", function(e) {
                if (!e.target.classList.contains("speed-btn")) return;
                e.preventDefault();

                var val = parseInt(e.target.getAttribute("data-val"));

                if (state.enabled && state.multiplier === val) {
                    state.enabled = false;
                    clearInterval(state.interval);
                    state.interval = null;
                    document.querySelectorAll(".speed-btn").forEach(function(l) { l.style.color = ""; });
                    return;
                }

                state.multiplier = val;
                state.enabled    = true;
                document.querySelectorAll(".speed-btn").forEach(function(l) { l.style.color = ""; });
                e.target.style.color = "#5d8aa8";
                apply();
            });
        }

        return { init };
    })();


    // --------------------------------------------------
    //  AUTOCRAFT — automated resource crafting
    // --------------------------------------------------
    var AutoCraft = (function() {

        var state = {
            enabled:  false,
            interval: null,
            cappedThreshold: 0.999,
            buffers: {
                beam:       200,
                furs:       5000,
                parchment:  50,
                manuscript: 25
            },
            resources: {
                wood:       true,
                beam:       true,
                slab:       true,
                steel:      true,
                plate:      true,
                scaffold:   true,
                parchment:  true,
                manuscript: true,
                compendium: true
            }
        };

        var HTML =
            "<table style='width:100%'><tr>" +
                "<td><b style='font-size:14px;'>AutoCraft</b></td>" +
                "<td style='width:80px; text-align:right;'><button id='toggleAutoCraft' style='width:70px;'>Start</button></td>" +
            "</tr></table>" +
            "<div style='display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:8px;'>" +
                "<label><input type='checkbox' id='en_wood'       checked> Catnip→Wood</label>" +
                "<label><input type='checkbox' id='en_beam'       checked> Beam</label>" +
                "<label><input type='checkbox' id='en_slab'       checked> Slab</label>" +
                "<label><input type='checkbox' id='en_steel'      checked> Steel</label>" +
                "<label><input type='checkbox' id='en_plate'      checked> Plate</label>" +
                "<label><input type='checkbox' id='en_scaffold'   checked> Scaffold</label>" +
                "<label><input type='checkbox' id='en_parchment'  checked> Parchment</label>" +
                "<label><input type='checkbox' id='en_manuscript' checked> Manuscript</label>" +
                "<label><input type='checkbox' id='en_compendium' checked> Compendium</label>" +
            "</div><hr>" +
            "<b>Craft Buffers</b><br>" +
            "<table style='width:100%; margin-top:4px;'>" +
                "<tr><td>Beam</td>       <td><input id='buf_beam'       type='number' value='200'  style='width:65px;'></td></tr>" +
                "<tr><td>Furs</td>       <td><input id='buf_furs'       type='number' value='5000' style='width:65px;'></td></tr>" +
                "<tr><td>Parchment</td>  <td><input id='buf_parchment'  type='number' value='50'   style='width:65px;'></td></tr>" +
                "<tr><td>Manuscript</td> <td><input id='buf_manuscript' type='number' value='25'   style='width:65px;'></td></tr>" +
            "</table><hr>";

        function syncSettings() {
            state.buffers.beam       = +document.getElementById("buf_beam").value;
            state.buffers.furs       = +document.getElementById("buf_furs").value;
            state.buffers.parchment  = +document.getElementById("buf_parchment").value;
            state.buffers.manuscript = +document.getElementById("buf_manuscript").value;
            state.resources.wood       = document.getElementById("en_wood").checked;
            state.resources.beam       = document.getElementById("en_beam").checked;
            state.resources.slab       = document.getElementById("en_slab").checked;
            state.resources.steel      = document.getElementById("en_steel").checked;
            state.resources.plate      = document.getElementById("en_plate").checked;
            state.resources.scaffold   = document.getElementById("en_scaffold").checked;
            state.resources.parchment  = document.getElementById("en_parchment").checked;
            state.resources.manuscript = document.getElementById("en_manuscript").checked;
            state.resources.compendium = document.getElementById("en_compendium").checked;
        }

        function canCraftSafely(craft) {
            for (var i = 0; i < craft.prices.length; i++) {
                var price = craft.prices[i];
                var res   = Core.getRes(price.name);
                if (!res) return false;
                if (res.maxValue > 0) {
                    if ((res.value / res.maxValue) < state.cappedThreshold) return false;
                } else {
                    if (res.value - price.val < (state.buffers[price.name] || 0)) return false;
                }
            }
            return true;
        }

        function run() {
            syncSettings();

            var cappedCrafts = [
                { resource: "catnip",   craft: "wood"  },
                { resource: "wood",     craft: "beam"  },
                { resource: "minerals", craft: "slab"  },
                { resource: "coal",     craft: "steel" },
                { resource: "iron",     craft: "plate" }
            ];

            cappedCrafts.forEach(function(entry) {
                if (!state.resources[entry.craft]) return;
                var res   = Core.getRes(entry.resource);
                var craft = gamePage.workshop.getCraft(entry.craft);
                if (!res || !craft || !craft.unlocked) return;
                if (Core.isAtCap(entry.resource, state.cappedThreshold)) {
                    gamePage.craft(entry.craft, 1);
                }
            });

            ["parchment", "manuscript", "compendium"].forEach(function(name) {
                if (!state.resources[name]) return;
                var craft = gamePage.workshop.getCraft(name);
                if (!craft || !craft.unlocked) return;
                if (canCraftSafely(craft)) gamePage.craft(name, 1);
            });

            if (state.resources.scaffold) {
                var scaffold = gamePage.workshop.getCraft("scaffold");
                if (scaffold && scaffold.unlocked && canCraftSafely(scaffold)) {
                    gamePage.craft("scaffold", 1);
                }
            }
        }

        function init() {
            UI.addSection(HTML);
            document.getElementById("toggleAutoCraft").onclick = function() {
                state.enabled = !state.enabled;
                if (state.enabled) {
                    state.interval = setInterval(run, 500);
                    this.innerText = "Stop";
                } else {
                    clearInterval(state.interval);
                    this.innerText = "Start";
                }
            };
        }

        return { init };
    })();


    // --------------------------------------------------
    //  AUTOTRADE — automated zebra trading
    // --------------------------------------------------
    var AutoTrade = (function() {

        var SEASON_NAMES = ["spring", "summer", "autumn", "winter"];

        var state = {
            enabled:          false,
            interval:         null,
            goldCapThreshold: 0.99,
            goldReservePct:   0.25,
            goldCostPerTrade: 15,
            seasons: {
                spring: true,
                summer: true,
                autumn: true,
                winter: true
            }
        };

        var HTML =
            "<table style='width:100%'><tr>" +
                "<td><b style='font-size:14px;'>AutoTrade 🦓</b></td>" +
                "<td style='width:80px; text-align:right;'><button id='toggleAutoTrade' style='width:70px;'>Start</button></td>" +
            "</tr></table>" +
            "<div style='display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:8px;'>" +
                "<label><input type='checkbox' id='tr_spring' checked> Spring</label>" +
                "<label><input type='checkbox' id='tr_summer' checked> Summer</label>" +
                "<label><input type='checkbox' id='tr_autumn' checked> Autumn</label>" +
                "<label><input type='checkbox' id='tr_winter' checked> Winter</label>" +
            "</div>" +
            "<div id='tradeStatus' style='margin-top:6px; color:#888; font-size:11px;'>Idle</div><hr>";

        function syncSettings() {
            state.seasons.spring = document.getElementById("tr_spring").checked;
            state.seasons.summer = document.getElementById("tr_summer").checked;
            state.seasons.autumn = document.getElementById("tr_autumn").checked;
            state.seasons.winter = document.getElementById("tr_winter").checked;
        }

        function run() {
            syncSettings();

            var seasonName = SEASON_NAMES[gamePage.calendar.season];

            if (!state.seasons[seasonName]) {
                UI.setStatus("tradeStatus", "Season: " + seasonName + " (skipping)");
                return;
            }

            var zebras = gamePage.diplomacy.get("zebras");
            if (!zebras || !zebras.unlocked) {
                UI.setStatus("tradeStatus", "Zebras not unlocked");
                return;
            }

            var gold = Core.getRes("gold");
            if (!gold || gold.maxValue <= 0) {
                UI.setStatus("tradeStatus", "No gold storage");
                return;
            }

            var goldRatio = gold.value / gold.maxValue;
            if (goldRatio < state.goldCapThreshold) {
                UI.setStatus("tradeStatus", "Gold: " + Math.floor(goldRatio * 100) + "% — waiting for cap");
                return;
            }

            var goldSpendable = gold.value - (gold.maxValue * state.goldReservePct);
            var maxByGold     = Math.floor(goldSpendable / state.goldCostPerTrade);

            if (maxByGold < 1) {
                UI.setStatus("tradeStatus", "Gold capped but spendable amount below reserve floor");
                return;
            }

            var maxByCatpower = gamePage.diplomacy.getMaxTradeAmt(zebras);
            if (maxByCatpower < 1) {
                UI.setStatus("tradeStatus", "Season: " + seasonName + " — catpower/slab too low");
                return;
            }

            var tradesToDo = Math.min(maxByGold, maxByCatpower);
            var goldBefore = gold.value;
            gamePage.diplomacy.tradeMultiple(zebras, tradesToDo);

            UI.setStatus("tradeStatus",
                "Season: " + seasonName +
                " — traded x" + tradesToDo +
                " | Gold spent: " + Math.floor(goldBefore - gold.value) +
                " | Gold left: " + Math.floor(gold.value) +
                " (" + Math.floor((gold.value / gold.maxValue) * 100) + "%)"
            );
        }

        function init() {
            UI.addSection(HTML);
            document.getElementById("toggleAutoTrade").onclick = function() {
                state.enabled = !state.enabled;
                if (state.enabled) {
                    state.interval = setInterval(run, 2000);
                    this.innerText = "Stop";
                    UI.setStatus("tradeStatus", "Running...");
                } else {
                    clearInterval(state.interval);
                    this.innerText = "Start";
                    UI.setStatus("tradeStatus", "Idle");
                }
            };
        }

        return { init };
    })();


    // --------------------------------------------------
    //  BOOT — init order matters
    // --------------------------------------------------
    if (!Core.init()) return;
    if (document.getElementById("automationLink")) {
        document.getElementById("automationLink").click();
        return;
    }

    UI.buildTab();
    Ticker.init();
    AutoCraft.init();
    AutoTrade.init();

})();