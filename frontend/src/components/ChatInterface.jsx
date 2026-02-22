import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import useSpeechToText from '../hooks/useSpeechToText';
import MediaToolbar from './MediaToolbar';
import { 
  PaperAirplaneIcon, ArrowDownTrayIcon, SparklesIcon, ArrowPathIcon, MicrophoneIcon, 
  StopIcon, PaperClipIcon, XMarkIcon, AcademicCapIcon, MapIcon, MagnifyingGlassCircleIcon
} from '@heroicons/react/24/outline';

const ChatInterface = () => {
  const [messages, setMessages] = useState([{ role: 'ai', content: `Olá! Vamos criar um Plano de Ação de Alto Impacto. Me diga o nome do professor e em qual competência ele precisa de mentoria (ex: Scaffolding, Gestão de Tempo).` }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null); 
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechToText();

  useEffect(() => { if (transcript) { setInput(prev => prev + " " + transcript); resetTranscript(); } }, [transcript]);
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; } }, [input]);

  // ESTADO ENXUTO (SÓ PLANO DE AÇÃO)
  const [docState, setDocState] = useState({
    professor: "", data: new Date().toLocaleDateString('pt-BR'), segmento: "", 
    competencia_foco: "", resumo_necessidade: "", plano_acao_detalhado: ""
  });

  const handleDocChange = (fieldKey, newValue) => {
    setDocState(prev => ({ ...prev, [fieldKey]: newValue }));
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => setAttachment({ type: 'image', url: event.target.result, base64: event.target.result, name: 'Evidência' });
        reader.readAsDataURL(blob);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;
    let displayContent = (
      <div className="flex flex-col gap-2">
        {attachment && attachment.type === 'image' && <img src={attachment.url} alt="anexo" className="max-w-full rounded-xl border border-white/20 shadow-sm" />}
        {attachment && attachment.type === 'file' && <div className="text-xs bg-white/20 p-2 rounded-lg font-medium">📎 {attachment.name}</div>}
        <span className="whitespace-pre-wrap">{input}</span>
      </div>
    );
    setMessages(prev => [...prev, { role: 'user', content: displayContent }]);
    const payloadInput = input; const payloadAttachment = attachment ? attachment.base64 : null;
    setInput(''); setAttachment(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/chat', {
        message: payloadInput || "Analise a evidência e gere o plano de ação.", current_doc: docState,
        conversation_history: messages.map(m => ({ role: m.role, content: typeof m.content === 'object' ? '[Mídia Visual]' : m.content })), 
        user_name: "Coordenador", attachment: payloadAttachment
      });
      const aiResponse = response.data;
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse.ai_message }]);
      if (aiResponse.updated_doc) setDocState(aiResponse.updated_doc);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "⚠️ Erro de conexão com o servidor." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans text-slate-800 overflow-hidden">
      
      {/* ESQUERDA: CHAT */}
      <div className="w-[400px] flex flex-col bg-white border-r border-slate-200 z-20 shadow-xl">
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm tracking-tight">Advisor AI</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Gerador de Plano de Ação</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 mt-1"><SparklesIcon className="w-4 h-4" /></div>}
              <div className={`max-w-[85%] p-4 text-[13px] leading-relaxed shadow-sm rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <div className="flex gap-2 px-4 text-xs text-indigo-400 items-center font-medium animate-pulse"><ArrowPathIcon className="w-4 h-4 animate-spin" /> Elaborando Plano e Referências...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <div className="mb-3 px-1"><MediaToolbar onMediaSelected={setAttachment} /></div>
          <div className={`relative flex flex-col border border-slate-200 rounded-2xl bg-slate-50 shadow-inner focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all ${isListening ? 'ring-2 ring-rose-100 border-rose-400 bg-rose-50/30' : ''}`}>
            {attachment && (
              <div className="px-4 pt-4 pb-0 flex items-start">
                <div className="relative group">
                  {attachment.type === 'image' ? <img src={attachment.url} alt="preview" className="h-16 w-16 object-cover rounded-xl border shadow-sm" /> : <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center border shadow-sm"><PaperClipIcon className="w-6 h-6 text-slate-400" /></div>}
                  <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-md hover:bg-rose-500 transition-colors"><XMarkIcon className="w-3 h-3" /></button>
                </div>
                <div className="ml-3 text-xs text-slate-500 pt-1 max-w-[200px] truncate font-medium">{attachment.name}</div>
              </div>
            )}
            <textarea
              ref={textareaRef} rows={1}
              className="w-full max-h-[150px] px-4 py-3 bg-transparent border-none focus:ring-0 text-sm text-slate-700 placeholder-slate-400 resize-none custom-scrollbar leading-relaxed"
              placeholder={isListening ? "Ouvindo..." : "Ex: Professor João precisa melhorar Gamificação..."}
              value={input} onChange={(e) => setInput(e.target.value)} onPaste={handlePaste}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} disabled={loading}
            />
            <div className="flex justify-between items-center px-2 pb-2 mt-1">
              <button onClick={isListening ? stopListening : startListening} className={`p-2 rounded-xl transition-all flex items-center gap-2 ${isListening ? 'bg-rose-100 text-rose-600 shadow-sm' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}><MicrophoneIcon className="w-5 h-5" /></button>
              <button onClick={handleSend} disabled={!input.trim() && !attachment} className={`p-2 rounded-xl transition-all ${input.trim() || attachment ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><PaperAirplaneIcon className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* DIREITA: O PLANO DE AÇÃO */}
      <div className="flex-1 flex flex-col h-full bg-slate-100 relative items-center">
         <div className="w-full h-16 flex items-center justify-end px-8 z-30 flex-shrink-0">
          <button onClick={() => axios.post('http://localhost:8000/api/download', docState, { responseType: 'blob' }).then(r => {
             const url = window.URL.createObjectURL(new Blob([r.data]));
             const link = document.createElement('a'); link.href = url; link.setAttribute('download', `PlanoAcao_${docState.professor.replace(/\s+/g, '_') || 'Docente'}.docx`); document.body.appendChild(link); link.click();
          })} className="flex items-center gap-2 bg-indigo-600 text-white border border-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all hover:shadow-lg hover:bg-indigo-700">
            <ArrowDownTrayIcon className="w-4 h-4 stroke-2" /> Baixar Plano Oficial (Word)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full flex justify-center py-10 custom-scrollbar">
           <div className="bg-white w-[210mm] min-h-[297mm] h-fit shadow-2xl p-[15mm] rounded-sm relative border border-slate-200 mb-12 pb-24">
             
             {/* Header */}
             <header className="border-b-4 border-indigo-600 pb-4 mb-8 flex justify-between items-end">
               <div>
                  <h5 className="text-indigo-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Programa Bilíngue</h5>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Plano de Ação Individual</h1>
               </div>
               <div className="text-right">
                 <AcademicCapIcon className="w-10 h-10 text-slate-200" />
               </div>
             </header>

             {/* 1. IDENTIFICAÇÃO */}
             <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-8 bg-slate-50 border border-slate-100 p-5 rounded-lg">
                <PaperField label="Professor(a)" fieldKey="professor" value={docState.professor} onChange={handleDocChange} full />
                <PaperField label="Data de Criação" fieldKey="data" value={docState.data} onChange={handleDocChange} />
                <PaperField label="Segmento" fieldKey="segmento" value={docState.segmento} onChange={handleDocChange} full />
             </div>

             {/* 2. FOCO DE DESENVOLVIMENTO */}
             <CategoryHeader title="Diagnóstico & Foco" icon={<MagnifyingGlassCircleIcon className="w-6 h-6 text-indigo-500" />} />
             <div className="grid gap-4 mb-10">
                <PaperField label="Competência Foco (Ex: Scaffolding, Gestão de Tempo)" fieldKey="competencia_foco" value={docState.competencia_foco} onChange={handleDocChange} full />
                <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resumo da Necessidade</label>
                    <textarea 
                        value={docState.resumo_necessidade}
                        onChange={(e) => handleDocChange('resumo_necessidade', e.target.value)}
                        placeholder="Descreva brevemente o que foi observado na aula..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm leading-relaxed text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-y min-h-[80px]"
                    />
                </div>
             </div>

             {/* 3. PLANO DE AÇÃO ESTRUTURADO */}
             <CategoryHeader title="Plano de Ação e Mentoria" icon={<MapIcon className="w-6 h-6 text-emerald-500" />} />
             <div className="bg-white border-2 border-slate-100 rounded-xl mt-4 shadow-sm focus-within:border-indigo-400 transition-all">
                <textarea 
                    className={`w-full bg-transparent p-6 text-[15px] leading-[1.8] whitespace-pre-wrap outline-none resize-y min-h-[400px] custom-scrollbar text-slate-800 ${!docState.plano_acao_detalhado && 'italic text-slate-400'}`}
                    placeholder="O roteiro de estudos (Livros, Vídeos, Podcasts), Perguntas Reflexivas e o Plano de Mentoria serão gerados aqui pela IA automaticamente..."
                    value={docState.plano_acao_detalhado}
                    onChange={(e) => handleDocChange('plano_acao_detalhado', e.target.value)}
                />
             </div>

           </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES EDITÁVEIS ---
const CategoryHeader = ({ title, icon }) => (
  <div className="flex items-center gap-3 mb-4 mt-8 border-b-2 border-slate-100 pb-3">
    {icon}
    <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">{title}</h2>
  </div>
);

const PaperField = ({ label, value, fieldKey, onChange, full }) => (
  <div className={`${full ? 'col-span-2' : ''}`}>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
    <input 
      type="text"
      value={value}
      onChange={(e) => onChange(fieldKey, e.target.value)}
      placeholder="Aguardando..."
      className={`w-full min-h-[2.5rem] border-b-2 border-slate-200 py-1 text-base font-bold text-slate-900 bg-transparent outline-none focus:border-indigo-500 transition-colors ${value ? 'bg-indigo-50/40 px-2 rounded-t' : ''}`}
    />
  </div>
);

export default ChatInterface;