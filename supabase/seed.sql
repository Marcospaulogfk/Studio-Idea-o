-- ============================================================
-- STUDIO IDEAÇÃO — Seed de demonstração
-- ============================================================
-- Popula 18 clientes, 28 leads, 22 vendas, 12 pacotes,
-- 16 produções, ~14 financeiros e 6 pós-vendas com dados
-- realistas espalhados pelos últimos 6 meses.
--
-- Idempotente: pode ser re-executado (ON CONFLICT DO NOTHING).
-- IDs hardcoded com prefixo 'f0000000-...' pra fácil identificação.
-- ============================================================

BEGIN;

-- ============================================================
-- CLIENTES (18 — mix de ativos e inativos)
-- ============================================================
INSERT INTO clients (id, name, phone, cpf_cnpj, address, status, created_at) VALUES
  ('f0000000-0000-0000-0000-000000000101', 'Padaria Pão Quente Ltda',     '(46) 99812-4501', '12.345.678/0001-90', 'Av. Brasil, 1234 — Pato Branco/PR',     'active',   NOW() - INTERVAL '180 days'),
  ('f0000000-0000-0000-0000-000000000102', 'Café da Esquina',              '(46) 99721-3398', '23.456.789/0001-01', 'Rua XV de Novembro, 88 — Pato Branco/PR','active',   NOW() - INTERVAL '165 days'),
  ('f0000000-0000-0000-0000-000000000103', 'Studio Beleza Pura',           '(46) 98876-2210', '34.567.890/0001-12', 'Rua Tocantins, 450 — Pato Branco/PR',    'active',   NOW() - INTERVAL '150 days'),
  ('f0000000-0000-0000-0000-000000000104', 'Restaurante Sabor Caseiro',    '(46) 99654-7733', '45.678.901/0001-23', 'Av. Tupi, 2010 — Pato Branco/PR',        'active',   NOW() - INTERVAL '140 days'),
  ('f0000000-0000-0000-0000-000000000105', 'Clínica Odonto Sorriso',       '(46) 98432-1188', '56.789.012/0001-34', 'Rua Itacolomi, 567 — Pato Branco/PR',    'active',   NOW() - INTERVAL '125 days'),
  ('f0000000-0000-0000-0000-000000000106', 'Pet Shop Amigo Fiel',          '(46) 99977-4421', '67.890.123/0001-45', 'Av. das Indústrias, 980 — Pato Branco/PR','active',  NOW() - INTERVAL '110 days'),
  ('f0000000-0000-0000-0000-000000000107', 'Bella Boutique Modas',         '(46) 99811-6677', '78.901.234/0001-56', 'Shopping Pato Branco — Loja 42',         'active',   NOW() - INTERVAL '95 days'),
  ('f0000000-0000-0000-0000-000000000108', 'Auto Mecânica Veloz',          '(46) 99334-8855', '89.012.345/0001-67', 'BR-158, km 484 — Pato Branco/PR',        'active',   NOW() - INTERVAL '88 days'),
  ('f0000000-0000-0000-0000-000000000109', 'Academia Vital Fitness',       '(46) 99221-9090', '90.123.456/0001-78', 'Rua Caramuru, 1500 — Pato Branco/PR',    'active',   NOW() - INTERVAL '75 days'),
  ('f0000000-0000-0000-0000-000000000110', 'Imobiliária Casa Boa',         '(46) 98712-3456', '01.234.567/0001-89', 'Av. Brasil, 2200 — Pato Branco/PR',      'active',   NOW() - INTERVAL '70 days'),
  ('f0000000-0000-0000-0000-000000000111', 'Salão Glamour',                '(46) 99988-0011', '11.222.333/0001-44', 'Rua Iguaçu, 320 — Pato Branco/PR',       'active',   NOW() - INTERVAL '60 days'),
  ('f0000000-0000-0000-0000-000000000112', 'Barbearia Classe A',           '(46) 99765-4422', NULL,                  'Rua Goiás, 145 — Pato Branco/PR',        'active',   NOW() - INTERVAL '52 days'),
  ('f0000000-0000-0000-0000-000000000113', 'Pizzaria Forno a Lenha',       '(46) 99312-7799', '22.333.444/0001-55', 'Av. Tupi, 3500 — Pato Branco/PR',        'active',   NOW() - INTERVAL '45 days'),
  ('f0000000-0000-0000-0000-000000000114', 'Ótica Visão Clara',            '(46) 98654-1212', '33.444.555/0001-66', 'Rua Argentina, 78 — Pato Branco/PR',     'active',   NOW() - INTERVAL '38 days'),
  ('f0000000-0000-0000-0000-000000000115', 'Buffet Sabor & Arte',          '(46) 99123-3344', '44.555.666/0001-77', 'Rua Paraná, 999 — Pato Branco/PR',       'active',   NOW() - INTERVAL '28 days'),
  ('f0000000-0000-0000-0000-000000000116', 'Farmácia Saúde+',              '(46) 98765-1010', '55.666.777/0001-88', 'Av. Brasil, 850 — Pato Branco/PR',       'active',   NOW() - INTERVAL '20 days'),
  ('f0000000-0000-0000-0000-000000000117', 'Floricultura Jardim Mágico',   '(46) 99554-7788', '66.777.888/0001-99', 'Rua Riachuelo, 222 — Pato Branco/PR',    'inactive', NOW() - INTERVAL '210 days'),
  ('f0000000-0000-0000-0000-000000000118', 'Festas Encanto Eventos',       '(46) 98321-5544', '77.888.999/0001-00', 'Rua Xingu, 410 — Pato Branco/PR',        'inactive', NOW() - INTERVAL '195 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LEADS (28 — distribuídos pelos 5 estágios do funil)
-- ============================================================
INSERT INTO leads (id, name, phone, service, estimated_value, origin, funnel_stage, notes, last_contact, next_followup, created_at) VALUES
  -- new (5)
  ('f0000000-0000-0000-0000-000000000201', 'Lavanderia Limpinho',          '(46) 99811-1101', 'Artes p/ Redes Sociais',   1500, 'instagram',    'new',          'Primeiro contato. Quer fazer redes sociais.',                NOW() - INTERVAL '1 day',  NOW() + INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('f0000000-0000-0000-0000-000000000202', 'Hamburgueria 158',             '(46) 99812-1102', 'Reels / Stories',          2400, 'whatsapp',     'new',          'Indicação do dono da pizzaria. Tem urgência.',               NOW() - INTERVAL '12 hours', NOW() + INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('f0000000-0000-0000-0000-000000000203', 'Estética Natural',             '(46) 99813-1103', 'Material Gráfico',         800,  'web',          'new',          'Veio pelo site. Quer panfletos pra abrir filial.',           NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('f0000000-0000-0000-0000-000000000204', 'Eletro Center',                '(46) 99814-1104', 'Tráfego Pago',             3500, 'paid_traffic', 'new',          'Lead de campanha. Quer impulsionar Meta Ads.',               NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('f0000000-0000-0000-0000-000000000205', 'Doceria Doce Mel',             '(46) 99815-1105', 'Logo / Identidade Visual', 1800, 'referral',     'new',          'Indicação da Padaria Pão Quente. Vai abrir loja.',           NOW() - INTERVAL '5 hours', NOW() + INTERVAL '5 days', NOW() - INTERVAL '6 hours'),

  -- negotiating (8)
  ('f0000000-0000-0000-0000-000000000206', 'Lava-Rápido Bolha Azul',       '(46) 99816-1106', 'Artes p/ Redes Sociais',   2200, 'instagram',    'negotiating',  'Em negociação. Aguardando aprovação do orçamento.',          NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day', NOW() - INTERVAL '8 days'),
  ('f0000000-0000-0000-0000-000000000207', 'Casa de Carnes Bom Boi',       '(46) 99817-1107', 'Vídeo / Motion',           4500, 'whatsapp',     'negotiating',  'Quer vídeo institucional. Perguntou sobre prazo.',           NOW() - INTERVAL '4 days', NOW() + INTERVAL '2 days', NOW() - INTERVAL '12 days'),
  ('f0000000-0000-0000-0000-000000000208', 'Joalheria Brilho Real',        '(46) 99818-1108', 'Logo / Identidade Visual', 3200, 'referral',     'negotiating',  'Refazer marca. Pediu 3 propostas visuais.',                  NOW() - INTERVAL '6 days', NOW() + INTERVAL '1 day', NOW() - INTERVAL '14 days'),
  ('f0000000-0000-0000-0000-000000000209', 'Marmoraria Rocha Forte',       '(46) 99819-1109', 'Artes p/ Redes Sociais',   1500, 'web',          'negotiating',  'Quer pacote de 10 artes/mês.',                               NOW() - INTERVAL '3 days', NOW() + INTERVAL '3 days', NOW() - INTERVAL '10 days'),
  ('f0000000-0000-0000-0000-000000000210', 'Escola de Inglês Talk Now',    '(46) 99820-1110', 'Reels / Stories',          2800, 'instagram',    'negotiating',  'Material p/ matrículas 2026. Aguarda decisão.',              NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', NOW() - INTERVAL '15 days'),
  ('f0000000-0000-0000-0000-000000000211', 'Construtora Solidez',          '(46) 99821-1111', 'Material Gráfico',         5500, 'referral',     'negotiating',  'Material institucional + flyers. Pediu portfólio.',          NOW() - INTERVAL '7 days', NOW() + INTERVAL '1 day', NOW() - INTERVAL '18 days'),
  ('f0000000-0000-0000-0000-000000000212', 'Hotel Recanto Verde',          '(46) 99822-1112', 'Tráfego Pago',             3000, 'paid_traffic', 'negotiating',  'Quer aumentar reservas. Avalia.',                            NOW() - INTERVAL '2 days', NOW() + INTERVAL '4 days', NOW() - INTERVAL '9 days'),
  ('f0000000-0000-0000-0000-000000000213', 'Sapataria Couro Nobre',        '(46) 99823-1113', 'Artes p/ Redes Sociais',   1200, 'whatsapp',     'negotiating',  'Comparando preços com outro estúdio.',                       NOW() - INTERVAL '8 days', NOW() + INTERVAL '1 day', NOW() - INTERVAL '20 days'),

  -- closed (10) — viraram clientes/vendas
  ('f0000000-0000-0000-0000-000000000214', 'Padaria Pão Quente Ltda',      '(46) 99812-4501', 'Artes p/ Redes Sociais',   1500, 'referral',     'closed',       'Fechou pacote 10 artes. Cliente recorrente.',                NOW() - INTERVAL '170 days', NULL, NOW() - INTERVAL '178 days'),
  ('f0000000-0000-0000-0000-000000000215', 'Café da Esquina',              '(46) 99721-3398', 'Logo / Identidade Visual', 2500, 'instagram',    'closed',       'Identidade visual completa.',                                NOW() - INTERVAL '160 days', NULL, NOW() - INTERVAL '168 days'),
  ('f0000000-0000-0000-0000-000000000216', 'Studio Beleza Pura',           '(46) 98876-2210', 'Vídeo / Motion',           3800, 'instagram',    'closed',       'Vídeo institucional + 5 reels.',                             NOW() - INTERVAL '145 days', NULL, NOW() - INTERVAL '152 days'),
  ('f0000000-0000-0000-0000-000000000217', 'Restaurante Sabor Caseiro',    '(46) 99654-7733', 'Artes p/ Redes Sociais',   2200, 'whatsapp',     'closed',       'Pacote 20 artes/mês.',                                       NOW() - INTERVAL '135 days', NULL, NOW() - INTERVAL '142 days'),
  ('f0000000-0000-0000-0000-000000000218', 'Clínica Odonto Sorriso',       '(46) 98432-1188', 'Material Gráfico',         1800, 'web',          'closed',       'Folders + cartões de visita.',                               NOW() - INTERVAL '120 days', NULL, NOW() - INTERVAL '127 days'),
  ('f0000000-0000-0000-0000-000000000219', 'Pet Shop Amigo Fiel',          '(46) 99977-4421', 'Reels / Stories',          1900, 'instagram',    'closed',       'Reels semanais. Renovou contrato.',                          NOW() - INTERVAL '105 days', NULL, NOW() - INTERVAL '112 days'),
  ('f0000000-0000-0000-0000-000000000220', 'Auto Mecânica Veloz',          '(46) 99334-8855', 'Tráfego Pago',             2700, 'paid_traffic', 'closed',       'Campanha Meta Ads. Resultou bem.',                           NOW() - INTERVAL '85 days', NULL, NOW() - INTERVAL '90 days'),
  ('f0000000-0000-0000-0000-000000000221', 'Academia Vital Fitness',       '(46) 99221-9090', 'Artes p/ Redes Sociais',   1500, 'instagram',    'closed',       'Pacote 10 artes.',                                           NOW() - INTERVAL '70 days', NULL, NOW() - INTERVAL '77 days'),
  ('f0000000-0000-0000-0000-000000000222', 'Pizzaria Forno a Lenha',       '(46) 99312-7799', 'Logo / Identidade Visual', 2800, 'referral',     'closed',       'Rebranding completo.',                                       NOW() - INTERVAL '42 days', NULL, NOW() - INTERVAL '48 days'),
  ('f0000000-0000-0000-0000-000000000223', 'Buffet Sabor & Arte',          '(46) 99123-3344', 'Vídeo / Motion',           4200, 'whatsapp',     'closed',       'Vídeo de eventos + reels.',                                  NOW() - INTERVAL '25 days', NULL, NOW() - INTERVAL '31 days'),

  -- disqualified (3)
  ('f0000000-0000-0000-0000-000000000224', 'Fast Food Express',            '(46) 99888-1212', 'Artes p/ Redes Sociais',   500,  'web',          'disqualified', 'Orçamento muito baixo. Não bate com o nosso ticket.',       NOW() - INTERVAL '20 days', NULL, NOW() - INTERVAL '22 days'),
  ('f0000000-0000-0000-0000-000000000225', 'Sebo Livros Velhos',           '(46) 99777-3434', 'Logo / Identidade Visual', 800,  'referral',     'disqualified', 'Cliente não respondeu mais.',                                NOW() - INTERVAL '35 days', NULL, NOW() - INTERVAL '38 days'),
  ('f0000000-0000-0000-0000-000000000226', 'Camping Pôr do Sol',           '(46) 99666-5656', 'Vídeo / Motion',           1000, 'instagram',    'disqualified', 'Sem orçamento neste momento.',                               NOW() - INTERVAL '50 days', NULL, NOW() - INTERVAL '54 days'),

  -- future (2) — remarketing
  ('f0000000-0000-0000-0000-000000000227', 'Boate Lunna Club',             '(46) 99555-7878', 'Reels / Stories',          2100, 'whatsapp',     'future',       'Vai retomar em 2026. Ficar de olho.',                        NOW() - INTERVAL '60 days', NOW() + INTERVAL '90 days', NOW() - INTERVAL '65 days'),
  ('f0000000-0000-0000-0000-000000000228', 'Motel Estrelas',               '(46) 99444-9898', 'Artes p/ Redes Sociais',   1700, 'instagram',    'future',       'Quer começar em janeiro.',                                   NOW() - INTERVAL '40 days', NOW() + INTERVAL '60 days', NOW() - INTERVAL '45 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VENDAS (22 — espalhadas por 6 meses, mix de status)
-- Atenção: trigger on_sale_created cria receivable automático para sales 50%
-- ============================================================
INSERT INTO sales (id, client_id, lead_id, services, description, total_value, origin, payment_status, client_type, paid_traffic, sold_at, created_at) VALUES
  -- Padaria — recorrente, várias vendas
  ('f0000000-0000-0000-0000-000000000301', 'f0000000-0000-0000-0000-000000000101', 'f0000000-0000-0000-0000-000000000214', ARRAY['Artes p/ Redes Sociais'],                          'Pacote 10 artes — primeiro mês',          1500.00, 'referral',     '100%',    'new',       false, NOW() - INTERVAL '170 days', NOW() - INTERVAL '170 days'),
  ('f0000000-0000-0000-0000-000000000302', 'f0000000-0000-0000-0000-000000000101', NULL,                                    ARRAY['Artes p/ Redes Sociais', 'Reels / Stories'],         'Pacote 10 artes + 4 reels',                2200.00, 'referral',     '100%',    'returning', false, NOW() - INTERVAL '110 days', NOW() - INTERVAL '110 days'),
  ('f0000000-0000-0000-0000-000000000303', 'f0000000-0000-0000-0000-000000000101', NULL,                                    ARRAY['Artes p/ Redes Sociais'],                          'Renovação pacote 10 artes',                1500.00, 'referral',     '50%',     'returning', false, NOW() - INTERVAL '50 days',  NOW() - INTERVAL '50 days'),

  -- Café da Esquina
  ('f0000000-0000-0000-0000-000000000304', 'f0000000-0000-0000-0000-000000000102', 'f0000000-0000-0000-0000-000000000215', ARRAY['Logo / Identidade Visual'],                        'Rebranding completo + manual de marca',    2500.00, 'instagram',    '100%',    'new',       false, NOW() - INTERVAL '160 days', NOW() - INTERVAL '160 days'),
  ('f0000000-0000-0000-0000-000000000305', 'f0000000-0000-0000-0000-000000000102', NULL,                                    ARRAY['Artes p/ Redes Sociais'],                          'Pacote 20 artes',                          2800.00, 'instagram',    '100%',    'returning', false, NOW() - INTERVAL '95 days',  NOW() - INTERVAL '95 days'),

  -- Studio Beleza Pura
  ('f0000000-0000-0000-0000-000000000306', 'f0000000-0000-0000-0000-000000000103', 'f0000000-0000-0000-0000-000000000216', ARRAY['Vídeo / Motion', 'Reels / Stories'],               'Vídeo institucional + 5 reels',            3800.00, 'instagram',    '100%',    'new',       true,  NOW() - INTERVAL '145 days', NOW() - INTERVAL '145 days'),
  ('f0000000-0000-0000-0000-000000000307', 'f0000000-0000-0000-0000-000000000103', NULL,                                    ARRAY['Artes p/ Redes Sociais'],                          'Pacote 10 artes mensal',                   1500.00, 'instagram',    '100%',    'returning', false, NOW() - INTERVAL '85 days',  NOW() - INTERVAL '85 days'),

  -- Restaurante Sabor Caseiro
  ('f0000000-0000-0000-0000-000000000308', 'f0000000-0000-0000-0000-000000000104', 'f0000000-0000-0000-0000-000000000217', ARRAY['Artes p/ Redes Sociais'],                          'Pacote 20 artes/mês',                      2200.00, 'whatsapp',     '100%',    'new',       false, NOW() - INTERVAL '135 days', NOW() - INTERVAL '135 days'),
  ('f0000000-0000-0000-0000-000000000309', 'f0000000-0000-0000-0000-000000000104', NULL,                                    ARRAY['Material Gráfico'],                                'Cardápios novos + flyers',                 980.00,  'whatsapp',     '100%',    'returning', false, NOW() - INTERVAL '60 days',  NOW() - INTERVAL '60 days'),

  -- Clínica Odonto Sorriso
  ('f0000000-0000-0000-0000-000000000310', 'f0000000-0000-0000-0000-000000000105', 'f0000000-0000-0000-0000-000000000218', ARRAY['Material Gráfico', 'Logo / Identidade Visual'],     'Folders + cartões + ajustes na marca',     1800.00, 'web',          '100%',    'new',       false, NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days'),

  -- Pet Shop Amigo Fiel
  ('f0000000-0000-0000-0000-000000000311', 'f0000000-0000-0000-0000-000000000106', 'f0000000-0000-0000-0000-000000000219', ARRAY['Reels / Stories'],                                 'Reels semanais — 8 entregas',              1900.00, 'instagram',    '100%',    'new',       false, NOW() - INTERVAL '105 days', NOW() - INTERVAL '105 days'),
  ('f0000000-0000-0000-0000-000000000312', 'f0000000-0000-0000-0000-000000000106', NULL,                                    ARRAY['Reels / Stories', 'Tráfego Pago'],                 'Reels + impulsionamento',                  2700.00, 'instagram',    '50%',     'returning', true,  NOW() - INTERVAL '15 days',  NOW() - INTERVAL '15 days'),

  -- Bella Boutique
  ('f0000000-0000-0000-0000-000000000313', 'f0000000-0000-0000-0000-000000000107', NULL,                                    ARRAY['Artes p/ Redes Sociais'],                          'Pacote 10 artes',                          1500.00, 'instagram',    '100%',    'new',       false, NOW() - INTERVAL '90 days',  NOW() - INTERVAL '90 days'),

  -- Auto Mecânica Veloz
  ('f0000000-0000-0000-0000-000000000314', 'f0000000-0000-0000-0000-000000000108', 'f0000000-0000-0000-0000-000000000220', ARRAY['Tráfego Pago'],                                    'Campanha Meta Ads — 30 dias',              2700.00, 'paid_traffic', '100%',    'new',       true,  NOW() - INTERVAL '85 days',  NOW() - INTERVAL '85 days'),

  -- Academia Vital Fitness
  ('f0000000-0000-0000-0000-000000000315', 'f0000000-0000-0000-0000-000000000109', 'f0000000-0000-0000-0000-000000000221', ARRAY['Artes p/ Redes Sociais'],                          'Pacote 10 artes',                          1500.00, 'instagram',    '100%',    'new',       false, NOW() - INTERVAL '70 days',  NOW() - INTERVAL '70 days'),
  ('f0000000-0000-0000-0000-000000000316', 'f0000000-0000-0000-0000-000000000109', NULL,                                    ARRAY['Reels / Stories'],                                 'Reels p/ campanha verão',                  1600.00, 'instagram',    'pending', 'returning', false, NOW() - INTERVAL '8 days',   NOW() - INTERVAL '8 days'),

  -- Imobiliária Casa Boa
  ('f0000000-0000-0000-0000-000000000317', 'f0000000-0000-0000-0000-000000000110', NULL,                                    ARRAY['Artes p/ Redes Sociais', 'Vídeo / Motion'],         'Pacote 20 artes + 2 vídeos curtos',        3500.00, 'web',          '100%',    'new',       false, NOW() - INTERVAL '65 days',  NOW() - INTERVAL '65 days'),

  -- Pizzaria Forno a Lenha
  ('f0000000-0000-0000-0000-000000000318', 'f0000000-0000-0000-0000-000000000113', 'f0000000-0000-0000-0000-000000000222', ARRAY['Logo / Identidade Visual', 'Material Gráfico'],     'Rebranding + cardápios',                   2800.00, 'referral',     '100%',    'new',       false, NOW() - INTERVAL '42 days',  NOW() - INTERVAL '42 days'),

  -- Ótica Visão Clara
  ('f0000000-0000-0000-0000-000000000319', 'f0000000-0000-0000-0000-000000000114', NULL,                                    ARRAY['Artes p/ Redes Sociais'],                          'Pacote 10 artes',                          1500.00, 'instagram',    '50%',     'new',       false, NOW() - INTERVAL '20 days',  NOW() - INTERVAL '20 days'),

  -- Buffet Sabor & Arte
  ('f0000000-0000-0000-0000-000000000320', 'f0000000-0000-0000-0000-000000000115', 'f0000000-0000-0000-0000-000000000223', ARRAY['Vídeo / Motion', 'Reels / Stories'],               'Vídeo de eventos + 6 reels',               4200.00, 'whatsapp',     '50%',     'new',       false, NOW() - INTERVAL '25 days',  NOW() - INTERVAL '25 days'),

  -- Farmácia Saúde+ — venda muito recente (aparece no dashboard)
  ('f0000000-0000-0000-0000-000000000321', 'f0000000-0000-0000-0000-000000000116', NULL,                                    ARRAY['Artes p/ Redes Sociais'],                          'Pacote 20 artes — campanha vacinação',     2400.00, 'whatsapp',     '50%',     'new',       false, NOW() - INTERVAL '5 days',   NOW() - INTERVAL '5 days'),

  -- Salão Glamour — venda hoje
  ('f0000000-0000-0000-0000-000000000322', 'f0000000-0000-0000-0000-000000000111', NULL,                                    ARRAY['Logo / Identidade Visual'],                        'Identidade visual + assinatura digital',   2200.00, 'instagram',    '100%',    'new',       false, NOW() - INTERVAL '1 day',    NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PACOTES (12 — vencimento de 60 dias contado de activated_at)
-- Atenção: trigger set_package_expiry calcula expires_at = activated_at + 60 dias
--          trigger on_package_inserted cria notification automática
-- ============================================================
INSERT INTO packages (id, sale_id, client_id, model, arts_total, arts_used, activated_at, status) VALUES
  -- Padaria — pacote ativo recente (50 dias restantes)
  ('f0000000-0000-0000-0000-000000000401', 'f0000000-0000-0000-0000-000000000303', 'f0000000-0000-0000-0000-000000000101', '10', 10,  3,  NOW() - INTERVAL '10 days', 'active'),

  -- Café da Esquina — pacote ativo (vence em 25 dias)
  ('f0000000-0000-0000-0000-000000000402', 'f0000000-0000-0000-0000-000000000305', 'f0000000-0000-0000-0000-000000000102', '20', 20,  12, NOW() - INTERVAL '35 days', 'active'),

  -- Studio Beleza — pacote ativo (vence em 35 dias)
  ('f0000000-0000-0000-0000-000000000403', 'f0000000-0000-0000-0000-000000000307', 'f0000000-0000-0000-0000-000000000103', '10', 10,  6,  NOW() - INTERVAL '25 days', 'active'),

  -- Restaurante — pacote VENCENDO em 5 dias (alerta vermelho!)
  ('f0000000-0000-0000-0000-000000000404', 'f0000000-0000-0000-0000-000000000308', 'f0000000-0000-0000-0000-000000000104', '20', 20,  18, NOW() - INTERVAL '55 days', 'active'),

  -- Pet Shop — vencendo em 12 dias (alerta amarelo)
  ('f0000000-0000-0000-0000-000000000405', 'f0000000-0000-0000-0000-000000000311', 'f0000000-0000-0000-0000-000000000106', 'custom', 8, 5, NOW() - INTERVAL '48 days', 'active'),

  -- Bella Boutique — pacote ativo (vence em 40 dias)
  ('f0000000-0000-0000-0000-000000000406', 'f0000000-0000-0000-0000-000000000313', 'f0000000-0000-0000-0000-000000000107', '10', 10,  4,  NOW() - INTERVAL '20 days', 'active'),

  -- Academia Vital — pacote ativo recente
  ('f0000000-0000-0000-0000-000000000407', 'f0000000-0000-0000-0000-000000000315', 'f0000000-0000-0000-0000-000000000109', '10', 10,  2,  NOW() - INTERVAL '5 days',  'active'),

  -- Imobiliária — pacote ativo
  ('f0000000-0000-0000-0000-000000000408', 'f0000000-0000-0000-0000-000000000317', 'f0000000-0000-0000-0000-000000000110', '20', 20,  9,  NOW() - INTERVAL '30 days', 'active'),

  -- Pet Shop reels — pacote 50% (recente)
  ('f0000000-0000-0000-0000-000000000409', 'f0000000-0000-0000-0000-000000000312', 'f0000000-0000-0000-0000-000000000106', 'custom', 6, 0, NOW() - INTERVAL '15 days', 'active'),

  -- Buffet — pacote ativo recente
  ('f0000000-0000-0000-0000-000000000410', 'f0000000-0000-0000-0000-000000000320', 'f0000000-0000-0000-0000-000000000115', 'custom', 6, 1, NOW() - INTERVAL '20 days', 'active'),

  -- Farmácia — pacote ativo super recente
  ('f0000000-0000-0000-0000-000000000411', 'f0000000-0000-0000-0000-000000000321', 'f0000000-0000-0000-0000-000000000116', '20', 20,  0,  NOW() - INTERVAL '5 days',  'active'),

  -- Pacote EXPIRADO (Padaria, primeiro pacote)
  ('f0000000-0000-0000-0000-000000000412', 'f0000000-0000-0000-0000-000000000301', 'f0000000-0000-0000-0000-000000000101', '10', 10, 10, NOW() - INTERVAL '170 days', 'expired')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRODUÇÕES (16 — Kanban: 5 queue, 5 in_progress, 6 done)
-- ============================================================
INSERT INTO productions (id, package_id, sale_id, client_id, title, status, queue_position, started_at, finished_at, notes, created_at) VALUES
  -- QUEUE (5)
  ('f0000000-0000-0000-0000-000000000501', 'f0000000-0000-0000-0000-000000000402', 'f0000000-0000-0000-0000-000000000305', 'f0000000-0000-0000-0000-000000000102', 'Posts especiais Dia das Mães',          'queue',       1, NULL, NULL, 'Cliente pediu paleta pastel.',                NOW() - INTERVAL '2 days'),
  ('f0000000-0000-0000-0000-000000000502', 'f0000000-0000-0000-0000-000000000404', 'f0000000-0000-0000-0000-000000000308', 'f0000000-0000-0000-0000-000000000104', 'Cardápio digital atualizado',           'queue',       2, NULL, NULL, 'URGENTE — pacote vence em 5 dias.',           NOW() - INTERVAL '1 day'),
  ('f0000000-0000-0000-0000-000000000503', 'f0000000-0000-0000-0000-000000000406', 'f0000000-0000-0000-0000-000000000313', 'f0000000-0000-0000-0000-000000000107', 'Coleção Outono — 6 posts',              'queue',       3, NULL, NULL, NULL,                                          NOW() - INTERVAL '12 hours'),
  ('f0000000-0000-0000-0000-000000000504', 'f0000000-0000-0000-0000-000000000408', 'f0000000-0000-0000-0000-000000000317', 'f0000000-0000-0000-0000-000000000110', 'Vídeos de imóveis — apto centro',       'queue',       4, NULL, NULL, 'Receber fotos do imóvel via WhatsApp.',       NOW() - INTERVAL '8 hours'),
  ('f0000000-0000-0000-0000-000000000505', 'f0000000-0000-0000-0000-000000000411', 'f0000000-0000-0000-0000-000000000321', 'f0000000-0000-0000-0000-000000000116', 'Campanha Vacinação Antigripal',         'queue',       5, NULL, NULL, 'Briefing aprovado.',                          NOW() - INTERVAL '3 hours'),

  -- IN PROGRESS (5)
  ('f0000000-0000-0000-0000-000000000506', 'f0000000-0000-0000-0000-000000000401', 'f0000000-0000-0000-0000-000000000303', 'f0000000-0000-0000-0000-000000000101', 'Posts Pão Italiano — 5 artes',          'in_progress', 1, NOW() - INTERVAL '1 day', NULL,    'Em revisão final.',                           NOW() - INTERVAL '3 days'),
  ('f0000000-0000-0000-0000-000000000507', 'f0000000-0000-0000-0000-000000000403', 'f0000000-0000-0000-0000-000000000307', 'f0000000-0000-0000-0000-000000000103', 'Reels antes/depois — 3 clientes',       'in_progress', 2, NOW() - INTERVAL '2 days', NULL,    'Editando vídeos.',                            NOW() - INTERVAL '4 days'),
  ('f0000000-0000-0000-0000-000000000508', 'f0000000-0000-0000-0000-000000000405', 'f0000000-0000-0000-0000-000000000311', 'f0000000-0000-0000-0000-000000000106', 'Reels banho & tosa promocional',        'in_progress', 3, NOW() - INTERVAL '6 hours', NULL,   'Aguardando trilha sonora.',                   NOW() - INTERVAL '2 days'),
  ('f0000000-0000-0000-0000-000000000509', 'f0000000-0000-0000-0000-000000000409', 'f0000000-0000-0000-0000-000000000312', 'f0000000-0000-0000-0000-000000000106', 'Reel adoção — campanha sábado',         'in_progress', 4, NOW() - INTERVAL '12 hours', NULL,  NULL,                                          NOW() - INTERVAL '1 day'),
  ('f0000000-0000-0000-0000-000000000510', 'f0000000-0000-0000-0000-000000000407', 'f0000000-0000-0000-0000-000000000315', 'f0000000-0000-0000-0000-000000000109', 'Posts plano anual — campanha matrículas','in_progress', 5, NOW() - INTERVAL '4 hours', NULL,   'Esperando aprovação do gerente.',             NOW() - INTERVAL '20 hours'),

  -- DONE (6)
  ('f0000000-0000-0000-0000-000000000511', 'f0000000-0000-0000-0000-000000000401', 'f0000000-0000-0000-0000-000000000303', 'f0000000-0000-0000-0000-000000000101', 'Post de aniversário 15 anos',           'done',        1, NOW() - INTERVAL '8 days',  NOW() - INTERVAL '6 days', 'Cliente aprovou de primeira.',         NOW() - INTERVAL '10 days'),
  ('f0000000-0000-0000-0000-000000000512', 'f0000000-0000-0000-0000-000000000402', 'f0000000-0000-0000-0000-000000000305', 'f0000000-0000-0000-0000-000000000102', 'Identidade visual completa',            'done',        2, NOW() - INTERVAL '155 days',NOW() - INTERVAL '150 days','Manual de marca entregue em PDF.',     NOW() - INTERVAL '160 days'),
  ('f0000000-0000-0000-0000-000000000513', 'f0000000-0000-0000-0000-000000000403', 'f0000000-0000-0000-0000-000000000307', 'f0000000-0000-0000-0000-000000000103', 'Reels mensal — março',                  'done',        3, NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days','Engajamento subiu 38%.',               NOW() - INTERVAL '22 days'),
  ('f0000000-0000-0000-0000-000000000514', 'f0000000-0000-0000-0000-000000000406', 'f0000000-0000-0000-0000-000000000313', 'f0000000-0000-0000-0000-000000000107', 'Coleção Verão — 8 posts',               'done',        4, NOW() - INTERVAL '12 days', NOW() - INTERVAL '8 days', NULL,                                    NOW() - INTERVAL '15 days'),
  ('f0000000-0000-0000-0000-000000000515', 'f0000000-0000-0000-0000-000000000405', 'f0000000-0000-0000-0000-000000000311', 'f0000000-0000-0000-0000-000000000106', 'Stories enquetes — 4 entregas',         'done',        5, NOW() - INTERVAL '5 days',  NOW() - INTERVAL '3 days', 'Cliente quer manter ritmo semanal.',   NOW() - INTERVAL '7 days'),
  ('f0000000-0000-0000-0000-000000000516', 'f0000000-0000-0000-0000-000000000410', 'f0000000-0000-0000-0000-000000000320', 'f0000000-0000-0000-0000-000000000115', 'Vídeo institucional 2 minutos',         'done',        6, NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days','Cliente queria refazer trilha. Resolvido.', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FINANCEIRO — payables manuais
-- (receivables são auto-criados pelo trigger on_sale_created para sales 50%)
-- ============================================================
INSERT INTO financials (id, type, sale_id, description, amount, category, due_date, paid_at, payment_method, status, created_at) VALUES
  -- Payables recorrentes
  ('f0000000-0000-0000-0000-000000000601', 'payable', NULL, 'Aluguel sala comercial — abril/2026',          1800.00, 'rent',      (NOW() + INTERVAL '4 days')::DATE,  NULL,                       'pix',    'pending', NOW() - INTERVAL '5 days'),
  ('f0000000-0000-0000-0000-000000000602', 'payable', NULL, 'Aluguel sala comercial — março/2026',          1800.00, 'rent',      (NOW() - INTERVAL '26 days')::DATE, NOW() - INTERVAL '24 days', 'pix',    'paid',    NOW() - INTERVAL '35 days'),
  ('f0000000-0000-0000-0000-000000000603', 'payable', NULL, 'Adobe Creative Cloud — anual',                 2400.00, 'tools',     (NOW() - INTERVAL '40 days')::DATE, NOW() - INTERVAL '40 days', 'card',   'paid',    NOW() - INTERVAL '45 days'),
  ('f0000000-0000-0000-0000-000000000604', 'payable', NULL, 'Figma Professional — mensal',                  120.00,  'tools',     (NOW() - INTERVAL '15 days')::DATE, NOW() - INTERVAL '15 days', 'card',   'paid',    NOW() - INTERVAL '20 days'),
  ('f0000000-0000-0000-0000-000000000605', 'payable', NULL, 'Meta Ads — campanha Auto Veloz',               1500.00, 'ads',       (NOW() - INTERVAL '85 days')::DATE, NOW() - INTERVAL '83 days', 'card',   'paid',    NOW() - INTERVAL '90 days'),
  ('f0000000-0000-0000-0000-000000000606', 'payable', NULL, 'Energia elétrica',                              280.00,  'other',     (NOW() + INTERVAL '8 days')::DATE,  NULL,                       'boleto', 'pending', NOW() - INTERVAL '5 days'),
  ('f0000000-0000-0000-0000-000000000607', 'payable', NULL, 'Internet fibra — abril',                        180.00,  'other',     (NOW() - INTERVAL '3 days')::DATE,  NULL,                       'boleto', 'overdue', NOW() - INTERVAL '15 days'),
  ('f0000000-0000-0000-0000-000000000608', 'payable', NULL, 'Pró-labore Jonathan — março',                  4500.00, 'personal',  (NOW() - INTERVAL '28 days')::DATE, NOW() - INTERVAL '26 days', 'pix',    'paid',    NOW() - INTERVAL '32 days'),
  ('f0000000-0000-0000-0000-000000000609', 'payable', NULL, 'DAS MEI — março',                              68.50,   'taxes',     (NOW() - INTERVAL '8 days')::DATE,  NOW() - INTERVAL '6 days',  'pix',    'paid',    NOW() - INTERVAL '12 days'),
  ('f0000000-0000-0000-0000-000000000610', 'payable', NULL, 'DAS MEI — abril',                              68.50,   'taxes',     (NOW() + INTERVAL '22 days')::DATE, NULL,                       NULL,     'pending', NOW() - INTERVAL '2 days'),
  ('f0000000-0000-0000-0000-000000000611', 'payable', NULL, 'Hospedagem servidor + domínio',                 240.00,  'tools',     (NOW() + INTERVAL '15 days')::DATE, NULL,                       NULL,     'pending', NOW() - INTERVAL '5 days'),

  -- Receivables manuais (sales 100% que tiveram parcela depois OU vendas pending)
  ('f0000000-0000-0000-0000-000000000620', 'receivable', 'f0000000-0000-0000-0000-000000000316', 'Saldo Academia Vital — Reels verão', 1600.00, 'other', (NOW() + INTERVAL '7 days')::DATE,  NULL, NULL, 'pending', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PÓS-VENDA (6 — alguns contatados com NPS, alguns pendentes)
-- ============================================================
INSERT INTO aftersales (id, client_id, sale_id, production_id, nps_score, feedback, upsell_interest, next_contact, contacted, created_at) VALUES
  ('f0000000-0000-0000-0000-000000000701', 'f0000000-0000-0000-0000-000000000101', 'f0000000-0000-0000-0000-000000000301', 'f0000000-0000-0000-0000-000000000511', 5, 'Adoramos o trabalho! Queremos manter o ritmo.',                          ARRAY['Reels / Stories'],                              (NOW() + INTERVAL '20 days')::DATE, true,  NOW() - INTERVAL '5 days'),
  ('f0000000-0000-0000-0000-000000000702', 'f0000000-0000-0000-0000-000000000102', 'f0000000-0000-0000-0000-000000000304', 'f0000000-0000-0000-0000-000000000512', 5, 'Identidade ficou linda. Pretendemos abrir filial e queremos manter vocês.', ARRAY['Material Gráfico', 'Reels / Stories'],          (NOW() + INTERVAL '30 days')::DATE, true,  NOW() - INTERVAL '148 days'),
  ('f0000000-0000-0000-0000-000000000703', 'f0000000-0000-0000-0000-000000000103', 'f0000000-0000-0000-0000-000000000307', 'f0000000-0000-0000-0000-000000000513', 4, 'Ótimo trabalho. Engajamento melhorou muito.',                            ARRAY['Tráfego Pago'],                                 (NOW() + INTERVAL '10 days')::DATE, true,  NOW() - INTERVAL '14 days'),
  ('f0000000-0000-0000-0000-000000000704', 'f0000000-0000-0000-0000-000000000107', 'f0000000-0000-0000-0000-000000000313', 'f0000000-0000-0000-0000-000000000514', NULL, NULL, NULL, NULL, false, NOW() - INTERVAL '7 days'),
  ('f0000000-0000-0000-0000-000000000705', 'f0000000-0000-0000-0000-000000000106', 'f0000000-0000-0000-0000-000000000311', 'f0000000-0000-0000-0000-000000000515', NULL, NULL, NULL, NULL, false, NOW() - INTERVAL '2 days'),
  ('f0000000-0000-0000-0000-000000000706', 'f0000000-0000-0000-0000-000000000115', 'f0000000-0000-0000-0000-000000000320', 'f0000000-0000-0000-0000-000000000516', 5, 'Vídeo ficou impecável! Vamos contratar mais coisas.',                    ARRAY['Vídeo / Motion', 'Artes p/ Redes Sociais'],     (NOW() + INTERVAL '15 days')::DATE, true,  NOW() - INTERVAL '9 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================
-- Resumo: rode os SELECT abaixo para conferir
-- ============================================================
-- SELECT COUNT(*) AS clients FROM clients;
-- SELECT COUNT(*) AS leads FROM leads;
-- SELECT COUNT(*) AS sales FROM sales;
-- SELECT COUNT(*) AS packages FROM packages WHERE status='active';
-- SELECT COUNT(*) AS productions FROM productions GROUP BY status;
-- SELECT COUNT(*) AS financials FROM financials;
-- SELECT COUNT(*) AS aftersales FROM aftersales;
