// ===== v21realm: the three open worlds (md = Tận Thế, tt = Tu Tiên, sl = Thợ Săn Cổng) and their own wording =====
// Other files touched by this package (plan section 12): realms.js REALM_ORDER, v20.js spawnGate notice (now SYS.msg),
// v20dk.js KING_NAME (let, set below) and two [HỆ THỐNG] lines (now R21(SYS_TAG)).

// the gate word per world: "Cổng hạng E" (sl), "Ổ dịch hạng E" (md), "Bí cảnh hạng E" (tt)
// GATE_NAME / gateName() live in v21core.js (v20.js uses them even when this file is not loaded)
// the boss of the demon-king dungeon, per world (v20dk.js spawnKing)
const KING_BY_REALM = { md: 'VUA XÁC SỐNG — MẪU THỂ', tt: 'THIÊN MA CHÍ TÔN', sl: 'QUỶ VƯƠNG BARAN' };

// rewrites the sl gate words ("Cổng hạng", "CỔNG HẠNG", "Cổng mới", "CỔNG ĐÃ BỊ CHINH PHỤC"...) in text shown in md/tt
const gateWords = s => {
  if (typeof s !== 'string' || RL.id === 'sl') return s;
  const g = gateName();
  return s.replace(/Cổng(?= (?:hạng|mới|đã|sẽ|đang|nào|—))/g, g)
    .replace(/CỔNG(?= (?:HẠNG|MỚI|ĐÃ|SẼ|ĐANG|NÀO))/g, g.toUpperCase());
};

(function () {
  // toasts (v20 gate notices, coop) and banners (game.js gate entry / cleared dungeon, coop.js)
  const toast = G.toast;
  G.toast = function (msg, type) { return toast.call(this, gateWords(msg), type); };
  const banner = UI.banner;
  UI.banner = function (title, sub, col) { return banner.call(this, gateWords(title), gateWords(sub), col); };
  // KING_NAME is read by spawnKing only, so setting it right before the spawn keeps it correct whatever world is current
  const spawnKing = G.spawnKing;
  G.spawnKing = function (s) { KING_NAME = KING_BY_REALM[rk(RL.id)]; return spawnKing.call(this, s); };
})();
