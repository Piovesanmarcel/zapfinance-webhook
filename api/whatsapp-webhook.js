
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

      if (!text) {
        return new Response("Sem texto", { status: 200 });
      }

      const linhas = text.split('\n');
      let valor = null, categoria = null, descricao = null;

      for (let linha of linhas) {
        const lower = linha.toLowerCase().trim();
        if (lower.startsWith('gasto')) valor = linha.split(':')[1]?.replace(/[^0-9,\.]/g, '').replace(',', '.').trim();
        if (lower.startsWith('categoria')) categoria = linha.split(':')[1]?.trim();
        if (lower.startsWith('descr') || lower.includes('descrição')) descricao = linha.split(':')[1]?.trim();
      }

      console.log("🧾 Dados extraídos:", { valor, categoria, descricao });

      if (!valor || !categoria || !descricao) {
        console.log("⚠️ Dados incompletos, ignorando");
        return new Response("Dados incompletos", { status: 200 });
      }

      // Timeout seguro com AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos máx.

      try {
        const response = await fetch("https://mpjjgpcoupqhvvlquwca.supabase.co/rest/v1/gastos", {
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
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error("❌ Supabase falhou:", await response.text());
          return new Response("Erro ao salvar", { status: 500 });
        }

        console.log("✅ Gasto salvo com sucesso");
        return new Response("Salvo com sucesso", { status: 200 });
      } catch (e) {
        console.error("❌ Erro na requisição Supabase:", e);
        return new Response("Erro no Supabase", { status: 500 });
      }

    } catch (err) {
      console.error("❌ Erro inesperado:", err);
      return new Response("Erro interno", { status: 500 });
    }
  }

  return new Response("Método não permitido", { status: 405 });
}
