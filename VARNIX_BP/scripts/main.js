import { world, system, EntityDamageCause } from "@minecraft/server";

const COOLDOWN = new Map();
const lastUse = (id, key, ticks) => {
  const now = system.currentTick;
  const k = id + ":" + key;
  const previous = COOLDOWN.get(k) ?? -9999;
  if (now - previous < ticks) return false;
  COOLDOWN.set(k, now);
  return true;
};

function message(player, text) {
  try { player.sendMessage("§6[وارنیکس] §f" + text); } catch {}
}

function shoot(player, itemId) {
  const configs = {
    "varnix:pistol": {damage: 6, range: 24, cooldown: 8, label: "کلت"},
    "varnix:rifle": {damage: 8, range: 42, cooldown: 4, label: "رایفل"},
    "varnix:shotgun": {damage: 4, range: 13, cooldown: 18, label: "شاتگان"},
    "varnix:sniper": {damage: 22, range: 64, cooldown: 32, label: "اسنایپر"}
  };
  const cfg = configs[itemId];
  if (!cfg || !lastUse(player.id, itemId, cfg.cooldown)) return;
  try {
    const hits = player.getEntitiesFromViewDirection({maxDistance: cfg.range, ignoreBlockCollision: false});
    if (itemId === "varnix:shotgun") {
      const candidates = player.dimension.getEntities({location: player.location, maxDistance: 9, families:["varnix_infected"]});
      let hitCount = 0;
      for (const target of candidates) {
        if (target.id === player.id) continue;
        try { target.applyDamage(cfg.damage, {cause: EntityDamageCause.projectile, damagingEntity: player}); hitCount++; } catch {}
      }
      message(player, hitCount ? "شلیک شاتگان؛ هدف‌های نزدیک آسیب دیدند." : "شلیک شد؛ هدفی در محدوده نبود.");
    } else if (hits.length && hits[0].entity) {
      hits[0].entity.applyDamage(cfg.damage, {cause: EntityDamageCause.projectile, damagingEntity: player});
      message(player, cfg.label + " شلیک شد.");
    } else {
      message(player, "شلیک شد؛ تیر به هدفی برخورد نکرد.");
    }
  } catch {
    message(player, "خطا در شلیک؛ مطمئن شو قابلیت‌های آزمایشی موردنیاز خاموش نیستند و بسته فعال است.");
  }
}

world.afterEvents.itemUse.subscribe(({source, itemStack}) => {
  const id = itemStack.typeId;
  if (id.startsWith("varnix:") && ["varnix:pistol","varnix:rifle","varnix:shotgun","varnix:sniper"].includes(id)) {
    shoot(source, id);
  }
  if (id === "varnix:phone") {
    message(source, "گوشی باز شد: /function varnix_help برای راهنما، /function varnix_story_start برای شروع داستان، /function varnix_free_mode برای بقای آزاد.");
    message(source, "این گوشی داخل دنیای بازی شبیه‌سازی شده و به سخت‌افزار واقعی تلفن دسترسی ندارد.");
  }
  if (id === "varnix:car_key") {
    if (!lastUse(source.id, "car", 80)) return;
    const p = source.location, d = source.getViewDirection();
    const at = {x:p.x+d.x*3, y:p.y, z:p.z+d.z*3};
    try {
      source.dimension.spawnEntity("varnix:rusty_car", at);
      message(source, "خودروی فرسوده در نزدیکی تو ظاهر شد. نزدیکش شو و سوار شو.");
    } catch { message(source, "ساخت خودرو ناموفق بود؛ بسته رفتاری را بررسی کن."); }
  }
  if (id === "varnix:radio") {
    message(source, "بی‌سیم اضطراری: «اینجا پایگاه شمالی... اگر کسی صدای ما را می‌شنود، به بیمارستان قدیمی نزدیک نشود.»");
  }
});

world.afterEvents.playerInteractWithBlock.subscribe(({player, block}) => {
  if (block.typeId === "varnix:computer_terminal") {
    message(player, "رایانه پایگاه: پرونده ۲۰۳۱ باز شد. منشأ آلودگی هنوز نامشخص است. برای شروع مأموریت /function varnix_story_start را اجرا کن.");
  }
  if (block.typeId === "varnix:cctv_console") {
    const hostiles = player.dimension.getEntities({location: player.location, maxDistance: 32, families:["varnix_infected"]});
    message(player, "دوربین‌های محوطه: " + hostiles.length + " آلوده در شعاع ۳۲ بلوکی شناسایی شد.");
  }
  if (block.typeId === "varnix:abandoned_supply_crate") {
    try {
      player.dimension.runCommand("loot give \"" + player.name + "\" loot \"varnix:chests/abandoned_supply\"");
      message(player, "جعبه تدارکات بررسی شد.");
    } catch { message(player, "جعبه هنوز آماده نیست؛ جدول غنیمت را بررسی کن."); }
  }
});

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const nearby = player.dimension.getEntities({location: player.location, maxDistance: 22, families:["varnix_infected"]});
    if (nearby.length > 0 && Math.random() < 0.012) {
      message(player, "§cصدای ناله‌ای از نزدیکی می‌آید...");
    }
  }
}, 100);
