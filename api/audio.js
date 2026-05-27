const VOICES = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'marin', 'cedar']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configure OPENAI_API_KEY na Vercel para ativar a geração de áudio.' });
  }

  const { text, voice = 'nova' } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Envie o texto do guião para gerar o áudio.' });
  }

  const cleanText = text.trim().slice(0, 12000);
  const selectedVoice = VOICES.has(voice) ? voice : 'nova';

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
        voice: selectedVoice,
        input: cleanText,
        response_format: 'mp3',
        instructions: 'Fale em português brasileiro, com energia de podcast, dicção clara, ritmo natural e tom neural profissional.'
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: data?.error?.message || 'Erro ao gerar áudio na OpenAI.' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="audio-neural-podcast.mp3"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao gerar áudio.' });
  }
}
