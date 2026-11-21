import { world, system, EntityDamageCause, ItemStack } from "@minecraft/server";

const COOLDOWN = new Map();
const MAGAZINES = new Map();
const LAST_GUN = new Map();
const LAST_AMMO = new Map();
const INFECTIONS = new Map();
const GENERATORS = new Map();
const CAPACITY = {"varnix:pistol":12,"varnix:rifle":30,"varnix:shotgun":6,"varnix:sniper":5};
const GUNS = ["varnix:pistol","varnix:rifle","varnix:shotgun","varnix:sniper"];

function message(player, text) {
  try { player.sendMessage("§6[وارنیکس] §f" + text); } catch {}
}
function cooldown(id, key, ticks) {
  const now = system.currentTick, k = id + ":" + key;
  if (now - (COOLDOWN.get(k) ?? -99999) < ticks) return false;
  COOLDOWN.set(k, now);
  return true;
}
function inventory(player) {
  return player.getComponent("minecraft:inventory")?.container;
}
function consume(player, typeId) {
  const inv = inventory(player);
  if (!inv) return false;
  for (let i = 0; i < inv.size; i++) {
    const stack = inv.getItem(i);
    if (stack?.typeId === typeId) {
      if (stack.amount > 1) { stack.amount--; inv.setItem(i, stack); }
      else inv.setItem(i, undefined);
      return true;
    }
  }
  return false;
}
function shoot(player, itemId) {
  const cfg = {
    "varnix:pistol": {damage:6,range:24,cooldown:8,label:"کلت"},
    "varnix:rifle": {damage:8,range:42,cooldown:4,label:"رایفل"},
    "varnix:shotgun": {damage:4,range:13,cooldown:18,label:"شاتگان"},
    "varnix:sniper": {damage:22,range:64,cooldown:32,label:"اسنایپر"}
  }[itemId];
  if (!cfg || !cooldown(player.id,itemId,cfg.cooldown)) return;
  LAST_GUN.set(player.id,itemId);
  const key=player.id+":"+itemId;
  const ammo=MAGAZINES.has(key)?MAGAZINES.get(key):CAPACITY[itemId];
  if (ammo<=0) { message(player,"خشاب خالی است؛ جعبه مهمات را استفاده کن."); return; }
  MAGAZINES.set(key,ammo-1);
  try {
    const hits=player.getEntitiesFromViewDirection({maxDistance:cfg.range});
    if (hits.length && hits[0].entity) {
      hits[0].entity.applyDamage(cfg.damage*(LAST_AMMO.get(key)==="uranium"?1.5:1),{cause:EntityDamageCause.projectile,damagingEntity:player});
      message(player,cfg.label+" شلیک شد.");
    } else message(player,"شلیک شد؛ تیر به هدفی برخورد نکرد.");
  } catch { message(player,"شلیک ناموفق بود."); }
}

function generatorKey(block) {
  const p=block.location;
  return block.dimension.id+":"+p.x+":"+p.y+":"+p.z;
}
function poweredNearby(player) {
  for (const entry of GENERATORS.values()) {
    if (entry.dimensionId!==player.dimension.id || entry.until<=system.currentTick) continue;
    const p=player.location, g=entry.location;
    const dx=p.x-g.x, dy=p.y-g.y, dz=p.z-g.z;
    if (dx*dx+dy*dy+dz*dz<=256) return true;
  }
  return false;
}
function infect(player) {
  if (INFECTIONS.has(player.id)) return;
  INFECTIONS.set(player.id,system.currentTick+6000);
  message(player,"§cآلودگی وارد بدنت شد! فقط ۵ دقیقه فرصت داری پادزهر بسازی و مصرف کنی.");
  try { player.addEffect("nausea",100,{amplifier:0,showParticles:false}); } catch {}
}
function cure(player) {
  if (!INFECTIONS.has(player.id)) { message(player,"تو آلوده نیستی."); return; }
  if (!consume(player,"varnix:antiviral_serum")) { message(player,"پادزهر در کیف تو نیست."); return; }
  INFECTIONS.delete(player.id);
  try { player.removeEffect("nausea"); player.removeEffect("slowness"); } catch {}
  message(player,"§aدرمان موفق! عفونت زامبی مهار شد.");
}

