-- Coach Matchmaking Platform - Seed Data
-- Run this in your Supabase SQL Editor after running schema.sql

-- ============================================
-- COACHES (30 realistic coaches)
-- ============================================

INSERT INTO public.coaches (name, age, nationality, role_current, club_current, preferred_style, pressing_intensity, build_preference, leadership_style, wage_expectation, staff_cost_estimate, available_status, reputation_tier, league_experience) VALUES

-- Available / High-profile
('Thomas Kessler', 48, 'German', 'Unemployed', NULL, 'Gegenpressing', 'Very High', 'Build from back', 'Demanding', '£7m - £12m/yr', '£5m - £10m', 'Available', 'World-class', '{"Premier League","Bundesliga","Champions League"}'),

('Marco Valenti', 52, 'Italian', 'Unemployed', NULL, 'Possession-based', 'Medium', 'Short passing', 'Strategic', '£4m - £7m/yr', '£2m - £5m', 'Available', 'Elite', '{"Serie A","La Liga","Champions League"}'),

('Carlos Mendes', 45, 'Portuguese', 'Unemployed', NULL, 'Counter-attacking', 'High', 'Mixed', 'Motivator', '£4m - £7m/yr', '£2m - £5m', 'Available', 'Elite', '{"Primeira Liga","Premier League","Ligue 1"}'),

('Erik Lindqvist', 41, 'Swedish', 'Unemployed', NULL, 'High press', 'Very High', 'Build from back', 'Developer', '£1m - £2m/yr', '£500k - £1m', 'Available', 'Emerging', '{"Allsvenskan","Eredivisie"}'),

('David O''Brien', 50, 'Irish', 'Unemployed', NULL, 'Direct', 'High', 'Direct play', 'Pragmatic', '£500k - £1m/yr', 'Under £500k', 'Available', 'Established', '{"Championship","League One"}'),

-- Open to offers
('Javier Ruiz', 55, 'Spanish', 'Head Coach', 'Real Sociedad B', 'Tiki-taka', 'High', 'Short passing', 'Educator', '£2m - £4m/yr', '£1m - £2m', 'Open to offers', 'Established', '{"La Liga","Segunda Division"}'),

('Ralf Schneider', 47, 'German', 'Head Coach', 'Holstein Kiel', 'Gegenpressing', 'Very High', 'Possession play', 'Demanding', '£2m - £4m/yr', '£1m - £2m', 'Open to offers', 'Established', '{"Bundesliga","2. Bundesliga"}'),

('Andre Silva', 43, 'Brazilian', 'Head Coach', 'Botafogo', 'Possession-based', 'Medium', 'Build from back', 'Visionary', '£2m - £4m/yr', '£1m - £2m', 'Open to offers', 'Emerging', '{"Brasileirao","MLS"}'),

('James Fletcher', 39, 'English', 'Head Coach', 'Bristol City', 'Balanced', 'Medium', 'Mixed', 'Motivator', '£1m - £2m/yr', '£500k - £1m', 'Open to offers', 'Emerging', '{"Championship","League One"}'),

('Niko Papadopoulos', 44, 'Greek', 'Head Coach', 'AEK Athens', 'Counter-attacking', 'Medium', 'Direct play', 'Authoritarian', '£1m - £2m/yr', '£500k - £1m', 'Open to offers', 'Established', '{"Super League Greece","Conference League"}'),

-- Under contract - interested
('Pierre Dubois', 51, 'French', 'Head Coach', 'RC Lens', 'High press', 'Very High', 'Build from back', 'Strategic', '£4m - £7m/yr', '£2m - £5m', 'Under contract - interested', 'Elite', '{"Ligue 1","Bundesliga","Europa League"}'),

('Sven Eriksen', 46, 'Norwegian', 'Head Coach', 'Bodo/Glimt', 'Possession-based', 'High', 'Possession play', 'Developer', '£1m - £2m/yr', '£500k - £1m', 'Under contract - interested', 'Emerging', '{"Eliteserien","Conference League"}'),

('Antonio Ferrara', 49, 'Italian', 'Head Coach', 'Torino', 'Defensive', 'Low', 'Mixed', 'Pragmatic', '£2m - £4m/yr', '£1m - £2m', 'Under contract - interested', 'Established', '{"Serie A","Serie B"}'),

('Lukas Hofer', 42, 'Austrian', 'Head Coach', 'RB Salzburg', 'Gegenpressing', 'Very High', 'Build from back', 'Developer', '£2m - £4m/yr', '£1m - £2m', 'Under contract - interested', 'Established', '{"Austrian Bundesliga","Champions League"}'),

('Kenji Tanaka', 50, 'Japanese', 'Head Coach', 'Yokohama F. Marinos', 'Possession-based', 'High', 'Short passing', 'Patient', '£1m - £2m/yr', '£500k - £1m', 'Under contract - interested', 'Emerging', '{"J-League","AFC Champions League"}'),

