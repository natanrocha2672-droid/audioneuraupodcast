const VOICES = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'marin', 'cedar']);
const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

function cleanLine(text) {
  return String(text || '')
    .replace(/^\s*(host|apresentador|apresentadora|convidado|convidada|guest|entrevistado|entrevistada)\s*:\s*/i, '')
    .replace(/\[(.*?)\]/g, '')
    .replace(/\((risos|pausa|silêncio|silencio|música|musica|vinheta).*?\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitLongText(text, maxLength = 900) {
  const sentences = text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [text];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    const clean = sentence.trim();
    if (!clean) continue;
    if ((current + ' ' + clean).trim().length > maxLength && current) {
      chunks.push(current.trim());
      current = clean;
    } else {
      current = `${current} ${clean}`.trim();
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}

function parsePodcastScript(text) {
  const lines = String(text || '').split(/\r?\n/);
  const turns = [];
  let currentSpeaker = 'host';
  let currentText = '';

  function pushCurrent() {
    const cleaned = cleanLine(currentText);
    if (cleaned) turns.push({ speaker: currentSpeaker, text: cleaned });
    currentText = '';
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(/^\s*(host|apresentador|apresentadora|convidado|convidada|guest|entrevistado|entrevistada)\s*:\s*(.*)$/i);
    if (match) {
      pushCurrent();
      const role = match[1].toLowerCase();
      currentSpeaker = /convid|guest|entrevist/.test(role) ? 'guest' : 'host';
      currentText = match[2] || '';
    } else {
      currentText = `${currentText} ${line}`.trim();
    }
  }
  pushCurrent();

  if (!turns.length) {
    return splitLongText(cleanLine(text), 900).map(chunk => ({ speaker: 'host', text: chunk }));
  }

  const expanded = [];
  for (const turn of turns) {
    for (const chunk of splitLongText(turn.text, 900)) {
      expanded.push({ speaker: turn.speaker, text: chunk });
    }
  }
  return expanded.slice(0, 36);
}

function silence(ms = 260) {
  const samples = Math.floor((SAMPLE_RATE * ms) / 1000);
  return Buffer.alloc(samples * CHANNELS * (BITS_PER_SAMPLE / 8));
}

function wavHeader(dataLength) {
  const blockAlign = CHANNELS * (BITS_PER_SAMPLE / 8);
  const byteRate = SAMPLE_RATE * blockAlign;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

async function createSpeech({ apiKey, model, voice, input, speaker }) {
  const instructions = speaker === 'guest'
    ? 'Fale em português brasileiro como um convidado de podcast: natural, curioso, levemente descontraído, com variações de emoção, pausas curtas e sem ler de forma robótica. Não diga o nome do personagem.'
    : 'Fale em português brasileiro como apresentador de podcast: energia profissional, abertura clara, ritmo envolvente, boa entonação, pequenas pausas e naturalidade. Não diga o nome do personagem.';

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      voice,
      input,
      response_format: 'pcm',
      instructions
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error?.message || 'Erro ao gerar áudio na OpenAI.');
  }

  return Buffer.from(await response.arrayBuffer());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configure OPENAI_API_KEY na Vercel para ativar a geração de áudio.' });
  }

  const { text, voice, hostVoice = voice || 'nova', guestVoice = 'onyx' } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Envie o texto do guião para gerar o áudio.' });
  }

  const selectedHostVoice = VOICES.has(hostVoice) ? hostVoice : 'nova';
  const selectedGuestVoice = VOICES.has(guestVoice) ? guestVoice : 'onyx';
  const turns = parsePodcastScript(text.trim().slice(0, 18000));

  if (!turns.length) {
    return res.status(400).json({ error: 'Não encontrei falas para transformar em áudio.' });
  }

  try {
    const model = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
    const generated = await Promise.all(
      turns.map(turn => createSpeech({
        apiKey,
        model,
        voice: turn.speaker === 'guest' ? selectedGuestVoice : selectedHostVoice,
        input: turn.text,
        speaker: turn.speaker
      }))
    );

    const pieces = [];
    generated.forEach((part, index) => {
      if (index > 0) pieces.push(silence(240));
      pieces.push(part);
    });

    const pcm = Buffer.concat(pieces);
    const wav = Buffer.concat([wavHeader(pcm.length), pcm]);

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="audio-neural-podcast.wav"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(wav);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno ao gerar áudio.' });
  }
}
