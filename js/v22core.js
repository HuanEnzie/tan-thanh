// ===== v22 core: one shared rule that keeps old saves stable when world generation changes, + small shared helpers =====
// Old saves store looted/removed props of a superblock by INDEX (World.delta). Any generation change in a block that
// already has a delta would shift those indexes. Rule for every v21/v22 world change (buildings, ruins, biomes, cliffs, seas):
//   World.legacy22(sb)  -> true when the block was visited by a pre-v22 save (it has a delta but no v22 record):
//                          generate it exactly the old way (skip every new feature for that block).
//   World._gen          -> the superblock currently being generated (set around World.genOver), or null.
//                          Use it inside per-tile hooks (biomeAt, waterAt, zoneOf...) to know which block asks.
//   World.isLegacyGen() -> World._gen ? World.legacy22(World._gen) : false
// Every non-legacy overworld block generated for real (not the minimap _temp pass) is recorded under World.delta key -22,
// which is saved with the delta, so it stays "new" after reloads.
//   spr22(name, fallback) -> name if IMG has that sprite, else fallback (use it when art may still be missing).
(function () {
  const K22 = -22;
  const rec22 = () => { let d = World.delta.get(K22); if (!d) { d = { looted: new Set(), removed: new Set(), cleared: false }; World.delta.set(K22, d); } return d.looted; };
  World._gen = null;
  World.legacy22 = function (sb) {
    if (!sb || this.mode !== 'over') return false;
    const d = this.delta.get(K22);
    return this.delta.has(sb.key) && !(d && d.looted.has(sb.key));
  };
  World.isLegacyGen = function () { return this._gen ? this.legacy22(this._gen) : false; };
  const go = World.genOver;
  World.genOver = function (sb) {
    const prev = this._gen; this._gen = sb;
    const legacy = this.legacy22(sb);
    try { return go.call(this, sb); }
    finally {
      this._gen = prev;
      if (!legacy && !this._temp && this.mode === 'over') rec22().add(sb.key);
    }
  };
})();
const spr22 = (name, fallback) => (IMG[name] ? name : fallback);
