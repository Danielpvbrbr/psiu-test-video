import { useEffect, useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, GripVertical, User, GraduationCap, AlertTriangle, Loader2, KeyRound, Clock, Link as LinkIcon, Hash, Image as ImageIcon, Users, Copy, Check, Volume2, VolumeX } from 'lucide-react';
import { PsiuFlashProvider, LocalVideo, RemoteVideo, usePsiuFlash, formatTime } from 'psiu-meet-client';

const SERVER_URL = 'https://psiumeet.azurewebsites.net';
const SESSION_KEY = 'psiu_session';

const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {}; } catch { return {}; } };

const QUALITY_MAP = {
  good: { bars: 3, color: 'bg-emerald-400', label: 'Boa' },
  fair: { bars: 2, color: 'bg-yellow-400', label: 'Regular' },
  poor: { bars: 1, color: 'bg-red-400', label: 'Ruim' },
  unknown: { bars: 0, color: 'bg-slate-600', label: '' },
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

function InputField({ label, icon: Icon, type = "text", value, onChange, placeholder, disabled = false }) {
  return (
    <div className="mb-4">
      <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 md:w-5 md:h-5" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-950/50 text-white text-sm md:text-base p-2.5 md:p-3 ${Icon ? 'pl-9 md:pl-10' : 'pl-4'} rounded-xl border border-slate-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}

function ChaveCopiavel({ chave }) {
  const [copiado, setCopiado] = useState(false);
  if (!chave) return null;
  const copiar = () => { navigator.clipboard.writeText(chave); setCopiado(true); setTimeout(() => setCopiado(false), 2000); };
  return (
    <div onClick={copiar} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 cursor-pointer px-2 py-1 rounded-md transition-all active:scale-95 border border-slate-700/50" title="Copiar chave">
      <span className="text-[10px] md:text-xs font-mono text-slate-300 max-w-[70px] sm:max-w-[150px] truncate">{chave}</span>
      {copiado ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-400" />}
    </div>
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
      <button onClick={onCancelar} className="mt-4 px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-all">Cancelar</button>
    </div>
  );
}

function TelaErroAcesso({ mensagem, onVoltar }) {
  const msg = mensagem === 'Sala não existe.' ? 'A chave está incorreta ou esta sala já foi finalizada.' : mensagem;
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 p-4">
      <div className="flex flex-col items-center gap-4 bg-slate-900 border border-red-500/30 rounded-3xl px-6 py-8 md:px-12 md:py-10 text-center max-w-sm w-full shadow-2xl">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-500/10 flex items-center justify-center"><AlertTriangle className="text-red-400 w-7 h-7 md:w-8 md:h-8" /></div>
        <h2 className="text-xl md:text-2xl font-bold text-white">Acesso Negado</h2>
        <p className="text-slate-400 text-xs md:text-sm">{msg}</p>
        <button onClick={onVoltar} className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all active:scale-95 border border-slate-700 text-sm md:text-base">Voltar ao painel</button>
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
      <div className="flex flex-col items-center gap-4 bg-slate-900 border border-slate-700/50 rounded-3xl px-8 py-10 shadow-2xl text-center max-w-sm w-full">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center"><PhoneOff className="text-red-400 w-7 h-7" /></div>
        <div><h2 className="text-xl font-bold text-white">Chamada Encerrada</h2><p className="text-slate-400 text-xs mt-1">O tempo da aula foi atingido.</p></div>
        <div className="text-6xl font-black text-white tabular-nums mt-2">{contador}</div>
      </div>
    </div>
  );
}

// ============================================================================
// LOBBY
// ============================================================================
function LobbyDeAcesso({ onConectar, salaAtivaId }) {
  const [copiado, setCopiado] = useState(false);

  const [profNome, setProfNome] = useState('Daniel');
  const [profId, setProfId] = useState('usr_daniel_001');
  const [profAvatar, setProfAvatar] = useState('https://ui-avatars.com/api/?name=Daniel&background=0D8ABC&color=fff');
  const [profTempo, setProfTempo] = useState('60');
  const [profMaxPart, setProfMaxPart] = useState('2');
  const [profChave, setProfChave] = useState('');

  const [alunoNome, setAlunoNome] = useState('Gabriel');
  const [alunoId, setAlunoId] = useState('usr_gabriel_002');
  const [alunoAvatar, setAlunoAvatar] = useState('https://ui-avatars.com/api/?name=Gabriel&background=10B981&color=fff');
  const [alunoChave, setAlunoChave] = useState(salaAtivaId || '');

  useEffect(() => { if (salaAtivaId) setAlunoChave(salaAtivaId); }, [salaAtivaId]);

  const copiarChave = () => {
    if (!salaAtivaId) return;
    navigator.clipboard.writeText(salaAtivaId);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleEntrarProfessor = () => {
    const payload = {
      papel: 'professor',
      nome: profNome,
      id: profId,
      chave: profChave.trim(),
      tempo: Number(profTempo),
      maxParticipants: Number(profMaxPart),
      avatar: profAvatar,
    };
    onConectar(payload);
  };

  const handleEntrarAluno = () => {
    if (!alunoChave.trim()) return alert("O aluno precisa da chave da sala!");
    const payload = {
      papel: 'aluno',
      nome: alunoNome,
      id: alunoId,
      chave: alunoChave.trim(),
      avatar: alunoAvatar,
    };
    onConectar(payload);
  };

  return (
    <div className="flex flex-col items-center md:justify-center w-full h-full bg-slate-950 text-slate-200 p-4 py-10 md:p-6 overflow-x-hidden overflow-y-auto pb-24">

      <div className="text-center mb-6 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">PsiuMeet<span className="text-blue-500">.</span></h1>
        <p className="text-slate-400 text-sm md:text-base">Acesso rápido com Payload Customizado</p>
      </div>

      {salaAtivaId && (
        <div className="mb-6 md:mb-8 flex items-center justify-between gap-3 bg-blue-900/30 border border-blue-500 rounded-xl p-2 pl-4 w-full max-w-md shadow-[0_0_15px_rgba(59,130,246,0.15)] shrink-0">
          <span className="text-blue-300 font-mono text-xs md:text-sm truncate flex-1">
            <strong>Sala ativa:</strong> {salaAtivaId}
          </span>
          <button onClick={copiarChave} className="flex-shrink-0 p-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all active:scale-95" title="Copiar Chave">
            {copiado ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 w-full max-w-5xl pb-10 shrink-0">

        {/* Painel do Professor */}
        <div className="flex-1 bg-slate-900 border border-blue-500/20 p-5 md:p-8 rounded-3xl shadow-xl flex flex-col relative shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 rounded-xl"><GraduationCap className="text-blue-400 w-6 h-6" /></div>
            <div><h2 className="text-lg md:text-xl font-bold text-white">Criar (Professor)</h2></div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <InputField label="Nome" icon={User} value={profNome} onChange={setProfNome} />
            <InputField label="ID do Usuário" icon={Hash} value={profId} onChange={setProfId} />
            <InputField label="Tempo (min)" icon={Clock} type="number" value={profTempo} onChange={setProfTempo} />
            <InputField label="Máx. Alunos" icon={Users} type="number" value={profMaxPart} onChange={setProfMaxPart} />
            <div className="md:col-span-2">
              <InputField label="URL do Avatar" icon={ImageIcon} value={profAvatar} onChange={setProfAvatar} />
              <InputField label="Forçar Chave Fixa (Opcional)" icon={KeyRound} value={profChave} onChange={setProfChave} placeholder="Deixe em branco p/ gerar auto" />
            </div>
          </div>

          <button onClick={handleEntrarProfessor} className="mt-4 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm md:text-base rounded-xl transition-all shadow-lg active:scale-[0.98]">
            Injetar e Abrir Sala
          </button>
        </div>

        {/* Painel do Aluno */}
        <div className="flex-1 bg-slate-900 border border-emerald-500/20 p-5 md:p-8 rounded-3xl shadow-xl flex flex-col relative shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/20 rounded-xl"><User className="text-emerald-400 w-6 h-6" /></div>
            <div><h2 className="text-lg md:text-xl font-bold text-white">Entrar (Aluno)</h2></div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-4 h-full content-start">
            <InputField label="Nome" icon={User} value={alunoNome} onChange={setAlunoNome} />
            <InputField label="ID do Usuário" icon={Hash} value={alunoId} onChange={setAlunoId} />
            <div className="md:col-span-2">
              <InputField label="URL do Avatar" icon={ImageIcon} value={alunoAvatar} onChange={setAlunoAvatar} />
              <div className="mt-4 md:mt-8 p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl">
                <InputField label="Chave da Sala (Obrigatório)" icon={LinkIcon} value={alunoChave} onChange={setAlunoChave} placeholder="Cole o código aqui..." />
              </div>
            </div>
          </div>

          <button onClick={handleEntrarAluno} className="mt-4 w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm md:text-base rounded-xl transition-all shadow-lg active:scale-[0.98]">
            Conectar na Sala
          </button>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// SALA DE VÍDEO
// ============================================================================
// ============================================================================
// GRID DINÂMICO — substitua apenas o componente SalaDeVideo no seu App.jsx
// Comportamento:
//   0 remotos → tela de espera centralizada
//   1 remoto  → tela cheia (igual ao atual)
//   2 remotos → dois tiles lado a lado
//   3 remotos → dois em cima, um embaixo centralizado
//   4 remotos → grade 2×2
//   5+        → grade 2 colunas, linhas crescem conforme necessário
// ============================================================================

// ─── helper: classes do grid por quantidade ───────────────────────────────
function gridClasses(count) {
  if (count <= 1) return 'grid-cols-1 grid-rows-1';
  if (count === 2) return 'grid-cols-2 grid-rows-1';
  if (count === 3) return 'grid-cols-2 grid-rows-2';
  if (count === 4) return 'grid-cols-2 grid-rows-2';
  return 'grid-cols-2'; // 5+ → linhas automáticas
}

// ─── tile de vídeo remoto ──────────────────────────────────────────────────
function RemoteTile({ userId, stream, muted, isSpeaking, isLast, isOdd }) {
  return (
    <div
      className={`
        relative bg-slate-900 overflow-hidden
        transition-all duration-150
        ${isSpeaking ? 'ring-2 ring-inset ring-emerald-400/60' : ''}
        ${isLast && isOdd ? 'col-span-2' : ''}
      `}
    >
      <RemoteVideo
        stream={stream}
        muted={muted}
        className="w-full h-full object-cover"
        fallbackText=""
      />
      {/* label do participante */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[10px] text-white/80 font-medium">
        {userId}
      </div>
      {/* anel de fala */}
      {isSpeaking && (
        <div className="absolute inset-0 ring-2 ring-inset ring-emerald-400/40 pointer-events-none rounded-none" />
      )}
    </div>
  );
}

// ─── sala principal ────────────────────────────────────────────────────────
function SalaDeVideo({ payload, onSair, salaId, setSalaId }) {
  const {
    connect, leaveRoom, onExpired,
    toggleMic, toggleCam,
    isMicOn, isCamOn,
    status, error, remainingMs,
    isSpeaking, remoteStreams, connectionQuality,
  } = usePsiuFlash();

  const [encerrando,     setEncerrando]     = useState(false);
  const [isRemoteMuted,  setIsRemoteMuted]  = useState(false);
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
  const count       = remoteStreams.length;
  const isOdd       = count % 2 !== 0;

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden text-white">

      {encerrando && <ModalEncerramento onFim={sair} />}

      {avisoFim && !encerrando && (
        <div className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-yellow-500 text-yellow-950 px-4 py-2 rounded-full shadow-lg font-semibold text-xs md:text-sm whitespace-nowrap">
          ⏳ Encerrando em {formatTime(remainingMs)}
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-auto z-30 flex flex-wrap items-center gap-2 md:gap-3 bg-slate-900/80 backdrop-blur-md px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-white/10 shadow-lg justify-center md:justify-start">
        {payload.avatar && <Avatar nome={payload.nome} avatar={payload.avatar} size="sm" />}
        <span className="text-xs font-semibold text-slate-200 max-w-[80px] md:max-w-none truncate">{payload.nome}</span>
        <ChaveCopiavel chave={payload.chave || salaId} />
        <span className={`px-2 py-0.5 text-[9px] md:text-[10px] uppercase font-bold rounded ${isProfessor ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {payload.papel}
        </span>
        {status === 'reconnecting' && (
          <span className="px-2 py-0.5 text-[9px] md:text-[10px] rounded font-medium bg-yellow-500/20 text-yellow-400">
            Reconectando...
          </span>
        )}
        <span className={`px-2 py-0.5 text-[9px] md:text-[10px] font-mono font-bold rounded ${timerColor}`}>
          ⏱ {formatTime(remainingMs)}
        </span>
        <QualityIndicator quality={connectionQuality} />
      </div>

      {/* ── ÁREA DE VÍDEO REMOTO ────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {count === 0 ? (
          // Ninguém conectado ainda — placeholder centralizado
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-600">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-600" />
            </div>
            <span className="text-sm font-medium">Aguardando participantes...</span>
          </div>
        ) : count === 1 ? (
          // Tela cheia — comportamento original
          <RemoteTile
            userId={remoteStreams[0].userId}
            stream={remoteStreams[0].stream}
            muted={isRemoteMuted}
            isSpeaking={false}
            isLast={false}
            isOdd={false}
          />
        ) : (
          // Grade dinâmica para 2+ participantes
          <div className={`grid w-full h-full gap-[2px] bg-black ${gridClasses(count)}`}>
            {remoteStreams.map(({ userId, stream }, i) => (
              <RemoteTile
                key={userId}
                userId={userId}
                stream={stream}
                muted={isRemoteMuted}
                isSpeaking={false}
                isLast={i === count - 1}
                isOdd={isOdd}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── PiP LOCAL ───────────────────────────────────────────────────── */}
      <Draggable nodeRef={janelaVideoRef} bounds="parent" defaultPosition={{ x: 0, y: 0 }} handle=".drag-handle">
        <div
          ref={janelaVideoRef}
          className={`
            absolute top-24 right-4 md:top-6 md:right-6 z-20
            w-36 sm:w-48 md:w-72
            aspect-[9/14] md:aspect-video
            bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-150 group
            ${isSpeaking ? 'border-emerald-400 shadow-emerald-400/30 shadow-lg' : 'border-white/5'}
          `}
        >
          {/* drag handle */}
          <div className="absolute top-0 left-0 right-0 h-8 md:h-10 bg-gradient-to-b from-black/60 to-transparent z-10 drag-handle cursor-grab active:cursor-grabbing flex justify-center items-start pt-1.5 md:pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="text-white/70 w-4 h-4 md:w-5 md:h-5 drop-shadow-md" />
          </div>

          {isCamOn ? (
            <LocalVideo className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <Avatar nome={payload.nome} avatar={payload.avatar} size="sm" />
            </div>
          )}

          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[8px] md:text-[10px] text-white/80 font-medium z-10">
            Você
          </div>

          {/* controles mic/cam dentro do PiP */}
          <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-center justify-center gap-2 md:gap-3 z-20">
            <button
              onClick={toggleMic}
              className={`p-1.5 md:p-2.5 rounded-full backdrop-blur-md transition-all active:scale-95 ${isMicOn ? 'bg-slate-800/80 hover:bg-slate-700 text-white border border-white/10' : 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
              title={isMicOn ? 'Desativar Microfone' : 'Ativar Microfone'}
            >
              {isMicOn ? <Mic className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <MicOff className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            </button>
            <button
              onClick={toggleCam}
              className={`p-1.5 md:p-2.5 rounded-full backdrop-blur-md transition-all active:scale-95 ${isCamOn ? 'bg-slate-800/80 hover:bg-slate-700 text-white border border-white/10' : 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}
              title={isCamOn ? 'Desativar Câmera' : 'Ativar Câmera'}
            >
              {isCamOn ? <VideoIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <VideoOff className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            </button>
          </div>
        </div>
      </Draggable>

      {/* ── BOTTOM BAR ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 md:gap-6 bg-slate-900/90 backdrop-blur-lg px-6 py-3 md:px-8 md:py-4 rounded-full shadow-2xl border border-white/10 whitespace-nowrap">

        <div className="flex flex-col items-center gap-1.5">
          <ControlBtn onClick={() => setIsRemoteMuted(v => !v)} active={!isRemoteMuted}>
            {isRemoteMuted ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
          </ControlBtn>
          <span className="text-[8px] md:text-[9px] text-slate-400 font-bold tracking-wider uppercase">
            {isRemoteMuted ? 'Mutado' : 'Ouvir'}
          </span>
        </div>

        <div className="w-px h-8 md:h-10 bg-white/10 mx-1 md:mx-2" />

        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={sair}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95"
            title="Encerrar Chamada"
          >
            <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <span className="text-[8px] md:text-[9px] text-red-400 font-bold tracking-wider uppercase">Encerrar</span>
        </div>

      </div>
    </div>
  );
}
// ============================================================================
// RAIZ
// ============================================================================
export default function App() {
  const [payload, setPayload] = useState(() => readSession().payload || null);
  const [salaAtivaId, setSalaAtivaId] = useState(() => readSession().salaAtivaId || null);

  const salvar = (p, id) => localStorage.setItem(SESSION_KEY, JSON.stringify({ payload: p, salaAtivaId: id }));

  useEffect(() => {
    if (!payload) return;
    const roomId = payload.chave || salaAtivaId;
    if (roomId) salvar(payload, roomId);
  }, [payload, salaAtivaId]);

  const handleSair = () => { localStorage.removeItem(SESSION_KEY); setPayload(null); setSalaAtivaId(null); };
  const handleSetSalaId = (id) => { setSalaAtivaId(id); salvar(payload, id); };

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] bg-slate-950">
      {!payload ? (
        <LobbyDeAcesso onConectar={setPayload} salaAtivaId={salaAtivaId} />
      ) : (
        <PsiuFlashProvider serverUrl={SERVER_URL} vibes>
          <SalaDeVideo payload={payload} salaId={salaAtivaId} setSalaId={handleSetSalaId} onSair={handleSair} />
        </PsiuFlashProvider>
      )}
    </div>
  );
}