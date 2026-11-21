# پناهگاه موقت گروهی وارنیکس
fill ~-6 ~-1 ~-6 ~6 ~4 ~6 cobblestone hollow
fill ~-5 ~0 ~-5 ~5 ~3 ~5 air
fill ~-2 ~0 ~-6 ~2 ~2 ~-6 air
fill ~-5 ~1 ~-5 ~-5 ~2 ~-3 iron_bars
fill ~5 ~1 ~-5 ~5 ~2 ~-3 iron_bars
setblock ~0 ~0 ~-6 varnix:computer_terminal
setblock ~2 ~0 ~-6 varnix:cctv_console
setblock ~-2 ~0 ~-6 varnix:abandoned_supply_crate
tellraw @a {"rawtext":[{"text":"§aپناهگاه موقت ساخته شد. رایانه را برای دریافت سرنخ بررسی کنید."}]}