-- Under contract
('Henrik Larsen', 53, 'Danish', 'Head Coach', 'FC Copenhagen', 'Balanced', 'Medium', 'Mixed', 'Strategic', '£2m - £4m/yr', '£1m - £2m', 'Under contract', 'Established', '{"Danish Superliga","Champions League","Europa League"}'),

('Roberto Mancini Jr', 44, 'Italian', 'Head Coach', 'Fiorentina', 'Possession-based', 'Medium', 'Build from back', 'Strategic', '£4m - £7m/yr', '£2m - £5m', 'Under contract', 'Elite', '{"Serie A","Europa League"}'),

('Manuel Ortega', 56, 'Argentine', 'Head Coach', 'River Plate', 'High press', 'High', 'Possession play', 'Authoritarian', '£2m - £4m/yr', '£1m - £2m', 'Under contract', 'Elite', '{"Liga Profesional","Copa Libertadores"}'),

('Stefan Voss', 38, 'German', 'Head Coach', 'Freiburg', 'Balanced', 'High', 'Build from back', 'Developer', '£2m - £4m/yr', '£1m - £2m', 'Under contract', 'Established', '{"Bundesliga","Europa League"}'),

('Park Jin-ho', 47, 'South Korean', 'Head Coach', 'Jeonbuk Motors', 'Counter-attacking', 'Medium', 'Mixed', 'Motivator', '£500k - £1m/yr', 'Under £500k', 'Under contract', 'Emerging', '{"K-League","AFC Champions League"}'),

-- More available coaches (diverse profiles)
('Wayne Hartley', 54, 'English', 'Unemployed', NULL, 'Direct', 'Medium', 'Long ball', 'Motivator', '£1m - £2m/yr', '£500k - £1m', 'Available', 'Established', '{"Premier League","Championship"}'),

('Rachid Benali', 46, 'Moroccan', 'Unemployed', NULL, 'Counter-attacking', 'High', 'Direct play', 'Strategic', '£1m - £2m/yr', '£500k - £1m', 'Available', 'Emerging', '{"Botola Pro","Ligue 1"}'),

('Fabio Santos', 40, 'Brazilian', 'Unemployed', NULL, 'Tiki-taka', 'Medium', 'Short passing', 'Visionary', '£2m - £4m/yr', '£1m - £2m', 'Available', 'Emerging', '{"Brasileirao","MLS","Eredivisie"}'),

('Ian McAllister', 58, 'Scottish', 'Unemployed', NULL, 'Low block', 'Very Low', 'Long ball', 'Pragmatic', '£500k - £1m/yr', 'Under £500k', 'Available', 'Established', '{"Scottish Premiership","Championship"}'),

('Youssef El-Masri', 43, 'Egyptian', 'Unemployed', NULL, 'High press', 'High', 'Build from back', 'Collaborative', '£1m - £2m/yr', '£500k - £1m', 'Available', 'Emerging', '{"Egyptian Premier League","Saudi Pro League"}'),

('Viktor Petrov', 49, 'Bulgarian', 'Unemployed', NULL, 'Defensive', 'Low', 'Direct play', 'Authoritarian', '£500k - £1m/yr', 'Under £500k', 'Available', 'Established', '{"First Professional League","Super Lig"}'),

('Tom Williams', 36, 'Welsh', 'Assistant Coach', NULL, 'Possession-based', 'High', 'Build from back', 'Developer', 'Under £500k/yr', 'Under £500k', 'Available', 'Emerging', '{"Championship","League One"}'),

('Lars Andersen', 44, 'Danish', 'Unemployed', NULL, 'Gegenpressing', 'Very High', 'Possession play', 'Demanding', '£1m - £2m/yr', '£500k - £1m', 'Open to offers', 'Emerging', '{"Danish Superliga","Eredivisie"}'),

('Miguel Torres', 51, 'Mexican', 'Unemployed', NULL, 'Counter-attacking', 'Medium', 'Mixed', 'Collaborative', '£1m - £2m/yr', '£500k - £1m', 'Available', 'Established', '{"Liga MX","MLS"}'),

('Aleksandar Petrovic', 47, 'Serbian', 'Unemployed', NULL, 'Balanced', 'Medium', 'Balanced', 'Strategic', '£1m - £2m/yr', '£500k - £1m', 'Available', 'Established', '{"Serbian SuperLiga","Super Lig","Eredivisie"}');


-- ============================================
-- COACH UPDATES (Intelligence Feed Entries)
-- ============================================

INSERT INTO public.coach_updates (coach_id, update_note, update_type, date_added) VALUES

-- Use subqueries to get coach IDs by name
((SELECT id FROM public.coaches WHERE name = 'Thomas Kessler'), 'Sacked after a run of 5 defeats in 8 matches. Club cited tactical disagreements with the board. Expected to take a short break before considering offers.', 'sacking', NOW() - INTERVAL '2 days'),

