export default async function handler(req, res) {
  const { method, query, body } = req;

  if (method === 'GET') {
    const VERIFY_TOKEN = 'zapfinance123';
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('🔐 Webhook verificado com sucesso!');
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

        console.log('📩 Mensagem recebida de:', from);
        console.log('📨 Conteúdo:', text);

        return new Response('ok', { status: 200 });
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (err) {
      console.error('❌ Erro ao processar POST:', err);
      return new Response('Erro interno', { status: 500 });
    }
  }

  return new Response('Método não permitido', { status: 405 });
}
