/* Configuração. Deixe supabaseUrl vazio para rodar em modo demonstração (dados só neste navegador).
   Para produção, copie a URL e a chave "publishable" do painel do Supabase (Project Settings > API).
   A chave publishable é pública por desenho: quem protege os dados são as regras do banco (RLS).
   NUNCA coloque aqui a chave "secret"/"service_role" nem a senha do banco. */
window.SQC = window.SQC || {};
SQC.CONFIG = {
  supabaseUrl: 'https://lrkrqglqvocqxixibtmk.supabase.co',
  supabaseAnonKey: 'sb_publishable_94OMIy742fWsnyhS_NWUiQ_OIhN1Z1A',
  semServiceWorker: false
};
