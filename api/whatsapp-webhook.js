
export default async function handler(req, res) {
  const { method, query, body } = req;

  if (method === 'GET') {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === 'zapfinance123') {
      return new Response(challenge, { status: 200 });
    }

    return new Response("Token inválido", { status: 403 });
  }

  if (method === 'POST') {
    try {
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const from = message?.from;
      const text = message?.text?.body;

      console.log("📨 Mensagem recebida:", text);

      // ⚠️ RESPOSTA IMEDIATA para evitar timeout
      const response = new Response("Recebido", { status: 200 });

      // ⚠️ CONTINUA EM BACKGROUND
      setTimeout(() => {
        if (!text) return;

        const linhas = text.split('\n');
        let valor = null, categoria = null, descricao = null;

        for (let linha of linhas) {
          const lower = linha.toLowerCase().trim();
          if (lower.startsWith('gasto')) valor = linha.split(':')[1]?.replace(/[^0-9,\.]/g, '').replace(',', '.').trim();
          if (lower.startsWith('categoria')) categoria = linha.split(':')[1]?.trim();
          if (lower.startsWith('descr') || lower.includes('descrição')) descricao = linha.split(':')[1]?.trim();
        }

        console.log("🧾 Dados extraídos:", { valor, categoria, descricao });

        if (!valor || !categoria || !descricao) return;

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
        .then(() => console.log("✅ Gasto enviado ao Supabase"))
        .catch(e => console.error("❌ Falha ao salvar gasto:", e));
      }, 1);

      return response;
    } catch (err) {
      console.error("❌ Erro geral:", err);
      return new Response("Erro interno", { status: 500 });
    }
  }

  return new Response("Método não permitido", { status: 405 });
}
