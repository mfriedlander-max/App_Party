-- Seed drink_catalog with 21 drinks from mock-drinks.ts
-- standard_drinks = (abv / 100) * volume_ml * 0.789 / 14

INSERT INTO public.drink_catalog (name, category, emoji, abv, standard_volume_ml, standard_drinks, source) VALUES
  -- Beers
  ('IPA',        'beer', '🍺', 6.500,  355.0, ROUND((6.5  / 100.0 * 355  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Lager',      'beer', '🍺', 4.200,  355.0, ROUND((4.2  / 100.0 * 355  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Stout',      'beer', '🍺', 5.000,  355.0, ROUND((5.0  / 100.0 * 355  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Pale Ale',   'beer', '🍺', 5.500,  355.0, ROUND((5.5  / 100.0 * 355  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Sour',       'beer', '🍺', 4.800,  355.0, ROUND((4.8  / 100.0 * 355  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Hefeweizen', 'beer', '🍺', 5.400,  500.0, ROUND((5.4  / 100.0 * 500  * 0.789 / 14)::numeric, 2), 'seed'),

  -- Cocktails
  ('Margarita',        'cocktail', '🍹', 18.000, 120.0, ROUND((18.0 / 100.0 * 120  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Old Fashioned',    'cocktail', '🥃', 32.000,  90.0, ROUND((32.0 / 100.0 *  90  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Negroni',          'cocktail', '🍹', 24.000,  90.0, ROUND((24.0 / 100.0 *  90  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Mojito',           'cocktail', '🍹', 12.000, 200.0, ROUND((12.0 / 100.0 * 200  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Aperol Spritz',    'cocktail', '🍊',  8.000, 200.0, ROUND(( 8.0 / 100.0 * 200  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Espresso Martini', 'cocktail', '🍸', 22.000, 100.0, ROUND((22.0 / 100.0 * 100  * 0.789 / 14)::numeric, 2), 'seed'),

  -- Shots
  ('Tequila Shot', 'shot', '🥃', 40.000, 44.0, ROUND((40.0 / 100.0 *  44  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Whiskey Shot', 'shot', '🥃', 40.000, 44.0, ROUND((40.0 / 100.0 *  44  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Vodka Shot',   'shot', '🥃', 40.000, 44.0, ROUND((40.0 / 100.0 *  44  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Jägerbomb',    'shot', '🖤', 35.000, 44.0, ROUND((35.0 / 100.0 *  44  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Sake Shot',    'shot', '🍶', 15.000, 60.0, ROUND((15.0 / 100.0 *  60  * 0.789 / 14)::numeric, 2), 'seed'),

  -- Wines
  ('Red Wine',   'wine', '🍷', 13.500, 150.0, ROUND((13.5 / 100.0 * 150  * 0.789 / 14)::numeric, 2), 'seed'),
  ('White Wine', 'wine', '🥂', 12.000, 150.0, ROUND((12.0 / 100.0 * 150  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Rosé',       'wine', '🌸', 11.500, 150.0, ROUND((11.5 / 100.0 * 150  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Prosecco',   'wine', '🥂', 11.000, 125.0, ROUND((11.0 / 100.0 * 125  * 0.789 / 14)::numeric, 2), 'seed'),
  ('Champagne',  'wine', '🍾', 12.000, 125.0, ROUND((12.0 / 100.0 * 125  * 0.789 / 14)::numeric, 2), 'seed')
ON CONFLICT DO NOTHING;
