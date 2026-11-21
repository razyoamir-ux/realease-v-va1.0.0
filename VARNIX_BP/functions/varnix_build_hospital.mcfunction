# بیمارستان متروکه - سازه سبک و بلوکی
fill ~-9 ~-1 ~-9 ~9 ~6 ~9 stone_bricks hollow
fill ~-8 ~0 ~-8 ~8 ~5 ~8 air
fill ~-8 ~-1 ~-8 ~8 ~-1 ~8 polished_andesite
fill ~-8 ~0 ~0 ~8 ~4 ~0 stone_bricks
fill ~-8 ~0 ~1 ~8 ~3 ~1 air
fill ~-3 ~0 ~-8 ~-3 ~3 ~-1 iron_bars
fill ~3 ~0 ~-8 ~3 ~3 ~-1 iron_bars
fill ~-1 ~0 ~-9 ~1 ~2 ~-9 air
setblock ~-6 ~0 ~-6 redstone_lamp
setblock ~6 ~0 ~-6 redstone_lamp
setblock ~-6 ~0 ~6 redstone_lamp
setblock ~6 ~0 ~6 redstone_lamp
setblock ~-5 ~0 ~-4 bed
setblock ~5 ~0 ~-4 bed
setblock ~-5 ~0 ~4 bed
setblock ~5 ~0 ~4 bed
setblock ~0 ~0 ~-7 varnix:computer_terminal
setblock ~2 ~0 ~-7 varnix:cctv_console
setblock ~0 ~0 ~6 chest
loot insert ~0 ~0 ~6 loot varnix:chests/abandoned_supply
tellraw @a {"rawtext":[{"text":"§eبیمارستان متروکه ساخته شد. رایانه ورودی را بررسی کنید؛ در عمق ساختمان خطری وجود دارد."}]}
