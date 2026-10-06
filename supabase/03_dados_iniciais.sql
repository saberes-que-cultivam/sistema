-- Saberes que Cultivam — 03: registros reais já conhecidos dos documentos do projeto (opcional).
-- Unidades da Ata 22/2026, as duas atividades de setembro/2026 e a entrega da etapa 6.3 (contrato com a FUNCERN).
-- Pode rodar mais de uma vez: quem já existe não é duplicado. Nada aqui é dado pessoal de agricultor.
insert into public.unidades (id, nome, sigla, municipio, uf, territorio, modelo, conta, parceiro, local_ok, parceiro_ok, obs) values
 ('00000000-0000-4000-8000-000000000001', 'Polo São Paulo do Potengi', 'SPP', 'São Paulo do Potengi', 'RN', 'Potengi/RN', 'A definir', 'Sim', null, false, false,
  'Ata 22/2026: microrganismos isolados se houver local adequado; senão, área aberta com cobertura.'),
 ('00000000-0000-4000-8000-000000000002', 'Polo Mulungu', 'MUL', 'Mulungu', 'CE', 'Maciço de Baturité/CE', 'A definir', 'Sim', null, false, false,
  'Ata 22/2026: mesma regra do polo de São Paulo do Potengi.'),
 ('00000000-0000-4000-8000-000000000003', 'Base IFRN Campus Apodi (minhocário)', 'APO', 'Apodi', 'RN', 'Outro', 'Área aberta com cobertura (compostagem e biofertilizantes)', 'Não', 'IFRN Campus Apodi', true, true,
  'Área da fazenda com piso concretado; laboratório do campus como apoio. Visita ao local pendente.')
on conflict (id) do nothing;

insert into public.eventos (id, tipo, data, tema, lugar, municipio, part, mulheres, obs) values
 ('00000000-0000-4000-8000-000000000011', 'Articulação', '2026-09-03', 'Encontro da Rede BioAF (SEAB/MDA) na Expointer', 'Parque de Exposições Assis Brasil', 'Esteio/RS', null, null, 'Participação da coordenação, 03 e 04/09/2026.'),
 ('00000000-0000-4000-8000-000000000012', 'Reunião', '2026-09-08', 'Informes da Rede BioAF e planejamento das unidades de produção', 'Google Meet', null, 2, 0, 'Ata 22/2026 - DG/AP/RE/IFRN.')
on conflict (id) do nothing;

insert into public.entregas (id, etapa, titulo, data, obs) values
 ('00000000-0000-4000-8000-000000000021', '6.3', 'Contrato 220/2026 com a FUNCERN; 1ª parcela de R$ 200.000,00 liquidada (2026NS001323)', '2026-09-22', 'Contrato assinado em 20/08/2026.')
on conflict (id) do nothing;

select (select count(*) from public.unidades) as unidades, (select count(*) from public.eventos) as atividades, (select count(*) from public.entregas) as entregas;
