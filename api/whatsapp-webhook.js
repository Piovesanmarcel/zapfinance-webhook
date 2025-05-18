
export default async function handler(req, res) {
  console.log("📡 Função acionada - método:", req.method);

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const from = message?.from;
      const text = message?.text?.body;
      console.log("📨 Mensagem recebida:", text);

      if (!text) {
        res.status(200).send("Sem texto");
        return;
      }

      const linhas = text.split('\n');
      let valor = null, categoria = null, descricao = null, tipo = "gasto";

      for (let linha of linhas) {
        const lower = linha.toLowerCase().trim();

        if (lower.startsWith("gasto")) {
          const match = linha.match(/\d+[\.,]?\d*/);
          valor = match ? match[0].replace(',', '.').trim() : null;
          tipo = "gasto";
        }

        if (lower.startsWith("receita")) {
          const match = linha.match(/\d+[\.,]?\d*/);
          valor = match ? match[0].replace(',', '.').trim() : null;
          tipo = "entrada";
        }

        if (lower.startsWith('categoria')) categoria = linha.split(':')[1]?.trim();
        if (lower.startsWith('descr') || lower.includes('descrição')) descricao = linha.split(':')[1]?.trim();
      }

      console.log("🧾 Dados extraídos:", { valor, categoria, descricao, tipo });

      if (!valor || !categoria || !descricao) {
        console.log("⚠️ Dados incompletos, ignorando");
        res.status(200).send("Dados incompletos");
        return;
      }

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
          telefone: from,
          tipo
        })
      });

      if (!response.ok) {
        const erro = await response.text();
        console.error("❌ Erro ao salvar no Supabase:", erro);
        res.status(500).send("Erro ao salvar");
        return;
      }

      console.log(`✅ ${tipo === "entrada" ? "Receita" : "Gasto"} salvo com sucesso`);
      res.status(200).send("Salvo com sucesso");

    } catch (err) {
      console.error("❌ Erro inesperado:", err);
      res.status(500).send("Erro interno");
    }
  } else {
    res.status(405).send("Método não permitido");
  }
}
