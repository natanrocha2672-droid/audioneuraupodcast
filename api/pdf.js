import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { file, fileName } = req.body || {};
  if (!file || typeof file !== 'string') {
    return res.status(400).json({ error: 'Envie um PDF em base64.' });
  }

  try {
    const base64 = file.includes(',') ? file.split(',').pop() : file;
    const buffer = Buffer.from(base64, 'base64');

    if (!buffer.length) {
      return res.status(400).json({ error: 'PDF vazio ou inválido.' });
    }

    const parsed = await pdfParse(buffer, { max: 80 });
    const text = String(parsed.text || '')
      .replace(/\u0000/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!text) {
      return res.status(422).json({ error: 'Não consegui extrair texto deste PDF. Talvez seja um PDF escaneado/imagem.' });
    }

    return res.status(200).json({
      fileName: fileName || 'documento.pdf',
      pages: parsed.numpages || null,
      text: text.slice(0, 50000)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar o PDF. Tente um arquivo menor ou com texto selecionável.' });
  }
}
