export default async function handler(req, res) {
  const { method, body, query } = req;

  if (method === 'GET') {
    const VERIFY_TOKEN = 'zapfinance123';
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Token inválido', { status: 403 });
    }
  }

  if (method === 'POST') {
    try {
      if (body.object !== 'whatsapp_business_account') {
        console.log("🔕 Evento ignorado");
        return new Response("Evento ignorado", { status: 200 });
      }

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];
      const from = message?.from;
      const text = message?.text?.body;

      if (!text) {
        console.log("📭 Mensagem sem texto");
        return new Response("Mensagem sem texto", { status: 200 });
      }

      console.log("📩 Mensagem recebida:", text);

      const linhas = text.split('\\n');
      let valor = null, categoria = null, descricao = null;

      for (let linha of linhas) {
        const lower = linha.toLowerCase();
        if (lower.includes('gasto')) {
          valor = linha.replace(/[^0-9,\\.]/g, '').replace(',', '.');
        } else if (lower.includes('categoria')) {
          categoria = linha.split(':')[1]?.trim();
        } else if (lower.includes('descr')) {
          descricao = linha.split(':')[1]?.trim();
        }
      }

      console.log("🧾 Dados extraídos:", { valor, categoria, descricao });

      if (!valor || !categoria || !descricao) {
        console.log("⚠️ Dados incompletos, ignorando.");
        return new Response("Dados incompletos", { status: 200 });
      }

      // Disparar envio ao Supabase sem aguardar
      fetch("https://mpjjgpcoupqhvvlquwca.supabase.co/rest/v1/gastos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          valor: parseFloat(valor),
          categoria,
          descricao,
          telefone: from
        })
      })
      .then(() => {
        console.log("✅ Gasto salvo com sucesso");
      })
      .catch((e) => {
        console.error("❌ Erro ao salvar no Supabase:", e);
      });

      // Resposta rápida antes de aguardar Supabase
      return new Response("Recebido, processando...", { status: 200 });

    } catch (err) {
      console.error("❌ Erro inesperado:", err);
      return new Response("Erro interno", { status: 500 });
    }
  }

  return new Response('Método não permitido', { status: 405 });
}
