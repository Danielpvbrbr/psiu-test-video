import { PsiuFlashProvider, LocalVideo, RemoteVideo, usePsiuFlash, formatTime } from 'psiu-meet-client';
import { useEffect, useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, GripVertical, User, GraduationCap, AlertTriangle, Loader2 } from 'lucide-react';

const SERVER_URL  = 'https://psiumeet.azurewebsites.net';
const SESSION_KEY = 'psiu_session';

const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {}; } catch { return {}; } };

const QUALITY_MAP = {
  good:    { bars: 3, color: 'bg-emerald-400', label: 'Boa'     },
  fair:    { bars: 2, color: 'bg-yellow-400',  label: 'Regular' },
  poor:    { bars: 1, color: 'bg-red-400',     label: 'Ruim'    },
  unknown: { bars: 0, color: 'bg-slate-600',   label: ''        },
};

// ============================================================================
// COMPONENTES UTILITÁRIOS
// ============================================================================
function QualityIndicator({ quality }) {
  const { bars, color, label } = QUALITY_MAP[quality] ?? QUALITY_MAP.unknown;
  return (
    <div className="flex items-end gap-[2px] h-3 md:h-4" title={label ? `Conexão: ${label}` : 'Medindo...'}>
      {[1, 2, 3].map(i => (
        <div key={i} className={`w-[3px] md:w-1 rounded-sm transition-all duration-300 ${i <= bars ? color : 'bg-slate-700'}`} style={{ height: `${i * 33}%` }} />
      ))}
    </div>
  );
}

function Avatar({ nome, avatar, size = 'md' }) {
  const s = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-16 h-16 md:w-20 md:h-20 text-xl md:text-2xl';
  return avatar
    ? <img src={avatar} alt={nome} className={`${s} rounded-full object-cover`} />
    : <div className={`${s} rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400`}>{nome?.[0]?.toUpperCase() ?? '?'}</div>;
}

