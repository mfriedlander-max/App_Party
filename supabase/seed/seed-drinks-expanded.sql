-- Expanded drink catalog — ~175 branded & generic drinks
-- standard_drinks = abv_decimal * volume_ml * 0.789 / 14
-- Uses ON CONFLICT DO NOTHING to preserve existing 22 seed drinks

INSERT INTO public.drink_catalog (name, brand, category, emoji, abv, standard_volume_ml, standard_drinks, source) VALUES

-- ─── POPULAR BEERS ─────────────────────────────────────────────────────────

-- Light lagers
('Bud Light',             'Budweiser',     'beer', '🍺', 0.042, 355.0, ROUND((0.042 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Budweiser',             'Budweiser',     'beer', '🍺', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Coors Light',           'Coors',         'beer', '🍺', 0.042, 355.0, ROUND((0.042 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Miller Lite',           'Miller',        'beer', '🍺', 0.042, 355.0, ROUND((0.042 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Michelob Ultra',        'Anheuser-Busch','beer', '🍺', 0.042, 355.0, ROUND((0.042 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Natural Light',         'Anheuser-Busch','beer', '🍺', 0.042, 355.0, ROUND((0.042 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Keystone Light',        'Coors',         'beer', '🍺', 0.041, 355.0, ROUND((0.041 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Busch Light',           'Anheuser-Busch','beer', '🍺', 0.041, 355.0, ROUND((0.041 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Pabst Blue Ribbon',     'PBR',           'beer', '🍺', 0.047, 355.0, ROUND((0.047 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- Mexican lagers
('Corona Extra',          'Corona',        'beer', '🍺', 0.046, 355.0, ROUND((0.046 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Modelo Especial',       'Modelo',        'beer', '🍺', 0.044, 355.0, ROUND((0.044 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Dos Equis Lager',       'Dos Equis',     'beer', '🍺', 0.042, 355.0, ROUND((0.042 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Tecate',                'Tecate',        'beer', '🍺', 0.045, 355.0, ROUND((0.045 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Pacifico',              'Pacifico',      'beer', '🍺', 0.044, 355.0, ROUND((0.044 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- European lagers
('Heineken',              'Heineken',      'beer', '🍺', 0.050, 330.0, ROUND((0.050 * 330.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Stella Artois',         'Stella Artois', 'beer', '🍺', 0.052, 330.0, ROUND((0.052 * 330.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Guinness Draught',      'Guinness',      'beer', '🍺', 0.042, 440.0, ROUND((0.042 * 440.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- American craft & regional
('Blue Moon',             'Blue Moon',     'beer', '🍺', 0.054, 355.0, ROUND((0.054 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Sam Adams Boston Lager','Sam Adams',     'beer', '🍺', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Yuengling Lager',       'Yuengling',     'beer', '🍺', 0.045, 355.0, ROUND((0.045 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Shiner Bock',           'Spoetzl',       'beer', '🍺', 0.044, 355.0, ROUND((0.044 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Fat Tire',              'New Belgium',   'beer', '🍺', 0.052, 355.0, ROUND((0.052 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- IPAs
('Sierra Nevada Pale Ale','Sierra Nevada', 'beer', '🍺', 0.056, 355.0, ROUND((0.056 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Lagunitas IPA',         'Lagunitas',     'beer', '🍺', 0.062, 355.0, ROUND((0.062 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Dogfish Head 60 Min',   'Dogfish Head',  'beer', '🍺', 0.060, 355.0, ROUND((0.060 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Stone IPA',             'Stone Brewing', 'beer', '🍺', 0.069, 355.0, ROUND((0.069 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Voodoo Ranger IPA',     'New Belgium',   'beer', '🍺', 0.070, 355.0, ROUND((0.070 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Founders All Day IPA',  'Founders',      'beer', '🍺', 0.047, 355.0, ROUND((0.047 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Bell''s Two Hearted',   'Bell''s',       'beer', '🍺', 0.070, 355.0, ROUND((0.070 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Pliny the Elder',       'Russian River', 'beer', '🍺', 0.080, 355.0, ROUND((0.080 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Goose Island IPA',      'Goose Island',  'beer', '🍺', 0.059, 355.0, ROUND((0.059 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- More craft
('Allagash White',        'Allagash',      'beer', '🍺', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Anchor Steam',          'Anchor',        'beer', '🍺', 0.048, 355.0, ROUND((0.048 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Oskar Blues Dale''s Pale Ale', 'Oskar Blues', 'beer', '🍺', 0.065, 355.0, ROUND((0.065 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- ─── HARD SELTZERS & RTDs ─────────────────────────────────────────────────

('White Claw Hard Seltzer','White Claw',   'beer', '🫧', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('White Claw Surge',       'White Claw',   'beer', '🫧', 0.080, 473.0, ROUND((0.080 * 473.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Truly Hard Seltzer',     'Truly',        'beer', '🫧', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('High Noon Sun Sips',     'High Noon',    'beer', '🫧', 0.045, 355.0, ROUND((0.045 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Vizzy Hard Seltzer',     'Vizzy',        'beer', '🫧', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Topo Chico Hard Seltzer','Topo Chico',   'beer', '🫧', 0.047, 355.0, ROUND((0.047 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Happy Dad Hard Seltzer', 'Happy Dad',    'beer', '🫧', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Bud Light Seltzer',      'Budweiser',    'beer', '🫧', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Twisted Tea',            'Twisted Tea',  'beer', '🍹', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Mike''s Hard Lemonade',  'Mike''s Hard', 'beer', '🍹', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Four Loko Gold',         'Four Loko',    'beer', '🍹', 0.120, 695.0, ROUND((0.120 * 695.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Smirnoff Ice',           'Smirnoff',     'beer', '🍹', 0.045, 355.0, ROUND((0.045 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('NUTRL Vodka Seltzer',    'NUTRL',        'beer', '🫧', 0.050, 355.0, ROUND((0.050 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Ranch Water',            NULL,           'beer', '🫧', 0.045, 355.0, ROUND((0.045 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Press Hard Seltzer',     'Press',        'beer', '🫧', 0.040, 355.0, ROUND((0.040 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Cutwater Tequila Soda',  'Cutwater',     'cocktail', '🍹', 0.070, 355.0, ROUND((0.070 * 355.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- ─── WINES ────────────────────────────────────────────────────────────────

-- Red wines
('Barefoot Cabernet',     'Barefoot',      'wine', '🍷', 0.135, 150.0, ROUND((0.135 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Barefoot Merlot',       'Barefoot',      'wine', '🍷', 0.130, 150.0, ROUND((0.130 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Yellow Tail Shiraz',    'Yellow Tail',   'wine', '🍷', 0.130, 150.0, ROUND((0.130 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Josh Cellars Cabernet', 'Josh Cellars',  'wine', '🍷', 0.138, 150.0, ROUND((0.138 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Apothic Red',           'Apothic',       'wine', '🍷', 0.136, 150.0, ROUND((0.136 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Meiomi Pinot Noir',     'Meiomi',        'wine', '🍷', 0.135, 150.0, ROUND((0.135 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Kim Crawford Sauvignon Blanc', 'Kim Crawford', 'wine', '🥂', 0.128, 150.0, ROUND((0.128 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- White wines
('Barefoot Pinot Grigio', 'Barefoot',      'wine', '🥂', 0.120, 150.0, ROUND((0.120 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Yellow Tail Chardonnay','Yellow Tail',   'wine', '🥂', 0.130, 150.0, ROUND((0.130 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Kendall-Jackson Chardonnay', 'Kendall-Jackson', 'wine', '🥂', 0.134, 150.0, ROUND((0.134 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- Rosé
('Barefoot Rosé',         'Barefoot',      'wine', '🌸', 0.090, 150.0, ROUND((0.090 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),
('White Girl Rosé',       'White Girl',    'wine', '🌸', 0.123, 150.0, ROUND((0.123 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- Sparkling
('La Marca Prosecco',     'La Marca',      'wine', '🥂', 0.110, 125.0, ROUND((0.110 * 125.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Veuve Clicquot',        'Veuve Clicquot','wine', '🍾', 0.120, 125.0, ROUND((0.120 * 125.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Moet & Chandon',        'Moet & Chandon','wine', '🍾', 0.120, 125.0, ROUND((0.120 * 125.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Korbel Brut',           'Korbel',        'wine', '🥂', 0.115, 125.0, ROUND((0.115 * 125.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- Boxed
('Franzia Chardonnay',    'Franzia',       'wine', '🥂', 0.130, 150.0, ROUND((0.130 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- Sangria
('Barefoot Sangria',      'Barefoot',      'wine', '🍹', 0.090, 150.0, ROUND((0.090 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- ─── SPIRITS ──────────────────────────────────────────────────────────────

('Tito''s Handmade Vodka', 'Tito''s',     'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Grey Goose Vodka',       'Grey Goose',  'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Absolut Vodka',          'Absolut',     'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Smirnoff Vodka',         'Smirnoff',    'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Jack Daniel''s',         'Jack Daniel''s', 'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Jameson Irish Whiskey',  'Jameson',     'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Crown Royal',            'Crown Royal', 'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Maker''s Mark',          'Maker''s Mark','spirit','🥃', 0.450, 44.0, ROUND((0.450 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Jim Beam',               'Jim Beam',    'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Hennessy VS',            'Hennessy',    'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Patron Silver',          'Patron',      'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Don Julio Blanco',       'Don Julio',   'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Captain Morgan Spiced',  'Captain Morgan','spirit','🥃',0.350, 44.0, ROUND((0.350 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Bacardi White Rum',      'Bacardi',     'spirit', '🥃', 0.400, 44.0, ROUND((0.400 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Fireball Whisky',        'Fireball',    'spirit', '🥃', 0.330, 44.0, ROUND((0.330 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Jagermeister',           'Jagermeister','spirit', '🖤', 0.350, 44.0, ROUND((0.350 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Kahlua',                 'Kahlua',      'spirit', '🥃', 0.200, 44.0, ROUND((0.200 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Baileys Irish Cream',    'Baileys',     'spirit', '🥃', 0.170, 44.0, ROUND((0.170 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Malibu Rum',             'Malibu',      'spirit', '🥃', 0.210, 44.0, ROUND((0.210 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Woodford Reserve',       'Woodford Reserve','spirit','🥃',0.434,44.0, ROUND((0.434 * 44.0 * 0.789 / 14)::numeric, 2), 'curated'),

-- ─── POPULAR COCKTAILS ────────────────────────────────────────────────────

('Margarita Classic',     NULL, 'cocktail', '🍹', 0.180, 120.0, ROUND((0.180 * 120.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Old Fashioned Classic', NULL, 'cocktail', '🥃', 0.320, 90.0,  ROUND((0.320 * 90.0  * 0.789 / 14)::numeric, 2), 'curated'),
('Manhattan',             NULL, 'cocktail', '🍸', 0.280, 90.0,  ROUND((0.280 * 90.0  * 0.789 / 14)::numeric, 2), 'curated'),
('Martini',               NULL, 'cocktail', '🍸', 0.300, 90.0,  ROUND((0.300 * 90.0  * 0.789 / 14)::numeric, 2), 'curated'),
('Cosmopolitan',          NULL, 'cocktail', '🍸', 0.200, 100.0, ROUND((0.200 * 100.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Mojito Classic',        NULL, 'cocktail', '🍹', 0.120, 200.0, ROUND((0.120 * 200.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Long Island Iced Tea',  NULL, 'cocktail', '🍹', 0.220, 300.0, ROUND((0.220 * 300.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Gin & Tonic',           NULL, 'cocktail', '🍸', 0.090, 250.0, ROUND((0.090 * 250.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Rum & Coke',            NULL, 'cocktail', '🥤', 0.075, 300.0, ROUND((0.075 * 300.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Whiskey Sour',          NULL, 'cocktail', '🍋', 0.150, 120.0, ROUND((0.150 * 120.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Daiquiri',              NULL, 'cocktail', '🍓', 0.160, 100.0, ROUND((0.160 * 100.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Negroni Classic',       NULL, 'cocktail', '🍹', 0.240, 90.0,  ROUND((0.240 * 90.0  * 0.789 / 14)::numeric, 2), 'curated'),
('Aperol Spritz Classic', NULL, 'cocktail', '🍊', 0.080, 200.0, ROUND((0.080 * 200.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Moscow Mule',           NULL, 'cocktail', '🍺', 0.090, 250.0, ROUND((0.090 * 250.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Paloma',                NULL, 'cocktail', '🍹', 0.120, 250.0, ROUND((0.120 * 250.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Dark & Stormy',         NULL, 'cocktail', '🌩', 0.110, 250.0, ROUND((0.110 * 250.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Pina Colada',           NULL, 'cocktail', '🍍', 0.130, 250.0, ROUND((0.130 * 250.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Mai Tai',               NULL, 'cocktail', '🏝', 0.200, 200.0, ROUND((0.200 * 200.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Espresso Martini Classic', NULL, 'cocktail', '☕', 0.220, 100.0, ROUND((0.220 * 100.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Tequila Sunrise',       NULL, 'cocktail', '🌅', 0.100, 250.0, ROUND((0.100 * 250.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Sangria',               NULL, 'cocktail', '🍷', 0.080, 200.0, ROUND((0.080 * 200.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Mimosa',                NULL, 'cocktail', '🥂', 0.060, 150.0, ROUND((0.060 * 150.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Bloody Mary',           NULL, 'cocktail', '🍅', 0.100, 250.0, ROUND((0.100 * 250.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Sour Mix Shot',         NULL, 'shot',     '🥃', 0.200, 44.0,  ROUND((0.200 * 44.0  * 0.789 / 14)::numeric, 2), 'curated'),
('Lemon Drop Shot',       NULL, 'shot',     '🍋', 0.280, 44.0,  ROUND((0.280 * 44.0  * 0.789 / 14)::numeric, 2), 'curated'),
('Kamikaze Shot',         NULL, 'shot',     '🥃', 0.250, 44.0,  ROUND((0.250 * 44.0  * 0.789 / 14)::numeric, 2), 'curated'),
('Washington Apple',      NULL, 'shot',     '🍎', 0.220, 44.0,  ROUND((0.220 * 44.0  * 0.789 / 14)::numeric, 2), 'curated'),
('Buttery Nipple',        NULL, 'shot',     '🥛', 0.180, 44.0,  ROUND((0.180 * 44.0  * 0.789 / 14)::numeric, 2), 'curated'),
('Sex on the Beach',      NULL, 'cocktail', '🏖', 0.120, 200.0, ROUND((0.120 * 200.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Harvey Wallbanger',     NULL, 'cocktail', '🍊', 0.110, 250.0, ROUND((0.110 * 250.0 * 0.789 / 14)::numeric, 2), 'curated'),
('Sidecar',               NULL, 'cocktail', '🥃', 0.200, 90.0,  ROUND((0.200 * 90.0  * 0.789 / 14)::numeric, 2), 'curated')

ON CONFLICT DO NOTHING;
