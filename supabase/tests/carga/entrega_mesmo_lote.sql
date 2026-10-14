-- Corrida: todos os clientes entregam 1 kg no MESMO lote de 100 kg (e2000000-...-01). O saldo nunca pode ficar negativo.
-- carga.entregar() é só do teste: faz o insert como 'authenticated' e conta a recusa de saldo em vez de derrubar o cliente.
\set u random(3, 20)
\set a random(1, 30)
BEGIN;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-' || lpad(:u::text, 12, '0'), true), set_config('request.jwt.claim.email', 'estresse' || :u || '@teste.br', true);
set local role authenticated;
select carga.entregar(('d0000000-0000-4000-8000-' || lpad(:a::text, 12, '0'))::uuid, 1);
COMMIT;