function ControlBtn({ onClick, active, children }) {
  return (
    <button onClick={onClick} className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl transition-all active:scale-95 ${active ? 'bg-slate-700/50 hover:bg-slate-600 text-white' : 'bg-red-500 text-white'}`}>
      {children}
    </button>
  );
}

// ============================================================================
// TELAS DE ESTADO
// ============================================================================
function TelaConectando({ payload, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 md:gap-6 text-white z-50 p-6 text-center">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 ring-2 ring-slate-700 overflow-hidden flex items-center justify-center">
        <Avatar nome={payload.nome} avatar={payload.avatar} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Loader2 size={24} className="animate-spin text-slate-400 md:w-7 md:h-7" />
        <p className="text-slate-300 font-medium text-sm md:text-base">Conectando à sala...</p>
        <p className="text-slate-500 text-xs md:text-sm font-mono break-all">{payload.chave || '...'}</p>
      </div>
      <button onClick={onCancelar} className="mt-4 px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-all">
        Cancelar
      </button>
    </div>
  );
}

function TelaErroAcesso({ mensagem, onVoltar }) {
  const msg = mensagem === 'Sala não existe.' ? 'A chave está incorreta ou esta sala já foi finalizada.' : mensagem;
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 p-4">
      <div className="flex flex-col items-center gap-4 bg-slate-900 border border-red-500/30 rounded-3xl px-6 py-8 md:px-12 md:py-10 text-center max-w-sm w-full shadow-2xl">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="text-red-400 w-7 h-7 md:w-8 md:h-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white">Acesso Negado</h2>
        <p className="text-slate-400 text-xs md:text-sm">{msg}</p>
        <button onClick={onVoltar} className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all active:scale-95 border border-slate-700 text-sm md:text-base">
          Voltar ao painel
        </button>
      </div>
    </div>
  );
}

function ModalEncerramento({ onFim }) {
  const [contador, setContador] = useState(4);
  useEffect(() => {
    if (contador === 0) { onFim(); return; }
    const t = setTimeout(() => setContador(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [contador]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="flex flex-col items-center gap-4 md:gap-5 bg-slate-900 border border-slate-700/50 rounded-3xl px-8 py-10 md:px-16 md:py-12 shadow-2xl text-center max-w-sm w-full">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <PhoneOff className="text-red-400 w-7 h-7 md:w-8 md:h-8" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Chamada Encerrada</h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1">O tempo da aula foi atingido.</p>
        </div>
        <div className="text-6xl md:text-7xl font-black text-white tabular-nums mt-2">{contador}</div>
        <p className="text-slate-600 text-[10px] md:text-xs">Fechando automaticamente...</p>
      </div>
    </div>
  );
}

// ============================================================================
// TELA DE MOCK
// ============================================================================
function TelaDeMock({ onInjetarJson, salaAtivaId }) {
  const [jsonProfStr, setJsonProfStr] = useState(
    JSON.stringify({ papel: 'professor', nome: 'Daniel', id: 'usr_daniel_001', chave: '', tempo: 60, maxParticipants: 2, avatar: 'https://ui-avatars.com/api/?name=Daniel&background=random' }, null, 2)
  );
  const [jsonAlunoStr, setJsonAlunoStr] = useState(
    JSON.stringify({ papel: 'aluno', nome: 'Gabriel', id: 'usr_gabriel_002', chave: salaAtivaId || '', avatar: 'https://ui-avatars.com/api/?name=Gabriel&background=random' }, null, 2)
  );

  useEffect(() => {
    if (!salaAtivaId) return;
    try {
      const obj = JSON.parse(jsonAlunoStr);
      setJsonAlunoStr(JSON.stringify({ ...obj, chave: salaAtivaId }, null, 2));
    } catch {}
  }, [salaAtivaId]);

  const handleInjetar = (jsonString) => {
    try {
      const payload = JSON.parse(jsonString);
      if (!payload.nome) return alert("O JSON precisa ter a propriedade 'nome'!");
      onInjetarJson(payload);
    } catch { alert('Erro de Sintaxe no JSON! Verifique as aspas e vírgulas.'); }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 overflow-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white text-center">PsiuMeet</h1>
      <p className="text-slate-400 text-sm md:text-base mb-6 md:mb-10 text-center">Simule o recebimento do JSON do backend</p>

      {salaAtivaId && (
        <div className="mb-6 md:mb-8 p-3 md:p-4 bg-blue-900/30 border border-blue-500 rounded-xl text-blue-300 font-mono text-xs md:text-sm text-center max-w-full truncate">
          <strong>Sala ativa:</strong> {salaAtivaId}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-4xl pb-10 md:pb-0">
        {[
          { label: 'Criar Sala',   icon: <GraduationCap className="text-blue-500 w-6 h-6 md:w-8 md:h-8" />, color: 'blue',    json: jsonProfStr,  setJson: setJsonProfStr,  btnText: 'Abrir como Professor' },
          { label: 'Acessar Sala', icon: <User          className="text-emerald-500 w-6 h-6 md:w-8 md:h-8" />, color: 'emerald', json: jsonAlunoStr, setJson: setJsonAlunoStr, btnText: 'Abrir como Aluno'    },
        ].map(({ label, icon, color, json, setJson, btnText }) => (
          <div key={label} className={`flex-1 bg-slate-900 border border-${color}-500/30 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-xl flex flex-col`}>
            <div className="flex items-center gap-3 mb-3 md:mb-4">{icon}<h2 className="text-lg md:text-2xl font-bold text-white">{label}</h2></div>
            <p className="text-xs md:text-sm text-slate-400 mb-3 md:mb-4">Edite o JSON livremente:</p>
            <textarea value={json} onChange={(e) => setJson(e.target.value)} className={`w-full h-32 md:h-48 bg-slate-950 text-${color}-400 font-mono text-xs md:text-sm p-3 md:p-4 rounded-xl border border-slate-800 focus:border-${color}-500 outline-none resize-none shadow-inner mb-6 md:mb-8`} spellCheck="false" />
            <button onClick={() => handleInjetar(json)} className={`mt-auto py-3 md:py-4 bg-${color}-600 hover:bg-${color}-500 text-white font-semibold text-sm md:text-base rounded-xl transition-all shadow-lg shadow-${color}-600/20 active:scale-[0.98]`}>
              {btnText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SALA DE VÍDEO
// ============================================================================
function SalaDeVideo({ payload, onSair, salaId, setSalaId }) {
  const { connect, leaveRoom, onExpired, toggleMic, toggleCam, isMicOn, isCamOn, status, error, remainingMs, isSpeaking, remoteSpeaking, connectionQuality } = usePsiuFlash();
  const [encerrando, setEncerrando] = useState(false);
  const janelaVideoRef = useRef(null);
  const iniciouRef     = useRef(false);

  useEffect(() => { onExpired(() => setEncerrando(true)); }, []);

  useEffect(() => {
    if (iniciouRef.current) return;
    iniciouRef.current = true;
    connect({ ...payload, chave: payload.chave || salaId })
      .then(({ roomId }) => { if (roomId) setSalaId(roomId); })
      .catch(() => {});
  }, []);

  const sair = () => { leaveRoom(); onSair(); };

  if (status === 'connecting' || status === 'idle') return <TelaConectando payload={payload} onCancelar={sair} />;
  if (status === 'error')                           return <TelaErroAcesso mensagem={error} onVoltar={sair} />;

  const isProfessor = payload.papel === 'professor';
  const timerColor  = remainingMs !== null && remainingMs < 300000 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300';
  const avisoFim    = remainingMs !== null && remainingMs <= 60000 && remainingMs > 0;

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden text-white">

      {encerrando && <ModalEncerramento onFim={sair} />}

      {/* Banner de Aviso (Menor no mobile) */}
      {avisoFim && !encerrando && (
        <div className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-yellow-500 text-yellow-950 px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-lg font-semibold text-xs md:text-sm whitespace-nowrap">
          ⏳ Encerrando em {formatTime(remainingMs)}
        </div>
      )}

      {/* Header Responsivo */}
      <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-auto z-30 flex flex-wrap items-center gap-2 md:gap-3 bg-slate-900/80 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-white/10 shadow-lg justify-center md:justify-start">
        {payload.avatar && <Avatar nome={payload.nome} avatar={payload.avatar} size="sm" />}
        <span className="text-xs font-semibold text-slate-200 max-w-[80px] md:max-w-none truncate">{payload.nome}</span>
        <span className="text-slate-600 hidden md:inline">|</span>
        <span className="text-[10px] md:text-xs font-mono text-slate-400 hidden sm:inline">{payload.chave || salaId || '...'}</span>
        <span className={`px-2 py-0.5 text-[9px] md:text-[10px] uppercase font-bold rounded ${isProfessor ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{payload.papel}</span>
        {status === 'reconnecting' && <span className="px-2 py-0.5 text-[9px] md:text-[10px] rounded font-medium bg-yellow-500/20 text-yellow-400">Reconectando...</span>}
        <span className={`px-2 py-0.5 text-[9px] md:text-[10px] font-mono font-bold rounded ${timerColor}`}>⏱ {formatTime(remainingMs)}</span>
        <QualityIndicator quality={connectionQuality} />
      </div>

      {/* Vídeo remoto */}
      <div className={`absolute inset-0 z-0 transition-all duration-150 ${remoteSpeaking ? 'ring-4 ring-inset ring-emerald-400/40' : ''}`}>
        <RemoteVideo className="w-full h-full object-cover" fallbackText="" />
      </div>

      {/* PiP arrastável (Menor no celular) */}
      <Draggable nodeRef={janelaVideoRef} bounds="parent" defaultPosition={{ x: 0, y: 0 }}>
        <div ref={janelaVideoRef} className={`absolute top-20 right-4 md:top-6 md:right-6 z-20 w-32 sm:w-48 md:w-72 aspect-video bg-slate-900 rounded-lg md:rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-150 group cursor-grab active:cursor-grabbing ${isSpeaking ? 'border-emerald-400 shadow-emerald-400/30 shadow-lg' : 'border-white/5'}`}>
          <div className="absolute inset-y-0 left-0 w-4 md:w-6 flex items-center justify-center bg-slate-800/80 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="text-white/40 w-3 h-3 md:w-4 md:h-4" />
          </div>
          {isCamOn
            ? <LocalVideo className="w-full h-full object-cover scale-x-[-1]" />
            : <div className="w-full h-full flex items-center justify-center bg-slate-900"><Avatar nome={payload.nome} avatar={payload.avatar} size="sm" /></div>
          }
          <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 px-1.5 md:px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[8px] md:text-xs text-white/70 flex items-center gap-1">
            {!isMicOn && <MicOff className="text-red-400 w-2 h-2 md:w-2.5 md:h-2.5" />}
            {!isCamOn && <VideoOff className="text-red-400 w-2 h-2 md:w-2.5 md:h-2.5" />}
            <span className="hidden sm:inline">{payload.nome}</span> (Você)
          </div>
        </div>
      </Draggable>

      {/* Controles Responsivos */}
      <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 md:gap-4 bg-slate-900/90 backdrop-blur-lg px-4 py-3 md:px-8 md:py-5 rounded-full shadow-2xl border border-white/10 w-auto whitespace-nowrap">
        <ControlBtn onClick={toggleMic} active={isMicOn}>
          {isMicOn ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6" />}
        </ControlBtn>
        <ControlBtn onClick={toggleCam} active={isCamOn}>
          {isCamOn ? <VideoIcon className="w-5 h-5 md:w-6 md:h-6" /> : <VideoOff className="w-5 h-5 md:w-6 md:h-6" />}
        </ControlBtn>
        <div className="w-px h-6 md:h-10 bg-white/10 mx-1 md:mx-2" />
        <button onClick={sair} className="flex items-center gap-2 md:gap-3 px-5 py-2.5 md:px-8 md:py-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold text-sm md:text-lg shadow-lg transition-all hover:scale-105">
          <PhoneOff className="w-4 h-4 md:w-6 md:h-6" /> <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// RAIZ
// ============================================================================
export default function App() {
  const [payload,     setPayload]     = useState(() => readSession().payload     || null);
  const [salaAtivaId, setSalaAtivaId] = useState(() => readSession().salaAtivaId || null);

  const salvar = (p, id) => localStorage.setItem(SESSION_KEY, JSON.stringify({ payload: p, salaAtivaId: id }));

  useEffect(() => {
    if (!payload) return;
    const roomId = payload.chave || salaAtivaId;
    if (roomId) salvar(payload, roomId);
  }, [payload, salaAtivaId]);

  const handleSair      = () => { localStorage.removeItem(SESSION_KEY); setPayload(null); setSalaAtivaId(null); };
  const handleSetSalaId = (id) => { setSalaAtivaId(id); salvar(payload, id); };

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] bg-slate-950">
      {!payload ? (
        <TelaDeMock onInjetarJson={setPayload} salaAtivaId={salaAtivaId} />
      ) : (
        <PsiuFlashProvider serverUrl={SERVER_URL} vibes>
          <SalaDeVideo payload={payload} salaId={salaAtivaId} setSalaId={handleSetSalaId} onSair={handleSair} />
        </PsiuFlashProvider>
      )}
    </div>
  );
}