-- containers: standard vessels with volume and fill data
CREATE TABLE public.containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('can', 'bottle', 'glass', 'cup', 'other')),
  volume_ml NUMERIC(6,1) NOT NULL,
  typical_fill NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  icon TEXT DEFAULT ''
);
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read containers" ON public.containers FOR SELECT USING (true);

INSERT INTO public.containers (name, category, volume_ml, typical_fill, icon) VALUES
  -- Cans
  ('Standard Can',           'can',    355.0, 1.00, '🥤'),
  ('Tall Can (16oz)',        'can',    473.0, 1.00, '🥤'),
  ('Slim Can (12oz)',        'can',    355.0, 1.00, '🥤'),
  ('Mini Can (7.5oz)',       'can',    222.0, 1.00, '🥤'),
  ('Tallboy (24oz)',         'can',    710.0, 1.00, '🥤'),
  ('Hard Seltzer Can',       'can',    355.0, 1.00, '🫧'),
  -- Bottles
  ('Beer Bottle (12oz)',     'bottle', 355.0, 1.00, '🍺'),
  ('Beer Bottle (22oz)',     'bottle', 651.0, 1.00, '🍺'),
  ('Wine Bottle (750ml)',    'bottle', 750.0, 1.00, '🍷'),
  ('Wine Bottle (375ml)',    'bottle', 375.0, 1.00, '🍷'),
  ('Spirit Bottle (750ml)', 'bottle', 750.0, 1.00, '🥃'),
  ('Shot Bottle (50ml)',     'bottle', 50.0,  1.00, '🥃'),
  ('Champagne Bottle',       'bottle', 750.0, 1.00, '🍾'),
  ('Bomber (22oz)',          'bottle', 651.0, 1.00, '🍺'),
  -- Glasses
  ('Pint Glass',             'glass',  473.0, 0.90, '🍺'),
  ('Half Pint Glass',        'glass',  237.0, 0.90, '🍺'),
  ('Wine Glass',             'glass',  148.0, 0.75, '🍷'),
  ('Large Wine Glass',       'glass',  200.0, 0.75, '🍷'),
  ('Shot Glass',             'glass',  44.0,  1.00, '🥃'),
  ('Double Shot Glass',      'glass',  88.0,  1.00, '🥃'),
  ('Rocks Glass',            'glass',  177.0, 0.85, '🥃'),
  ('Highball Glass',         'glass',  355.0, 0.85, '🍹'),
  ('Martini Glass',          'glass',  148.0, 0.90, '🍸'),
  ('Champagne Flute',        'glass',  148.0, 0.80, '🥂'),
  ('Coupe Glass',            'glass',  148.0, 0.85, '🥂'),
  ('Beer Mug (16oz)',        'glass',  473.0, 0.90, '🍺'),
  ('Pilsner Glass',          'glass',  355.0, 0.90, '🍺'),
  ('Weizen Glass (500ml)',   'glass',  500.0, 0.90, '🍺'),
  ('Snifter Glass',          'glass',  237.0, 0.50, '🥃'),
  ('Collins Glass',          'glass',  355.0, 0.85, '🍹'),
  ('Hurricane Glass',        'glass',  473.0, 0.85, '🍹'),
  ('Margarita Glass',        'glass',  300.0, 0.85, '🍹'),
  ('Irish Coffee Glass',     'glass',  237.0, 0.85, '☕'),
  -- Cups
  ('Solo Cup (16oz)',        'cup',    473.0, 0.75, '🥤'),
  ('Solo Cup (12oz)',        'cup',    355.0, 0.75, '🥤'),
  ('Stadium Cup (20oz)',     'cup',    591.0, 0.80, '🥤'),
  ('Plastic Cup (9oz)',      'cup',    266.0, 0.80, '🥤'),
  ('Paper Cup (8oz)',        'cup',    237.0, 0.80, '🥤'),
  ('Thermos Cup',            'cup',    355.0, 0.85, '🫗'),
  -- Other
  ('Flask (8oz)',            'other',  237.0, 1.00, '🥃'),
  ('Punch Cup',              'other',  177.0, 0.80, '🍹'),
  ('Yard Glass',             'other',  946.0, 0.90, '🍺'),
  ('Boot Glass (0.5L)',      'other',  500.0, 0.90, '🍺')
ON CONFLICT (name) DO NOTHING;

-- category_defaults: ABV and volume defaults by drink type
CREATE TABLE public.category_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  display_name TEXT NOT NULL,
  default_abv NUMERIC(5,3) NOT NULL,
  default_volume_ml NUMERIC(6,1) NOT NULL,
  default_container TEXT,
  emoji TEXT DEFAULT '',
  UNIQUE (category, subcategory)
);
ALTER TABLE public.category_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read category defaults" ON public.category_defaults FOR SELECT USING (true);

