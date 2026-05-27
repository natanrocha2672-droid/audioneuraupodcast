import React, { useState } from 'react';
import { Bot, Copy, Download, Loader2, Sparkles, Trash2 } from 'lucide-react';

const exemplo = 'A inteligência artificial pode ajudar pequenas equipas a transformar textos, ideias e pesquisas em guiões de podcast mais claros, rápidos e envolventes.';

export default function App() {
  const [baseText, setBaseText] = useState('');
  const [script, setScript] = useState('Host: Olá! Bem-vindo ao Audio Neural Podcast.\nConvidado: Obrigado pelo convite. Vamos começar?');
  const [tone, setTone] = useState('profissional e envolvente');
  const [duration, setDuration] = useState('3 a 5 minutos');
  const [audience, setAudience] = useState('público geral');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function gerar() {
    setError('');
    const text = baseText.trim();
    if (!text) {
      setError('Cole um tema, artigo ou briefing antes de gerar.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tone, duration, audience })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar o guião.');
      setScript(data.script);
    } catch (err) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  async function copiar() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function baixar() {
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guiao-podcast.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 rounded-3xl border border-cyan-400/20 bg-slate-900/80 p-8 shadow-2xl">
          <div className="mb-4 flex items-center gap-3 text-cyan-300">
            <Bot />
            <span className="text-sm font-semibold uppercase tracking-[0.25em]">Audio Neural Podcast</span>
          </div>
          <h1 className="text-4xl font-black md:text-6xl">Transforme qualquer texto em guião de podcast com IA.</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">Cole um artigo, ideia ou briefing. O app cria uma conversa pronta entre Host e Convidado, com tom, duração e público personalizados.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Conteúdo base</h2>
              <button onClick={() => setBaseText(exemplo)} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950">Usar exemplo</button>
            </div>
            <textarea value={baseText} onChange={e => setBaseText(e.target.value)} placeholder="Cole aqui o tema, texto ou briefing do podcast..." className="h-72 w-full resize-none rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-100 outline-none focus:border-cyan-400" />

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input value={tone} onChange={e => setTone(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="Tom" />
              <input value={duration} onChange={e => setDuration(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="Duração" />
              <input value={audience} onChange={e => setAudience(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 p-3" placeholder="Público" />
            </div>

            {error && <p className="mt-4 rounded-xl border border-red-400/30 bg-red-950/50 p-3 text-red-200">{error}</p>}
            <button onClick={gerar} disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-4 font-black text-slate-950 disabled:opacity-60">
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading ? 'Gerando...' : 'Gerar guião com IA'}
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Guião gerado</h2>
              <div className="flex gap-2">
                <button onClick={copiar} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold"><Copy className="mr-1 inline h-4 w-4" />{copied ? 'Copiado' : 'Copiar'}</button>
                <button onClick={baixar} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold"><Download className="mr-1 inline h-4 w-4" />TXT</button>
                <button onClick={() => setScript('')} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold"><Trash2 className="mr-1 inline h-4 w-4" />Limpar</button>
              </div>
            </div>
            <textarea value={script} onChange={e => setScript(e.target.value)} className="h-[31rem] w-full resize-none rounded-2xl border border-white/10 bg-slate-950 p-4 leading-relaxed text-slate-100 outline-none focus:border-fuchsia-400" />
          </div>
        </div>
      </section>
    </main>
  );
}
