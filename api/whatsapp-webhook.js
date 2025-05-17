export default async function handler(req, res) {
  if (req.method === 'GET') {
    const VERIFY_TOKEN = 'zapfinance123';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('🔐 Webhook verificado com sucesso!');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }

  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];
      const from = message?.from;
      const text = message?.text?.body;

      console.log('📩 Mensagem recebida de:', from);
      console.log('📨 Conteúdo:', text);

      return res.sendStatus(200);
    } else {
      return res.sendStatus(404);
    }
  }

  return res.sendStatus(405);
}

export const config = {
  api: {
    bodyParser: true,
  },
};