INSERT INTO public.category_defaults (category, subcategory, display_name, default_abv, default_volume_ml, default_container, emoji) VALUES
  -- Beer styles
  ('beer', 'light_lager',   'Light Lager',         0.042, 355.0, 'Standard Can',      '🍺'),
  ('beer', 'lager',         'Lager',                0.050, 355.0, 'Standard Can',      '🍺'),
  ('beer', 'ipa',           'IPA',                  0.065, 355.0, 'Standard Can',      '🍺'),
  ('beer', 'pale_ale',      'Pale Ale',             0.055, 355.0, 'Standard Can',      '🍺'),
  ('beer', 'stout',         'Stout',                0.050, 473.0, 'Pint Glass',        '🍺'),
  ('beer', 'porter',        'Porter',               0.055, 473.0, 'Pint Glass',        '🍺'),
  ('beer', 'wheat',         'Wheat / Hefeweizen',   0.050, 500.0, 'Weizen Glass (500ml)', '🍺'),
  ('beer', 'sour',          'Sour Ale',             0.048, 355.0, 'Standard Can',      '🍺'),
  ('beer', 'hard_seltzer',  'Hard Seltzer',         0.050, 355.0, 'Hard Seltzer Can',  '🫧'),
  ('beer', 'hard_lemonade', 'Hard Lemonade',        0.050, 355.0, 'Standard Can',      '🍋'),
  ('beer', 'rtd_cocktail',  'RTD Cocktail',         0.070, 355.0, 'Standard Can',      '🍹'),
  ('beer', 'malt_liquor',   'Malt Liquor',          0.075, 473.0, 'Tall Can (16oz)',   '🥤'),
  -- Wine types
  ('wine', 'red_wine',      'Red Wine',             0.135, 150.0, 'Wine Glass',        '🍷'),
  ('wine', 'white_wine',    'White Wine',           0.125, 150.0, 'Wine Glass',        '🥂'),
  ('wine', 'rose',          'Rosé',                 0.115, 150.0, 'Wine Glass',        '🌸'),
  ('wine', 'prosecco',      'Prosecco',             0.110, 125.0, 'Champagne Flute',   '🥂'),
  ('wine', 'champagne',     'Champagne',            0.120, 125.0, 'Champagne Flute',   '🍾'),
  ('wine', 'sparkling',     'Sparkling Wine',       0.115, 125.0, 'Champagne Flute',   '🥂'),
  ('wine', 'dessert_wine',  'Dessert Wine',         0.160, 75.0,  'Wine Glass',        '🍷'),
  ('wine', 'port',          'Port',                 0.200, 60.0,  'Wine Glass',        '🍷'),
  ('wine', 'sherry',        'Sherry',               0.175, 60.0,  'Wine Glass',        '🥂'),
  ('wine', 'sangria',       'Sangria',              0.080, 200.0, 'Large Wine Glass',  '🍹'),
  -- Spirit types
  ('spirit', 'vodka',       'Vodka',                0.400, 44.0,  'Shot Glass',        '🥃'),
  ('spirit', 'whiskey',     'Whiskey',              0.400, 44.0,  'Shot Glass',        '🥃'),
  ('spirit', 'bourbon',     'Bourbon',              0.430, 44.0,  'Shot Glass',        '🥃'),
  ('spirit', 'scotch',      'Scotch',               0.430, 44.0,  'Shot Glass',        '🥃'),
  ('spirit', 'rum',         'Rum',                  0.400, 44.0,  'Shot Glass',        '🥃'),
  ('spirit', 'tequila',     'Tequila',              0.400, 44.0,  'Shot Glass',        '🥃'),
  ('spirit', 'mezcal',      'Mezcal',               0.400, 44.0,  'Shot Glass',        '🥃'),
  ('spirit', 'gin',         'Gin',                  0.400, 44.0,  'Shot Glass',        '🥃'),
  ('spirit', 'brandy',      'Brandy / Cognac',      0.400, 44.0,  'Snifter Glass',     '🥃'),
  ('spirit', 'liqueur',     'Liqueur',              0.250, 44.0,  'Shot Glass',        '🥃'),
  ('spirit', 'schnapps',    'Schnapps',             0.200, 44.0,  'Shot Glass',        '🥃'),
  -- Cocktail types
  ('cocktail', 'highball',  'Highball',             0.090, 300.0, 'Highball Glass',    '🍹'),
  ('cocktail', 'sour',      'Sour Cocktail',        0.150, 120.0, 'Rocks Glass',       '🍋'),
  ('cocktail', 'martini',   'Martini Style',        0.280, 90.0,  'Martini Glass',     '🍸'),
  ('cocktail', 'tropical',  'Tropical / Tiki',      0.150, 250.0, 'Hurricane Glass',   '🏝'),
  ('cocktail', 'spritz',    'Spritz',               0.080, 200.0, 'Wine Glass',        '🍊'),
  ('cocktail', 'punch',     'Punch',                0.080, 200.0, 'Punch Cup',         '🍹'),
  ('cocktail', 'shot_chaser','Shot + Chaser',       0.200, 44.0,  'Shot Glass',        '🥃')
ON CONFLICT (category, subcategory) DO NOTHING;
