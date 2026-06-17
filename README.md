# audioneuraupodcast

Aplicação web para transformar temas, textos, briefings e PDFs em um roteiro de podcast e gerar áudio com vozes neurais.

## Funcionalidades

- Receber conteúdo base por texto.
- Extrair texto de arquivos PDF.
- Gerar um guião de podcast com Host e Convidado.
- Gerar áudio em WAV com vozes neurais diferentes para cada participante.
- Copiar ou baixar o roteiro gerado.

## Stack

- Vite
- React
- Tailwind CSS
- Vercel Serverless Functions
- OpenAI API para geração de roteiro e áudio
- pdf-parse para extração de texto de PDFs

## Variáveis de ambiente

Crie as variáveis no ambiente de deploy antes de usar as rotas de IA:

```env
OPENAI_API_KEY=coloque_sua_chave_aqui
OPENAI_MODEL=gpt-4o-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
```

## Como rodar localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
npm run preview
```

## Fluxo de uso

1. Cole um tema, artigo, briefing ou envie um PDF.
2. Ajuste tom, duração e público-alvo.
3. Gere o guião com IA.
4. Revise o texto gerado.
5. Escolha as vozes do Host e do Convidado.
6. Gere e baixe o áudio final.

## Limites e cuidados

- Configure `OPENAI_API_KEY` antes de gerar roteiro ou áudio.
- PDFs grandes podem ser recusados pelo limite da API.
- Textos muito longos podem ser divididos em partes antes da geração de áudio.
- Nunca publique arquivos `.env` com chaves reais no repositório.

## Status

MVP funcional em evolução.