((SELECT id FROM public.coaches WHERE name = 'Thomas Kessler'), 'Reportedly turned down an approach from a Saudi Pro League club. Keen to return to a top European league.', 'availability', NOW() - INTERVAL '1 day'),

((SELECT id FROM public.coaches WHERE name = 'Marco Valenti'), 'Left his previous role by mutual consent after a disagreement over transfer policy. Available immediately and seeking a project with full sporting control.', 'sacking', NOW() - INTERVAL '5 days'),

((SELECT id FROM public.coaches WHERE name = 'Carlos Mendes'), 'Contract expired at the end of last season. Has been linked with several Championship clubs and one Premier League side.', 'contract', NOW() - INTERVAL '3 days'),

((SELECT id FROM public.coaches WHERE name = 'Pierre Dubois'), 'Strong start to the season with Lens sitting 4th in Ligue 1. However, sources indicate he is frustrated by lack of transfer investment. Release clause of €5m in his contract.', 'contract', NOW() - INTERVAL '1 day'),

((SELECT id FROM public.coaches WHERE name = 'Pierre Dubois'), 'Reportedly held informal discussions with a Premier League club. Lens have publicly stated he is not for sale.', 'transfer', NOW()),

((SELECT id FROM public.coaches WHERE name = 'Lukas Hofer'), 'Guided Salzburg to the Champions League knockout rounds. Attracting attention from Bundesliga clubs. Contract runs until 2026.', 'reputation', NOW() - INTERVAL '4 days'),

((SELECT id FROM public.coaches WHERE name = 'Sven Eriksen'), 'Achieved remarkable results with Bodo/Glimt in Europe. Being monitored by several clubs across England and Germany. Open to a new challenge.', 'reputation', NOW() - INTERVAL '2 days'),

((SELECT id FROM public.coaches WHERE name = 'Erik Lindqvist'), 'Young coach who impressed in the Eredivisie before returning to Sweden. Known for developing youth players and implementing a high-energy pressing game.', 'general', NOW() - INTERVAL '6 days'),

((SELECT id FROM public.coaches WHERE name = 'Ralf Schneider'), 'Holstein Kiel struggling in mid-table. Schneider is believed to be open to offers from clubs with higher ambitions and bigger budgets.', 'availability', NOW() - INTERVAL '1 day'),

((SELECT id FROM public.coaches WHERE name = 'James Fletcher'), 'Solid season with Bristol City in the Championship. Being monitored by several Premier League clubs as a potential appointment if they face a managerial vacancy.', 'reputation', NOW() - INTERVAL '3 days'),

((SELECT id FROM public.coaches WHERE name = 'Antonio Ferrara'), 'Torino hovering above the relegation zone. Board patience is wearing thin. Could become available in the next 2-3 weeks.', 'availability', NOW()),

((SELECT id FROM public.coaches WHERE name = 'Wayne Hartley'), 'Experienced Premier League manager who was let go at the end of last season. Has been out of work for 4 months and is eager to return. Prefers a mid-table or survival project.', 'general', NOW() - INTERVAL '7 days'),

((SELECT id FROM public.coaches WHERE name = 'Fabio Santos'), 'Exciting young Brazilian coach who had a successful spell in the Eredivisie. Available after his contract in the US expired. Speaks English, Portuguese, and Spanish.', 'availability', NOW() - INTERVAL '4 days'),

((SELECT id FROM public.coaches WHERE name = 'Rachid Benali'), 'Made a name in French football with an innovative tactical approach at a smaller Ligue 1 club. Currently without a club after a mutual termination.', 'general', NOW() - INTERVAL '5 days'),

((SELECT id FROM public.coaches WHERE name = 'Tom Williams'), 'Highly rated young Welsh coach who has been working as assistant at a Championship club. Ready to step up to a head coach role. Strong reputation as a tactician.', 'availability', NOW() - INTERVAL '2 days'),

((SELECT id FROM public.coaches WHERE name = 'Lars Andersen'), 'Danish coach with a reputation for building competitive squads on modest budgets. Previously worked in the Eredivisie with notable success.', 'general', NOW() - INTERVAL '3 days'),

((SELECT id FROM public.coaches WHERE name = 'Roberto Mancini Jr'), 'Fiorentina have qualified for Europe under his leadership. Contract runs until 2027. Very unlikely to leave mid-season.', 'contract', NOW() - INTERVAL '1 day'),

((SELECT id FROM public.coaches WHERE name = 'Javier Ruiz'), 'Long-serving coach in Spanish football known for his patient, development-focused approach. Has expressed interest in coaching abroad for the first time.', 'availability', NOW() - INTERVAL '6 days'),

((SELECT id FROM public.coaches WHERE name = 'Youssef El-Masri'), 'Impressive track record in Egyptian football and a successful stint in Saudi Arabia. Looking for a European opportunity. Holds a UEFA Pro Licence.', 'general', NOW() - INTERVAL '4 days');