world.afterEvents.playerSpawn.subscribe(({player,initialSpawn}) => {
  if (initialSpawn) {
    message(player,"سامانه‌های وارنیکس به‌صورت خودکار فعال شدند؛ نیازی به دستور راه‌اندازی نیست.");
    message(player,"برای زنده ماندن مراقب گازگرفتگی باش. آلودگی فقط ۵ دقیقه فرصت درمان می‌دهد.");
    message(player,"اورانیوم را از جعبه‌های تدارکات یا سنگ معدن پیدا کن؛ برای پادزهر، سلول انرژی و مهمات ویژه کاربرد دارد.");
    try {
      const inv=inventory(player);
      if (inv) {
        for (const [id,count] of [["varnix:phone",1],["varnix:radio",1],["varnix:pistol",1],["varnix:ammo_box",2],["varnix:field_bandage",3],["minecraft:coal",4]]) {
          inv.addItem(new ItemStack(id,count));
        }
      }
      message(player,"§aکیت آغازین بازمانده به‌صورت خودکار تحویل داده شد.");
    } catch { message(player,"کیت آغازین را می‌توانی از جعبه تدارکات تهیه کنی."); }
  }
});

world.afterEvents.entityHurt.subscribe((event) => {
  const victim=event.hurtEntity;
  const attacker=event.damageSource.damagingEntity;
  if (!victim || victim.typeId!=="minecraft:player" || !attacker) return;
  try {
    if (["varnix:infected","varnix:infected_runner","varnix:infected_brute","varnix:mutant_alpha"].includes(attacker.typeId)) infect(victim);
  } catch {}
});

world.afterEvents.itemUse.subscribe(({source,itemStack}) => {
  if (source.typeId!=="minecraft:player") return;
  const id=itemStack.typeId;
  if (GUNS.includes(id)) shoot(source,id);
  if (id==="varnix:antiviral_serum") cure(source);
  if (id==="varnix:recipe_guide") {
    message(source,"§e§lراهنمای فارسی دستورهای ساخت وارنیکس");
    message(source,"§6[پادزهر] §f۲ اورانیوم + ۲ بطری عسل + ۲ طلا + ۱ بطری شیشه‌ای؛ خروجی: ۲ پادزهر. در میز ساخت بساز و پس از آلودگی مصرف کن.");
    message(source,"§6[سلول انرژی] §f۲ اورانیوم + ۴ ردستون + ۲ آهن + ۱ باتری صنعتی؛ خروجی: ۲ سلول انرژی. برای ژنراتور ویژه استفاده کن.");
    message(source,"§6[باتری صنعتی] §f۴ ردستون + ۴ آهن؛ خروجی: ۲ باتری.");
    message(source,"§6[گالن سوخت] §f۸ آهن + ۱ سطل؛ خروجی: ۲ گالن سوخت.");
    message(source,"§6[مهمات اورانیومی] §f۱ اورانیوم + ۲ آهن + ۱ باروت؛ خروجی: ۴ مهمات. با استفاده از آن خشاب ویژه پر می‌شود.");
    message(source,"§6[ژنراتور] §f۷ آهن + ۱ ردستون + ۱ کوره؛ خروجی: ۱ ژنراتور.");
    message(source,"§6[سلاح‌ها] §fکلت، رایفل، شاتگان و اسنایپر با دستورهای ساخت اختصاصی در میز ساخت ساخته می‌شوند.");
    message(source,"§aراهنمای سوخت: §fزغال ۵ دقیقه، گالن سوخت ۱۰ دقیقه، سلول اورانیومی ۲۰ دقیقه؛ دستگاه‌های برقی تا شعاع ۱۶ بلوک کار می‌کنند.");
    message(source,"§cنکته: §fاورانیوم یک ماده کاملاً خیالی در بازی است. این راهنما فقط دستورهای ساخت افزونه را توضیح می‌دهد.");
  }
  if (id==="varnix:phone") {
    message(source,"گوشی هوشمند: پایگاه، مأموریت‌ها و وضعیت بقا آماده‌اند. برای داستان گروهی با هم‌تیمی‌ها به آزمایشگاه برو.");
    message(source,"این وسیله فقط داخل Minecraft شبیه‌سازی شده است.");
  }
  if (id==="varnix:car_key" && cooldown(source.id,"car",80)) {
    const p=source.location,d=source.getViewDirection();
    try {
      source.dimension.spawnEntity("varnix:rusty_car",{x:p.x+d.x*3,y:p.y,z:p.z+d.z*3});
      message(source,"خودروی فرسوده نزدیکت ظاهر شد.");
    } catch { message(source,"ساخت خودرو ناموفق بود؛ بسته رفتاری را بررسی کن."); }
  }
  if (id==="varnix:ammo_box") {
    const gun=LAST_GUN.get(source.id)||"varnix:pistol";
    if (!consume(source,"varnix:ammo_box")) return;
    MAGAZINES.set(source.id+":"+gun,CAPACITY[gun]);
    LAST_AMMO.set(source.id+":"+gun,"normal");
    message(source,"خشاب "+gun.replace("varnix:","")+" پر شد.");
  }
  if (id==="varnix:uranium_ammo") {
    const gun=LAST_GUN.get(source.id)||"varnix:pistol";
    if (!consume(source,"varnix:uranium_ammo")) return;
    MAGAZINES.set(source.id+":"+gun,CAPACITY[gun]);
    LAST_AMMO.set(source.id+":"+gun,"uranium");
    message(source,"مهمات اورانیومی بارگذاری شد؛ قدرت آسیب ۵۰٪ بیشتر است.");
  }
  if (id==="varnix:radio") message(source,"بی‌سیم اضطراری: «اینجا پایگاه شمالی... به بیمارستان قدیمی نزدیک نشوید.»");
});

