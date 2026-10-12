// ===== v22 DM: twelve Demon Generals and the Demon King, each with one mechanic and one counter =====
// Runtime state lives on the Enemy (z.dm, z.dm['s'+i] per mechanic i). Mechanism objects (sprouts, mirrors, pylons,
// urns, eggs, shards, phantoms, totems) are small Enemies with z.mech, so combat, shadows and auto-aim work on them.
// Only G.v10.dm.seen / .hint are saved. Hooks used: Enemy.update/draw, G.hitEnemy, G.killEnemy, G.hurtTarget,
// G.hurtPlayer, G.spawnGeneral, G.spawnKing, G.findInteract, G.interact, G.summonShadow, G.v5Tick, G.dkHtml, drawLighting.
(function () {
  const TAU2 = Math.PI * 2;
  // pw = thế mạnh (shown on first meeting), ct = cách khắc chế (revealed after a death to it or 60 s of fighting)
  const TXT = [
    { pw: 'Gieo Mầm Mộ. Mỗi mầm sống giảm 12% sát thương lên hắn; từ 3 mầm hắn thủ thế và hồi máu.', ct: 'Phá Mầm Mộ (60 máu) để hạ phòng thủ; giữ số mầm sống dưới 3.' },
    { pw: 'Để lại vệt lửa; chiến trường nóng dần và đốt máu bạn theo giây. Miễn nhiễm lửa.', ct: 'Đập Bình Nước quanh chiến trường: vùng ẩm 6 giây dập lửa và an toàn.' },
    { pw: 'Cứ 18 giây mở Ảo cảnh: 3 phân thân và 4 Gương. Hạ phân thân thì hắn hồi máu.', ct: 'Phá 2 Gương để tan ảo cảnh và làm hắn choáng 3 giây. Thân thật có bóng đổ.' },
    { pw: 'Mỗi đòn trúng hồi 300% sát thương cho nàng; vũng máu hồi máu khi nàng đứng trên; đòn của nàng gây Chảy máu.', ct: 'Gây Cháy (lửa, bom xăng) để chặn hồi máu 6 giây; đan dược xoá Chảy máu.' },
    { pw: 'Lướt liên tục, không trúng được khi đang lướt; cứ 3 lượt lướt tung Phong Trảm.', ct: 'Đỡ đúng lúc Phong Trảm: hắn choáng 3 giây và mất bất tử khi lướt.' },
    { pw: 'Giáp giảm 85% sát thương. Hồi sinh 1 lần ở 30% máu nếu Bia Bất Diệt còn đứng.', ct: 'Đỡ Trọng Kích 3 lần hoặc trúng 3 vụ nổ để vỡ giáp 20 giây. Phá Bia trước khi hạ hắn.' },
    { pw: 'Vô hình ở ngoài vùng sáng; đòn của bạn không trúng hắn khi đang ẩn.', ct: 'Bật đèn pin (L), đứng gần đuốc hoặc lửa trại, hoặc đốt đủ 3 Lư hương (E) để hiện hình.' },
    { pw: 'Bóng và đồng đội đứng gần quá 3 giây sẽ bị cướp hồn trong 120 giây.', ct: 'Thu bóng về trước 3 giây; hạ bản cướp hồn để bóng trở về ngay.' },
    { pw: 'Bất tử khi còn 4 Cột U Minh; khi cột đổ hắn dễ tổn thương 12 giây, cột mọc lại tối đa 2 lần; gọi quái liên tục.', ct: 'Phá 4 Cột U Minh trước, rồi đánh khi hắn đang dễ tổn thương.' },
    { pw: 'Đẻ Trứng Cốt mỗi 7 giây; trứng nở thành 2 quái sau 6 giây; quá 6 trứng sẽ nổ độc.', ct: 'Phá Trứng Cốt trước khi nở; không để quá 6 trứng sống.' },
    { pw: 'Mỗi chu kỳ phát sáng đỏ 4 giây: phản 100% sát thương về người đánh; sau đó tung Phá Trận.', ct: 'Ngừng đánh khi hắn phát sáng; đỡ Phá Trận để hắn choáng 2 giây.' },
    { pw: 'Lôi trận: 3 vòng sét không đỡ được mỗi lượt; còn Cột Thu Lôi thì bất tử; đứng dưới nước bị sét gấp đôi.', ct: 'Phá hết Cột Thu Lôi (mỗi cột choáng hắn 2 giây); tránh đứng dưới nước.' },
  ];

  const DMH = [];   // mechanics, index = DEMONS index

  // ---------- helpers ----------
  const dmV = () => { const v = G.v10; if (!v) return null; return v.dm || (v.dm = { seen: {}, hint: {} }); };
  const dmDist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const dmIdxs = z => (z.gen != null ? [z.gen] : z.king && z.dm && z.dm.kmods ? z.dm.kmods : []);
  const dmSt = (z, i) => z.dm['s' + i];
  const dmList = (z, i, kind) => (z.dm && z.dm.mechs ? z.dm.mechs : []).filter(m => !m.dead && m.dmIdx === i && (!kind || m.mech === kind));
  const dmKill = m => { if (!m.dead) { m.dead = true; m.dying = 0; } };
  const dmFloat = (x, y, t, col) => Floaters.add(x, y, t, col || '#ffd0ff', 13, true);
  const dmRng = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const dmInWater = () => { try { return typeof waterAtPx === 'function' && !!WATER_T(waterAtPx(G.player.x, G.player.y)); } catch (e) { return false; } };
  // a walkable spot at radius [rMin,rMax] around z (at angle a0 +- 0.2 when given)
  function dmSpot(z, rMin, rMax, a0) {
    let x = z.x, y = z.y;
    for (let k = 0; k < 12; k++) {
      const a = a0 != null ? a0 + (Math.random() - 0.5) * 0.4 : Math.random() * TAU2, r = rMin + Math.random() * (rMax - rMin);
      x = z.x + Math.cos(a) * r; y = z.y + Math.sin(a) * r;
      if (World.walkable(Math.floor(x / TILE), Math.floor(y / TILE))) break;
    }
    return [x, y];
  }
  // a mechanism object: a small Enemy that belongs to general z (owner), mechanic i
  function dmMake(z, i, kind, x, y, o) {
    const m = G.spawnEnemy('walker', x, y, { state: o.chase ? 'chase' : 'wander', lvl: z.lvl || 1 });
    m.img = spr22(o.img, o.fb); m.name = o.name || kind; m.r = o.r || 14; m.scale = o.scale || 1;
    m.maxHp = m.hp = o.hp; m.xp = 0; m.dmg = o.dmg || 0; m.spd = o.spd || 0;
    m.mech = kind; m.dmIdx = i; m.dmOwner = z; m.dmFrozen = !o.chase;
    z.dm.mechs.push(m);
    return m;
  }
  function dmOn(z, i) { z.dm['s' + i] = {}; DMH[i].init(z, i); }
  function dmOff(z, i) {
    const M = DMH[i];
    if (M.off) M.off(z, i);
    for (const m of z.dm.mechs) if (m.dmIdx === i) dmKill(m);
    z.dm['s' + i] = null;
  }
  // everything a general owns (mechanism objects, braziers) goes away with it
  function dmCleanup(z) {
    if (!z.dm) return;
    for (const m of z.dm.mechs) dmKill(m);
    z.dm.mechs.length = 0;
    for (const p of World.propsNear(z.x, z.y, 420)) if (p.kind === 'dmbrazier' && p.data && p.data.own === z.id) World.removeProp(p);
  }
  // a Tướng strikes through the normal hurt path; parryable strikes set _strikeNow (read by v22parry)
  function dmStrike(z, i, mul, range, label, parryable) {
    const st = dmSt(z, i), P = G.player;
    if (!P || P.dead) return;
    if (dmDist(z, P) < range) {
      st.striking = true; z._strikeNow = !!parryable;
      try { G.hurtTarget(P, z.dmg * mul, z); } finally { st.striking = false; z._strikeNow = false; }
      G.shake(8); FX.ring(z.x, z.y, 14, range, '#ffb070', 0.5, 8);
    } else dmFloat(z.x, z.y - z.r - 24, label + ' HỤT', '#aaaaaa');
  }
  function dmHint(i) {
    const v = dmV(); if (!v || v.hint[i]) return;
    v.hint[i] = 1; SYS.msg(`Khắc chế ${DEMONS[i].n}: ${TXT[i].ct}`, 'quest');
  }
  function dmRelease(id) { const s = (G.v10 && G.v10.shadows || []).find(q => q.id === id); if (s) s.seized = 0; }
  function dmVisCalc(z, lit) {
    if (lit >= 3) return true;
    const P = G.player;
    if (P.flash) {
      const a = Math.atan2(z.y - P.y, z.x - P.x);
      if (Math.abs(Math.atan2(Math.sin(a - P.angle), Math.cos(a - P.angle))) < 0.5 && dmDist(z, P) < 370) return true;
    }
    for (const l of World.lights) if (!l.dead && dmDist(l, z) < 110) return true;
    return false;
  }
  function dmDamageToPlayerAt(x, y, dmg) { G.hurtPlayer(dmg, { x, y, arche: 'brute' }); }

  // shared on-hit reaction of the mechanism objects (their own death is handled by owner.mdie)
  function dmPylons(z, i) {
    const out = [];
    for (let k = 0; k < 4; k++) { const [x, y] = dmSpot(z, 260, 280, Math.PI / 4 + k * Math.PI / 2); out.push(dmMake(z, i, 'pylon', x, y, { img: 'mp22_pylon', fb: 'fx_0', hp: 400, r: 16 })); }
    return out;
  }
  function dmIllStart(z, i) {
    const st = dmSt(z, i); st.ill = { t: 40, broke: 0 };
    for (let k = 0; k < 4; k++) { const [x, y] = dmSpot(z, 200, 215, Math.PI / 4 + k * Math.PI / 2); dmMake(z, i, 'mirror', x, y, { img: 'mp22_mirror', fb: 'fx_1', hp: 80, r: 16 }); }
    for (let k = 0; k < 3; k++) {
      const [x, y] = dmSpot(z, 80, 120);
      const p = dmMake(z, i, 'phantom', x, y, { img: z.img, fb: z.img, hp: 1, dmg: z.dmg * 0.6, spd: 70, chase: true, r: z.r, scale: z.scale });
      p.name = z.name;
    }
    dmFloat(z.x, z.y - z.r - 30, 'ẢO CẢNH', '#c79bff'); G.shake(5);
  }
  function dmIllEnd(z, i, broke) {
    const st = dmSt(z, i); if (!st || !st.ill) return;
    st.ill = null;
    for (const m of z.dm.mechs) if (m.dmIdx === i && (m.mech === 'phantom' || m.mech === 'mirror')) dmKill(m);
    FX.ring(z.x, z.y, 20, 240, '#c79bff', 0.7, 12);
    dmFloat(z.x, z.y - z.r - 30, broke ? 'ẢO CẢNH TAN! CHOÁNG 3s' : 'ẢO CẢNH TAN', '#ffd0ff');
    if (broke) z.stun = 3;
  }
  function dmArmorBreak(z, i) {
    const st = dmSt(z, i); st.armorOff = 20; st.expl = 0; st.pry = 0;
    FX.ring(z.x, z.y, 14, 160, '#ffd24a', 0.7, 9); dmFloat(z.x, z.y - z.r - 30, 'VỠ GIÁP! 20s', '#ffd24a');
  }
  function dmSeize(z, a) {
    a.dmNear = 0;
    if (a.kind === 'shadow') {
      const s = (G.v10.shadows || []).find(q => q.id === a.sid); if (!s) return;
      G.recallShadow(s); s.seized = G.time + 120;
      const p = G.spawnEnemy('walker', a.x, a.y, { state: 'chase', lvl: z.lvl || 1 });
      p.img = a.img || p.img; p.name = s.name; p.r = a.r || p.r; p.maxHp = p.hp = Math.max(40, a.maxHp); p.dmg = a.dmg; p.xp = 0;
      p.seizeOf = s.id; p.seizeUntil = G.time + 120;
      dmFloat(a.x, a.y - 30, 'CƯỚP HỒN!', '#c75bff');
      G.toast(`${s.name} bị Thực Hồn cướp hồn: 120 giây sau bóng mới trở về.`, 'warn');
    } else if (a.kind === 'comp' && !a.downed) {
      a.hp = 0; a.downed = true; a.dmSeized = G.time + 120;
      G.toast(`${a.comp.name} bị cướp hồn và gục tạm 120 giây.`, 'warn');
    }
  }
  function dmLight(p) {
    p.data.lit = 1; p.light = 150; p.lightCol = 'fire';
    if (!World.lights.includes(p)) World.lights.push(p);
    Particles.burst(p.x, p.y - 10, 16, '#ff9a4a', 120); FX.pillar(p.x, p.y, '#ff9a4a', 0.8, 30);
    const n = World.propsNear(p.x, p.y, 300).filter(q => q.kind === 'dmbrazier' && q.data && q.data.own === p.data.own && q.data.lit).length;
    G.toast(`Lư hương đã cháy (${n}/3).` + (n >= 3 ? ' Nguyệt Linh hiện hình!' : ''), 'quest');
  }

  // ---------- the twelve mechanics ----------
  // Each: init(z,i) · tick(z,i,dt) · hit(z,i,dmg,src) -> number multiplier | 'skip' · mdie(z,i,m) when a mechanism object dies
  // · lethal(z,i) -> true when the blow is absorbed · parry(z,i,ok) · off(z,i) when the mechanic is switched off.

  // 0 Mộ Phệ: Mầm Mộ (sprouts). Each live sprout -12% damage taken; 3+ sprouts = stands still, shield, heals.
  DMH[0] = {
    init(z, i) { const st = dmSt(z, i); st.t = 10; st.guard = false; st.base = z.spd; },
    tick(z, i, dt) {
      const st = dmSt(z, i);
      if ((st.t -= dt) <= 0) {
        st.t = 10;
        if (dmList(z, i, 'sprout').length < 9) { const [x, y] = dmSpot(z, 150, 300); dmMake(z, i, 'sprout', x, y, { img: 'mp22_sprout', fb: 'fx_5', hp: 60, r: 16 }); dmFloat(x, y - 20, 'MẦM MỘ', '#c79bff'); }
      }
      const g = dmList(z, i, 'sprout').length >= 3;
      if (g !== st.guard) {
        st.guard = g;
        if (g) { st.base = z.spd; z.spd = 0; dmFloat(z.x, z.y - z.r - 22, 'THỦ THẾ!', '#c79bff'); } else z.spd = st.base;
      }
      if (g && z.hp > 0) z.hp = Math.min(z.maxHp, z.hp + z.maxHp * 0.025 * dt);
    },
    hit(z, i) { return 1 - Math.min(0.9, 0.12 * dmList(z, i, 'sprout').length); },
    off(z, i) { const st = dmSt(z, i); if (st && st.guard) z.spd = st.base; },
  };

  // 1 Xích Viêm: fire trail behind it, heat in the arena (1 HP/s after 20 s), wet zones from smashed urns; immune to fire.
  DMH[1] = {
    init(z, i) {
      const st = dmSt(z, i); st.trail = 0; st.lx = z.x; st.ly = z.y; st.wet = []; st.heatDmg = 0;
      for (let k = 0; k < 4; k++) { const [x, y] = dmSpot(z, 230, 250, Math.PI / 4 + k * Math.PI / 2); dmMake(z, i, 'urn', x, y, { img: 'mp22_urn', fb: RL.props.fire || 'firebarrel', hp: 30, r: 14 }); }
    },
    tick(z, i, dt) {
      const st = dmSt(z, i), P = G.player;
      st.wet = st.wet.filter(w => (w.t -= dt) > 0);
      const moved = Math.hypot(z.x - st.lx, z.y - st.ly); st.lx = z.x; st.ly = z.y;
      if ((st.trail -= dt) <= 0 && moved > 0.5 && z.hp > 0) { st.trail = 0.4; Throws.fires.push({ x: z.x, y: z.y, r: 26, life: 3, max: 3, hostile: true }); }
      if (st.wet.length) for (let k = Throws.fires.length - 1; k >= 0; k--) { const f = Throws.fires[k]; if (f.hostile && st.wet.some(w => dmDist(f, w) < w.r)) Throws.fires.splice(k, 1); }
      const dry = !st.wet.some(w => dmDist(P, w) < w.r);
      if (z.dm.fightT > 20 && !P.dead && dmDist(P, z) < 420 && dry) { G.hurtPlayer(dt, null, true); st.heatDmg += dt; }
      z.burn = 0;
    },
    hit(z, i, dmg, src) {
      if (src !== 'fire') return 1;
      const st = dmSt(z, i); if (!(st.ft > G.time)) { st.ft = G.time + 1; dmFloat(z.x, z.y - z.r - 22, 'MIỄN NHIỄM LỬA', '#ffa060'); }
      return 'skip';
    },
    mdie(z, i, m) {
      const st = dmSt(z, i); if (!st || m.mech !== 'urn') return;
      st.wet.push({ x: m.x, y: m.y, r: 110, t: 6 });
      FX.ring(m.x, m.y, 10, 130, '#7fd8ff', 0.7, 10); dmFloat(m.x, m.y - 20, 'VÙNG ẨM 6s', '#7fd8ff');
    },
  };

  // 2 Hư Vô: every 18 s an illusion (3 phantoms, 4 mirrors). Phantom killed -> +3% for him; 2 mirrors -> illusion breaks, stun 3 s.
  DMH[2] = {
    init(z, i) { const st = dmSt(z, i); st.cd = 18; st.ill = null; },
    tick(z, i, dt) {
      const st = dmSt(z, i);
      if (st.ill) { if ((st.ill.t -= dt) <= 0) dmIllEnd(z, i, false); }
      else if ((st.cd -= dt) <= 0) { st.cd = 18; dmIllStart(z, i); }
    },
    mdie(z, i, m) {
      const st = dmSt(z, i); if (!st) return;
      if (m.mech === 'phantom') { z.hp = Math.min(z.maxHp, z.hp + z.maxHp * 0.03); dmFloat(z.x, z.y - z.r - 22, '+3% MÁU', '#c79bff'); }
      else if (m.mech === 'mirror' && st.ill && ++st.ill.broke >= 2) dmIllEnd(z, i, true);
    },
    off(z, i) { dmIllEnd(z, i, false); },
  };

  // 3 Huyết Mẫu: each hit she lands heals 300% of the damage; blood pools heal her; Cháy (fire) blocks healing; Chảy máu on you.
  DMH[3] = {
    init(z, i) { const st = dmSt(z, i); st.pt = 5; st.pools = []; st.burnT = 0; },
    tick(z, i, dt) {
      const st = dmSt(z, i);
      if ((st.pt -= dt) <= 0) { st.pt = 5; st.pools.push({ x: z.x, y: z.y, r: 70, t: 12 }); if (st.pools.length > 4) st.pools.shift(); }
      st.pools = st.pools.filter(p => (p.t -= dt) > 0);
      if (st.burnT > 0) st.burnT -= dt;
      else if (z.hp > 0 && st.pools.some(p => dmDist(z, p) < p.r)) z.hp = Math.min(z.maxHp, z.hp + z.maxHp * 0.02 * dt);
    },
    hit(z, i, dmg, src) { if (src === 'fire') dmSt(z, i).burnT = 6; return 1; },
  };

  // 4 Tật Phong: dashes every 1.2 s (untouchable while dashing); every 3rd dash ends in Phong Trảm (windup 0.6 s, parryable).
  DMH[4] = {
    init(z, i) { Object.assign(dmSt(z, i), { cd: 1.2, dash: 0, n: 0, slash: null, striking: false, base: z.spd }); },
    tick(z, i, dt) {
      const st = dmSt(z, i);
      if (st.slash) {
        z.spd = 0;
        if ((st.slash.t -= dt) <= 0) { st.slash = null; dmStrike(z, i, 1.8, 170, 'PHONG TRẢM', true); z.spd = st.base; }
        return;
      }
      if (st.dash > 0) {
        st.dash -= dt; z.spd = st.base * 4;
        if (st.dash <= 0) {
          st.n++; z.spd = st.base; st.cd = 1.2;
          if (st.n % 3 === 0) { st.slash = { t: 0.6 }; dmFloat(z.x, z.y - z.r - 26, 'PHONG TRẢM!', '#7dffd8'); }
        }
        return;
      }
      z.spd = st.base;
      if ((st.cd -= dt) <= 0) { st.dash = 0.45; dmFloat(z.x, z.y - z.r - 26, 'LƯỚT', '#7dffd8'); }
    },
    hit(z, i) { return dmSt(z, i).dash > 0 ? 'skip' : 1; },
    parry(z, i, ok) {
      const st = dmSt(z, i); if (!ok || !(st.slash || st.striking)) return;
      st.slash = null; st.dash = 0; z.stun = 3; z.spd = st.base;
      dmFloat(z.x, z.y - z.r - 26, 'ĐỠ! CHOÁNG 3s', '#ffd24a');
    },
  };

  // 5 Bất Diệt: armor (-85%) breaks after 3 parried Trọng Kích or 3 explosions; revives once at 30% while Bia Bất Diệt stands.
  DMH[5] = {
    init(z, i) {
      Object.assign(dmSt(z, i), { armorOff: 0, expl: 0, pry: 0, hcd: 8, heavy: null, striking: false, base: z.spd, revived: false, totemDown: false });
      const [x, y] = dmSpot(z, 180, 200);
      dmSt(z, i).totem = dmMake(z, i, 'totem', x, y, { img: 'mp22_totem', fb: 'ev_altar', hp: 300, r: 18 });
    },
    tick(z, i, dt) {
      const st = dmSt(z, i);
      if (st.armorOff > 0 && (st.armorOff -= dt) <= 0) { st.armorOff = 0; st.expl = 0; st.pry = 0; dmFloat(z.x, z.y - z.r - 26, 'GIÁP HỒI LẠI', '#b0b8c8'); }
      if (st.heavy) {
        z.spd = 0;
        if ((st.heavy.t -= dt) <= 0) { st.heavy = null; dmStrike(z, i, 1.8, 150, 'TRỌNG KÍCH', true); z.spd = st.base; }
        return;
      }
      if ((st.hcd -= dt) <= 0) { st.hcd = 8; st.heavy = { t: 0.7 }; dmFloat(z.x, z.y - z.r - 26, 'TRỌNG KÍCH!', '#ffd0a0'); }
    },
    hit(z, i, dmg, src) {
      const st = dmSt(z, i);
      if (src === 'explosion' && st.armorOff <= 0 && ++st.expl >= 3) dmArmorBreak(z, i);
      return st.armorOff > 0 ? 1 : 0.15;
    },
    parry(z, i, ok) { const st = dmSt(z, i); if (ok && st.striking && st.armorOff <= 0 && ++st.pry >= 3) dmArmorBreak(z, i); },
    mdie(z, i, m) { const st = dmSt(z, i); if (st && m.mech === 'totem') st.totemDown = true; },
    lethal(z, i) {
      const st = dmSt(z, i);
      if (!st || st.revived || st.totemDown || !st.totem || st.totem.dead) return false;
      st.revived = true; z.hp = z.maxHp * 0.3;
      FX.ring(z.x, z.y, 20, 260, '#b0b8c8', 0.8, 12); dmFloat(z.x, z.y - z.r - 30, 'BIA BẤT DIỆT: HỒI SINH!', '#ffffff');
      return true;
    },
  };

  // 6 Nguyệt Linh: invisible unless lit (flashlight cone, within 110 px of a light, or 3 braziers lit with E). Its own shots miss it while hidden.
  DMH[6] = {
    init(z, i) {
      const st = dmSt(z, i); st.vis = false; st.lit = 0;
      for (let k = 0; k < 3; k++) {
        const a = Math.PI / 2 + k * TAU2 / 3;
        World.addProp(spr22('mp22_brazier', 'fx_4'), z.x + Math.cos(a) * 170, z.y + Math.sin(a) * 170,
          { solid: false, layer: 0, kind: 'dmbrazier', light: 0, data: { own: z.id, lit: 0 } });
      }
    },
    tick(z, i) {
      const st = dmSt(z, i);
      st.lit = World.propsNear(z.x, z.y, 260).filter(p => p.kind === 'dmbrazier' && !p.dead && p.data && p.data.own === z.id && p.data.lit).length;
      st.vis = dmVisCalc(z, st.lit);
    },
    hit(z, i, dmg, src) {
      const st = dmSt(z, i);
      if (st.vis || !['gun', 'melee', 'skill', 'explosion', 'shock', 'car', 'trap'].includes(src)) return 1;
      if (!(st.ft > G.time)) { st.ft = G.time + 1.5; dmFloat(z.x, z.y - z.r - 22, 'ẨN!', '#6bb6ff'); }
      return 'skip';
    },
    off(z) { for (const p of World.propsNear(z.x, z.y, 420)) if (p.kind === 'dmbrazier' && p.data && p.data.own === z.id) World.removeProp(p); },
  };

  // 7 Thực Hồn: a shadow or companion that stays within 160 px for 3 s is seized (puppet enemy, 120 s); the shadow cannot be summoned meanwhile.
  DMH[7] = {
    init() {},
    tick(z, i, dt) {
      for (const a of G.allies) {
        if (a.dead || a.downed || a.recalled || (a.kind !== 'shadow' && a.kind !== 'comp')) continue;
        if (dmDist(a, z) < 160) { a.dmNear = (a.dmNear || 0) + dt; if (a.dmNear >= 3) dmSeize(z, a); }
        else a.dmNear = 0;
      }
    },
  };

  // 8 U Minh: immortal while 4 pylons stand; when they fall it takes +50% for 12 s, pylons regrow (twice at most); calls 2 minions every 15 s.
  DMH[8] = {
    init(z, i) { const st = dmSt(z, i); st.state = 'up'; st.vt = 0; st.regrow = 0; st.sum = 15; st.pylons = dmPylons(z, i); },
    tick(z, i, dt) {
      const st = dmSt(z, i);
      if ((st.sum -= dt) <= 0) {
        st.sum = 15;
        for (let k = 0; k < 2; k++) { const a = Math.random() * TAU2; G.spawnEnemy(Math.random() < 0.5 ? 'walker' : 'runner', z.x + Math.cos(a) * 90, z.y + Math.sin(a) * 90, { state: 'chase', rise: true, lvl: z.lvl || 1 }); }
        dmFloat(z.x, z.y - z.r - 30, 'U MINH TRIỆU HỒI', '#7a6bff');
      }
      if (st.state === 'up' && st.pylons.every(p => p.dead)) { st.state = 'vuln'; st.vt = 12; dmFloat(z.x, z.y - z.r - 30, 'CỘT ĐỔ! DỄ TỔN THƯƠNG 12s', '#ffd24a'); }
      else if (st.state === 'vuln' && (st.vt -= dt) <= 0) {
        if (st.regrow < 2) { st.regrow++; st.pylons = dmPylons(z, i); st.state = 'up'; dmFloat(z.x, z.y - z.r - 30, 'CỘT MỌC LẠI', '#7a6bff'); }
        else st.state = 'none';
      }
    },
    hit(z, i) {
      const st = dmSt(z, i);
      if (st.state === 'up') { if (!(st.ft > G.time)) { st.ft = G.time + 1; dmFloat(z.x, z.y - z.r - 22, 'BẤT TỬ', '#7a6bff'); } return 'skip'; }
      return st.state === 'vuln' ? 1.5 : 1;
    },
  };

  // 9 Cốt Mẫu: an egg every 7 s, hatches into 2 minions after 6 s; a 7th egg bursts into poison.
  DMH[9] = {
    init(z, i) { dmSt(z, i).et = 7; },
    tick(z, i, dt) {
      const st = dmSt(z, i), P = G.player;
      if ((st.et -= dt) <= 0) {
        st.et = 7;
        const eggs = dmList(z, i, 'egg');
        if (eggs.length >= 6) {
          for (const e of eggs) dmKill(e);
          if (!P.dead && dmDist(P, z) < 320) dmDamageToPlayerAt(z.x, z.y, 25);
          FX.ring(z.x, z.y, 20, 300, '#6dff7a', 0.7, 12); G.shake(7); dmFloat(z.x, z.y - z.r - 26, 'NỔ ĐỘC!', '#6dff7a');
        } else {
          const [x, y] = dmSpot(z, 170, 230);
          dmMake(z, i, 'egg', x, y, { img: 'mp22_egg', fb: 'fx_5', hp: 40, r: 14 }).hatchT = 6;
        }
      }
      for (const e of dmList(z, i, 'egg')) {
        if ((e.hatchT -= dt) > 0) continue;
        dmKill(e);
        for (let k = 0; k < 2; k++) G.spawnEnemy(Math.random() < 0.5 ? 'walker' : 'runner', e.x + (k ? 14 : -14), e.y, { state: 'chase', rise: true, lvl: z.lvl || 1 });
        dmFloat(e.x, e.y - 20, 'NỞ!', '#6dff7a');
      }
    },
  };

  // 10 Phá Quân: 4 s of red armor that reflects 100% damage to the attacker (you or a shadow); when it ends, Phá Trận (windup 0.8 s, parryable).
  DMH[10] = {
    init(z, i) { Object.assign(dmSt(z, i), { on: true, t: 4, slam: null, striking: false, base: z.spd }); },
    tick(z, i, dt) {
      const st = dmSt(z, i);
      if (st.slam) {
        z.spd = 0;
        if ((st.slam.t -= dt) <= 0) { st.slam = null; dmStrike(z, i, 1.4, 150, 'PHÁ TRẬN', true); z.spd = st.base; }
        return;
      }
      if ((st.t -= dt) > 0) return;
      if (st.on) { st.on = false; st.t = 6; st.slam = { t: 0.8 }; dmFloat(z.x, z.y - z.r - 26, 'PHÁ TRẬN!', '#ffa31a'); }
      else { st.on = true; st.t = 4; dmFloat(z.x, z.y - z.r - 26, 'PHẢN GIÁP!', '#ff5a2a'); }
    },
    hit(z, i, dmg, src) {
      const st = dmSt(z, i);
      if (!st.on) return 1;
      if (src !== 'fire' && src !== 'poison') {
        if (src === 'ally') { const a = G.allies.find(q => !q.dead && !q.downed && (q.kind === 'shadow' || q.kind === 'comp') && dmDist(q, z) < 320); if (a) a.hurt(dmg); }
        else G.hurtPlayer(dmg, { x: z.x, y: z.y, arche: 'brute' });
        dmFloat(z.x, z.y - z.r - 20, 'PHẢN ' + Math.round(dmg), '#ff5a2a');
      }
      return 'skip';
    },
    parry(z, i, ok) { const st = dmSt(z, i); if (ok && st.striking) { z.stun = 2; dmFloat(z.x, z.y - z.r - 26, 'CHOÁNG 2s', '#ffa31a'); } },
  };

  // 11 Thiên Hạ: thunder rings on you (3 per 9 s, never parryable); shards make him immortal; a broken shard stuns 2 s; water doubles the thunder.
  DMH[11] = {
    init(z, i) {
      const st = dmSt(z, i); st.cd = 9; st.th = [];
      for (let k = 0; k < 4; k++) { const [x, y] = dmSpot(z, 230, 250, k * TAU2 / 4 + 0.4); dmMake(z, i, 'shard', x, y, { img: 'mp22_shard', fb: 'fx_1', hp: 300, r: 16 }); }
    },
    tick(z, i, dt) {
      const st = dmSt(z, i), P = G.player;
      if ((st.cd -= dt) <= 0) {
        st.cd = 9;
        for (let k = 0; k < 3; k++) { const a = Math.random() * TAU2, r = Math.random() * 120; st.th.push({ x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, r: 62, t: 1.6 + k * 0.35, dmg: z.dmg * 1.2, noParry: true }); }
        dmFloat(z.x, z.y - z.r - 30, 'LÔI TRẬN!', '#fff36b');
      }
      for (const th of st.th) {
        if (th.t > 0 && (th.t -= dt) <= 0 && !th.done) {
          th.done = true;
          if (!P.dead && dmDist(P, th) < th.r + 6) G.hurtPlayer(th.dmg * (dmInWater() ? 2 : 1), { x: th.x, y: th.y, arche: 'brute', noParry: true });
          FX.ring(th.x, th.y, 10, th.r, '#fff36b', 0.8, 9); G.shake(4);
        }
      }
      st.th = st.th.filter(th => th.t > -0.25);
    },
    hit(z, i) { return dmList(z, i, 'shard').length ? 'skip' : 1; },
    mdie(z, i, m) { if (m.mech === 'shard') { z.stun = 2; FX.ring(m.x, m.y, 10, 120, '#fff36b', 0.8, 10); dmFloat(z.x, z.y - z.r - 26, 'CỘT VỠ: CHOÁNG 2s', '#fff36b'); } },
  };

  // ---------- per-frame: general mechanics, the King's phases ----------
  function dmKingPhase(z, ph) {
    const d = z.dm; d.kph = ph;
    for (const i of d.kmods) dmOff(z, i);
    const r = dmRng((d.kseed || 1) + ph * 7919), a = Math.floor(r() * 12);
    let b = a; while (b === a) b = Math.floor(r() * 12);
    d.kmods = [a, b];
    for (const i of d.kmods) dmOn(z, i);
    if (ph === 2 && !d.enr) { d.enr = 1; z.spd *= 1.25; }
    dmFloat(z.x, z.y - z.r - 34, 'QUỶ VƯƠNG: GIAI ĐOẠN ' + (ph + 1), '#ff6060');
    G.toast(`Quỷ Vương giai đoạn ${ph + 1}: ${DEMONS[a].n} và ${DEMONS[b].n} — cơ chế của họ đã bật.`, 'warn');
  }
  function dmTick(z, dt) {
    const d = z.dm; d.fightT += dt;
    if (z.gen != null && d.fightT >= 60 && !d.hintDone) { d.hintDone = 1; dmHint(z.gen); }
    if (z.king) { const f = z.hp / z.maxHp, ph = f > 0.7 ? 0 : f > 0.4 ? 1 : 2; if (ph !== d.kph) dmKingPhase(z, ph); }
    for (const i of dmIdxs(z)) if (DMH[i].tick) DMH[i].tick(z, i, dt);
  }

  // ---------- wrappers ----------
  const eu = Enemy.prototype.update;
  Enemy.prototype.update = function (dt) {
    if (!this.dead) {
      if (this.dmFrozen) this.stun = Math.max(this.stun || 0, 0.05);
      else if ((this.gen != null || this.king) && this.dm) dmTick(this, dt);
    }
    return eu.call(this, dt);
  };

  const ed = Enemy.prototype.draw;
  Enemy.prototype.draw = function (ctx) {
    if (this.mech === 'phantom' && !this.dead) {
      const im = IMG[this.img]; if (!im) return;
      const w = im.width / 2 * this.scale, h = im.height / 2 * this.scale;
      ctx.save(); ctx.globalAlpha = 0.5; ctx.drawImage(im, this.x - w / 2, this.y - h / 2, w, h); ctx.restore();   // no shadow: a phantom
      return;
    }
    if ((this.gen != null || this.king) && this.dm && !this.dead) {
      const st6 = this.dm.s6, vis = !st6 || st6.lit >= 3 || st6.vis !== false;
      if (vis) ed.call(this, ctx);
      dmOverlay(this, ctx, vis);
      return;
    }
    ed.call(this, ctx);
  };
  function dmOverlay(z, ctx, vis) {
    const d = z.dm, t = G.time;
    ctx.save();
    for (const i of dmIdxs(z)) {
      const st = d['s' + i]; if (!st) continue;
      if (i === 3) for (const p of st.pools) { ctx.globalAlpha = 0.35 * Math.min(1, p.t / 2); ctx.fillStyle = '#8a0f1f'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU2); ctx.fill(); }
      if (i === 11) for (const th of st.th) { if (th.t < 0) continue; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 14); ctx.strokeStyle = '#fff36b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(th.x, th.y, th.r, 0, TAU2); ctx.stroke(); }
      if (!vis) continue;
      if ((i === 0 && st.guard) || (i === 10 && st.on)) {
        ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 6); ctx.strokeStyle = i === 0 ? '#c79bff' : '#ff4a2a'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 14, 0, TAU2); ctx.stroke();
      }
      if ((i === 4 && st.slash) || (i === 5 && st.heavy) || (i === 10 && st.slam)) {
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 30); ctx.fillStyle = '#ffe14a'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('!', z.x, z.y - z.r - 18);
      }
    }
    ctx.restore();
  }

  const hit0 = G.hitEnemy;
  G.hitEnemy = function (z, dmg, kx, ky, src, ang, wp) {
    if (z.dead || !z.dm || (z.gen == null && !z.king)) return hit0.call(this, z, dmg, kx, ky, src, ang, wp);
    for (const i of dmIdxs(z)) {
      const M = DMH[i]; if (!M || !M.hit) continue;
      const r = M.hit(z, i, dmg, src);
      if (r === 'skip') return false;
      if (typeof r === 'number') dmg *= r;
    }
    return hit0.call(this, z, dmg, kx, ky, src, ang, wp);
  };

  const ke = G.killEnemy;
  G.killEnemy = function (z, src) {
    if (!z.dead && z.dm && (z.gen != null || z.king)) {
      for (const i of dmIdxs(z)) { const M = DMH[i]; if (M && M.lethal && M.lethal(z, i)) return; }
    }
    if (z.mech && z.dmOwner) { const M = DMH[z.dmIdx]; if (M && M.mdie) M.mdie(z.dmOwner, z.dmIdx, z); }
    if (z.seizeOf != null) dmRelease(z.seizeOf);
    try { return ke.call(this, z, src); }
    finally { if ((z.gen != null || z.king) && z.dm && z.dead) dmCleanup(z); }
  };

  const ht = G.hurtTarget;
  G.hurtTarget = function (t, dmg, src) {
    const r = ht.call(this, t, dmg, src);
    // Huyết Mẫu: each blow she lands heals her 300% of the damage (not while Cháy), and leaves Chảy máu on you
    if (t === this.player && src && src.dm && !src.dead && dmIdxs(src).includes(3)) {
      const st = dmSt(src, 3);
      if (st && !(st.burnT > 0)) src.hp = Math.min(src.maxHp, src.hp + dmg * 3);
      this.player.bleedT = 8;
    }
    return r;
  };

  const hp0 = G.hurtPlayer;
  G.hurtPlayer = function (dmg, src, silent) {
    const r = hp0.call(this, dmg, src, silent);
    if (src && src.gen != null && this.player && this.player.dead) dmHint(src.gen);   // slain by this Tướng: reveal the counter
    return r;
  };

  const ui0 = G.useItem;
  G.useItem = function (id, ...rest) {
    const r = ui0.call(this, id, ...rest);
    if (id === 'pills' && this.player) this.player.bleedT = 0;   // đan dược xoá Chảy máu
    return r;
  };

  const ss0 = G.summonShadow;
  G.summonShadow = function (s, free) {
    if (s && s.seized && s.seized > this.time) return 'busy';   // bóng bị cướp hồn chưa trở về
    return ss0.call(this, s, free);
  };

  const sg0 = G.spawnGeneral;
  G.spawnGeneral = function (s) {
    const i = s.i;
    sg0.call(this, s);
    let z = null;
    for (const q of this.zombies) if (q.gen === i && !q.dead && !q.dm) z = q;   // the one spawned just now
    if (!z) return;
    z.dm = { home: { x: z.x, y: z.y }, mechs: [], fightT: 0 };
    const dgImg = spr22('dg22_' + i, null);   // upright 3/4 art: same flag as a BOSSES entry with up: true (entities.js)
    if (dgImg) { z.img = dgImg; z.upright = true; }
    dmOn(z, i);
    const v = dmV();
    if (v && !v.seen[i]) { v.seen[i] = 1; SYS.msg(`Tướng Quỷ ${DEMONS[i].n}: ${TXT[i].pw} Gợi ý: ???`, 'warn'); }
  };

  const sk0 = G.spawnKing;
  G.spawnKing = function (s) {
    sk0.call(this, s);
    let z = null;
    for (const q of this.zombies) if (q.king && !q.dead && !q.dm) z = q;
    if (!z) return;
    z.dm = { home: { x: z.x, y: z.y }, mechs: [], fightT: 0, kseed: (Math.random() * 1e9) | 0, kph: -1, kmods: [] };
    dmKingPhase(z, 0);
  };

  const fi0 = G.findInteract;
  G.findInteract = function () {
    const P = this.player;
    for (const p of World.propsNear(P.x, P.y, 70)) {
      if (p.kind === 'dmbrazier' && !p.dead && p.data && !p.data.lit && dmDist(p, P) <= 64) return { prop: p, kind: 'dmbrazier', label: 'Đốt Lư hương (soi sáng cho Nguyệt Linh)' };
    }
    return fi0.call(this);
  };
  const ia0 = G.interact;
  G.interact = function (it) { if (it && it.kind === 'dmbrazier') return dmLight(it.prop); return ia0.call(this, it); };

  const tk0 = G.v5Tick;
  G.v5Tick = function (dt) {
    tk0.call(this, dt);
    if (this.state !== 'playing') return;
    const P = this.player;
    if (P && P.bleedT > 0) { P.bleedT -= dt; if (!P.dead) this.hurtPlayer(dt * 2, null, true); }
    for (const s of (this.v10 && this.v10.shadows) || []) if (s.seized && this.time >= s.seized) s.seized = 0;
    for (const a of this.allies) if (a.dmSeized && this.time >= a.dmSeized) { a.dmSeized = 0; a.downed = false; a.hp = a.maxHp * 0.5; }
    for (const z of this.zombies) if (z.seizeOf != null && !z.dead && this.time >= z.seizeUntil) { dmKill(z); dmRelease(z.seizeOf); }
    this.dmIllOn = this.zombies.some(z => !z.dead && z.dm && z.dm.s2 && z.dm.s2.ill);
  };

  Bus21.on('parry', (z, ok) => {
    if (!z || !z.dm || (z.gen == null && !z.king)) return;
    for (const i of dmIdxs(z)) { const M = DMH[i]; if (M && M.parry) M.parry(z, i, ok); }
  });

  const dl0 = drawLighting;
  drawLighting = function (camX, camY) {
    dl0(camX, camY);
    if (G.dmIllOn) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(90,30,130,0.25)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore(); }
  };

  // ---------- the journal: the counters ----------
  const dh0 = G.dkHtml;
  G.dkHtml = function () {
    const v = dmV() || { seen: {}, hint: {} };
    let h = dh0.call(this) + '<div class="dkp"><h3 class="sec">⚔ Cách khắc chế Tướng Quỷ</h3><div class="dkl">';
    for (let i = 0; i < 12; i++) {
      const D = DEMONS[i], hint = !!v.hint[i], seen = !!v.seen[i];
      h += `<div class="dkr" style="--c:${D.col}"><span class="dki">${hint ? '⚔' : '?'}</span><div class="dkt"><b>${esc21(D.n)}</b>`
        + `<small>Thế mạnh: ${seen ? esc21(TXT[i].pw) : '???'}</small>`
        + `<small class="dkrel">${hint ? 'Khắc chế: ' + esc21(TXT[i].ct) : 'Khắc chế: ??? — hạ tướng này hoặc giao chiến 60 giây để mở'}</small></div></div>`;
    }
    return h + '<small class="muted">Quỷ Vương: ba giai đoạn, mỗi giai đoạn bật hai cơ chế của tướng.</small></div></div>';
  };
})();
