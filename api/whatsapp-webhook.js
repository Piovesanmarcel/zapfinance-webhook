export default async function handler(req, res) {
  const { method, query, body } = req;

  if (method === 'GET') {
    const VERIFY_TOKEN = 'zapfinance123';
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Forbidden', { status: 403 });
    }
  }

  if (method === 'POST') {
    try {
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const message = changes?.value?.messages?.[0];
        const from = message?.from;
        const text = message?.text?.body;

        if (!text) return new Response('No message text', { status: 200 });

        // Extrair dados do texto
        const linhas = text.split('\n');
        let valor = null, categoria = null, descricao = null;

        for (let linha of linhas) {
          const lower = linha.toLowerCase();
          if (lower.includes('gasto')) {
            valor = linha.replace(/[^0-9,\.]/g, '').replace(',', '.');
          } else if (lower.includes('categoria')) {
            categoria = linha.split(':')[1]?.trim();
          } else if (lower.includes('descr')) {
            descricao = linha.split(':')[1]?.trim();
          }
        }

        // Verifica se os campos são válidos
        if (!valor || !categoria || !descricao) {
          console.log('❌ Dados incompletos:', { valor, categoria, descricao });
          return new Response('Dados incompletos', { status: 200 });
        }

        // Salvar no Supabase
        const response = await fetch('https://mpjjgpcoupqhvvlquwca.supabase.co/rest/v1/gastos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wampncGNvdXBxaHZ2bHF1d2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NzU3MjYsImV4cCI6MjA2MjU1MTcyNn0.JPf62i2Nf6QWtn7DK81uFAYgEWbIKO_Y0hRQatTVwj0',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wampncGNvdXBxaHZ2bHF1d2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NzU3MjYsImV4cCI6MjA2MjU1MTcyNn0.JPf62i2Nf6QWtn7DK81uFAYgEWbIKO_Y0hRQatTVwj0',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            valor: parseFloat(valor),
            categoria,
            descricao,
            telefone: from
          })
        });

        console.log('✅ Gasto salvo com sucesso:', { valor, categoria, descricao });
        return new Response('ok', { status: 200 });
      } else {
        return new Response('Evento ignorado', { status: 200 });
      }
    } catch (err) {
      console.error('❌ Erro ao processar mensagem:', err);
      return new Response('Erro interno', { status: 500 });
    }
  }

  return new Response('Método não permitido', { status: 405 });
}
