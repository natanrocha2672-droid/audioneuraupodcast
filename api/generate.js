const SYSTEM_INSTRUCTIONS = `Tu és um guionista especializado em podcasts.
Cria um diálogo de podcast entre Host e Convidado em Português.
Formato obrigatório:
Host: [fala]
Convidado: [fala]
Regras:
- Mantém o tom profissional, claro e envolvente.
- Não inventes factos que não estejam no conteúdo base.
- Explica termos difíceis de forma simples.
- Inclui abertura curta, blocos de conversa e encerramento com chamada à ação.
- Escreve como conversa natural.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configure OPENAI_API_KEY na Vercel para ativar a geração por IA.' });
  }

  const { text, tone, duration, audience } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Envie um texto base para gerar o guião.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTIONS },
          { role: 'user', content: `Conteúdo base:\n${text}\n\nTom: ${tone || 'profissional'}\nDuração: ${duration || '3 a 5 minutos'}\nPúblico-alvo: ${audience || 'público geral'}\n\nCria o guião completo.` }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Erro ao chamar a OpenAI.' });
    }

    const script = data?.choices?.[0]?.message?.content?.trim();
    if (!script) {
      return res.status(502).json({ error: 'A IA não retornou um guião.' });
    }

    return res.status(200).json({ script });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao gerar o guião.' });
  }
}