world.afterEvents.playerInteractWithBlock.subscribe(({player,block}) => {
  if (block.typeId==="varnix:generator") {
    const key=generatorKey(block);
    if (GENERATORS.has(key) && GENERATORS.get(key).until>system.currentTick) {
      GENERATORS.delete(key);
      message(player,"ژنراتور خاموش شد.");
      return;
    }
    let duration=0, fuel="";
    if (consume(player,"varnix:uranium_cell")) { duration=24000; fuel="سلول اورانیومی"; }
    else if (consume(player,"varnix:gas_can")) { duration=12000; fuel="گالن سوخت"; }
    else if (consume(player,"minecraft:coal") || consume(player,"minecraft:charcoal")) { duration=6000; fuel="زغال"; }
    if (!duration) { message(player,"برای روشن‌کردن ژنراتور، زغال، گالن سوخت یا سلول اورانیومی لازم داری."); return; }
    GENERATORS.set(key,{dimensionId:block.dimension.id,location:block.location,until:system.currentTick+duration});
    message(player,"§aژنراتور روشن شد؛ سوخت: "+fuel+". برق تا پایان شارژ به تجهیزات نزدیک می‌رسد.");
    return;
  }
  if (block.typeId==="varnix:computer_terminal" || block.typeId==="varnix:cctv_console") {
    if (!poweredNearby(player)) { message(player,"§cبرق قطع است! اول ژنراتور نزدیک را روشن کن."); return; }
  }
  if (block.typeId==="varnix:computer_terminal") {
    message(player,"رایانه پایگاه: پرونده ۲۰۳۱ باز شد. منشأ آلودگی در آزمایشگاه زیرزمینی ثبت شده است.");
    message(player,"اورانیوم برای ساخت پادزهر و تجهیزات انرژی حیاتی است.");
  }
  if (block.typeId==="varnix:cctv_console") {
    const hostiles=player.dimension.getEntities({location:player.location,maxDistance:32,families:["varnix_infected"]});
    message(player,"دوربین‌های محوطه: "+hostiles.length+" آلوده در شعاع ۳۲ بلوکی شناسایی شد.");
  }
  if (block.typeId==="varnix:abandoned_supply_crate") {
    try {
      player.dimension.runCommand("loot give @p loot varnix:chests/abandoned_supply");
      message(player,"جعبه تدارکات بررسی شد.");
    } catch { message(player,"جعبه هنوز آماده نیست."); }
  }
});

world.afterEvents.playerBreakBlock.subscribe(({player,brokenBlockPermutation,block}) => {
  if (brokenBlockPermutation.type.id==="varnix:uranium_ore") {
    try {
      block.dimension.spawnItem(new ItemStack("varnix:uranium",1),block.location);
      message(player,"§aاورانیوم خام به دست آوردی؛ مراقب تشعشع خیالی معدن باش!");
    } catch {}
  }
});

system.runInterval(() => {
  const now=system.currentTick;
  for (const [key,g] of GENERATORS) if (g.until<=now) GENERATORS.delete(key);
  for (const player of world.getAllPlayers()) {
    const expiry=INFECTIONS.get(player.id);
    if (expiry!==undefined) {
      const left=expiry-now;
      if (left<=0) {
        INFECTIONS.delete(player.id);
        try { player.applyDamage(1000,{cause:EntityDamageCause.magic}); } catch {}
        message(player,"§4زمان آلودگی تمام شد؛ بیماری به مرحله نهایی رسید.");
      } else {
        if (left===1200 || left===600 || left===200) message(player,"§cزمان باقی‌مانده تا تبدیل: "+Math.ceil(left/20)+" ثانیه!");
        if (left<=1200 && left%200===0) {
          try { player.addEffect("slowness",100,{amplifier:0,showParticles:false}); } catch {}
        }
      }
    }
    const nearby=player.dimension.getEntities({location:player.location,maxDistance:22,families:["varnix_infected"]});
    if (nearby.length>0 && Math.random()<0.012) message(player,"صدای ناله‌ای از نزدیکی می‌آید...");
  }
},20);
