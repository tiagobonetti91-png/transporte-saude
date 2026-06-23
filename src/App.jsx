import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, apiPacientes, apiDestinos, apiMotoristas, apiVeiculos, apiAdmins, apiViagens, mapPaciente, mapDestino, mapMotorista, mapVeiculo, fmtDate, TODAY } from './data.js';
import { Btn } from './UI.jsx';
import LoginScreen from './Auth.jsx';
import DriverView from './DriverView.jsx';
import AdminView from './AdminView.jsx';
import PainelPaciente from './PainelPaciente.jsx';

const OFFLINE_CACHE_KEY = "rota_offline_cache_v1";
const OFFLINE_QUEUE_KEY = "rota_offline_queue_v1";
const OFFLINE_SESSION_KEY = "rota_offline_session_v1";

const GS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #050c18; }
  ::-webkit-scrollbar { width:6px; height:6px; }
  ::-webkit-scrollbar-track { background:#070f1f; }
  ::-webkit-scrollbar-thumb { background:#1e3a5f; border-radius:4px; }
  input[type=date]::-webkit-calendar-picker-indicator,
  input[type=time]::-webkit-calendar-picker-indicator,
  input[type=month]::-webkit-calendar-picker-indicator { filter:invert(0.5); cursor:pointer; }
`;

function Loading({ msg="Carregando..." }) {
  return (
    <div style={{ minHeight:"100vh", background:"#050c18", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ fontSize:48, marginBottom:20 }}>🚑</div>
      <div style={{ fontSize:16, color:"#38bdf8", fontWeight:600 }}>{msg}</div>
      <div style={{ fontSize:12, color:"#475569", marginTop:8 }}>Aguarde...</div>
    </div>
  );
}

function readStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch(e) {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
}

function isNetworkError(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  return !navigator.onLine || msg.includes("failed to fetch") || msg.includes("network") || msg.includes("fetch");
}

export default function App() {
  const [authState, setAuthState] = useState("checking"); // checking | logado | deslogado
  const [session, setSession] = useState(null);   // { user, perfil }
  const [painelPaciente, setPainelPaciente] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viagens, setViagens] = useState([]);
  const [db, setDb] = useState({ pacientes:[], destinos:[], motoristas:[], veiculos:[], admins:[] });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingSync, setPendingSync] = useState(() => readStoredJson(OFFLINE_QUEUE_KEY, []).length);
  const syncingRef = useRef(false);

  // Verificar sessão salva ao abrir o app
  useEffect(() => {
    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          if (!navigator.onLine) {
            const offlineSession = readStoredJson(OFFLINE_SESSION_KEY, null);
            if (offlineSession?.perfil?.ativo) {
              setSession({ user:data.session.user, perfil:offlineSession.perfil });
              setAuthState("logado");
              return;
            }
          }

          const { data: perfData } = await supabase.from("perfis").select("*").eq("id", data.session.user.id).single();
          if (perfData?.ativo) {
            const nextSession = { user: data.session.user, perfil: perfData };
            setSession(nextSession);
            writeStoredJson(OFFLINE_SESSION_KEY, nextSession);
            setAuthState("logado");
          } else {
            setAuthState("deslogado");
          }
        } else {
          const offlineSession = readStoredJson(OFFLINE_SESSION_KEY, null);
          if (!navigator.onLine && offlineSession?.perfil?.ativo) {
            setSession(offlineSession);
            setAuthState("logado");
            return;
          }
          setAuthState("deslogado");
        }
      } catch(e) {
        const offlineSession = readStoredJson(OFFLINE_SESSION_KEY, null);
        if (offlineSession?.perfil?.ativo) {
          setSession(offlineSession);
          setAuthState("logado");
        } else {
          setAuthState("deslogado");
        }
      }
    }
    checkSession();

    // Ouvir evento do botão paciente na tela de login
    const handler = () => setPainelPaciente(true);
    window.addEventListener("openPaciente", handler);
    return () => window.removeEventListener("openPaciente", handler);
  }, []);

  const carregarTudo = useCallback(async () => {
    try {
      setLoading(true);
      if (!navigator.onLine) {
        const cache = readStoredJson(OFFLINE_CACHE_KEY, null);
        if (cache?.db && cache?.viagens) {
          setDb(cache.db);
          setViagens(cache.viagens);
        }
        return;
      }

      const [pacientes, destinos, motoristas, veiculos, admins, viagens] = await Promise.all([
        apiPacientes.listar(), apiDestinos.listar(), apiMotoristas.listar(),
        apiVeiculos.listar(), apiAdmins.listar(), apiViagens.listar(),
      ]);
      const nextDb = {
        pacientes: (pacientes||[]).map(mapPaciente),
        destinos:  (destinos||[]).map(mapDestino),
        motoristas:(motoristas||[]).map(mapMotorista),
        veiculos:  (veiculos||[]).map(mapVeiculo),
        admins:    admins||[],
      };
      const nextViagens = viagens||[];
      setDb(nextDb);
      setViagens(nextViagens);
      writeStoredJson(OFFLINE_CACHE_KEY, { db:nextDb, viagens:nextViagens, savedAt:Date.now() });
    } catch(e) {
      console.error(e);
      const cache = readStoredJson(OFFLINE_CACHE_KEY, null);
      if (cache?.db && cache?.viagens) {
        setDb(cache.db);
        setViagens(cache.viagens);
      }
    }
    finally { setLoading(false); }
  }, []);

  function enqueueOfflineAction(action) {
    const queue = readStoredJson(OFFLINE_QUEUE_KEY, []);
    const next = [...queue, { ...action, id:Date.now()+"-"+Math.random().toString(16).slice(2) }];
    writeStoredJson(OFFLINE_QUEUE_KEY, next);
    setPendingSync(next.length);
  }

  const syncOfflineQueue = useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return;
    const queue = readStoredJson(OFFLINE_QUEUE_KEY, []);
    if (queue.length === 0) { setPendingSync(0); return; }

    syncingRef.current = true;
    setSyncing(true);
    const remaining = [];
    for (let index = 0; index < queue.length; index++) {
      const action = queue[index];
      try {
        if (action.type === "status") {
          await apiViagens.atualizarStatusPassageiro(action.paxId, action.status);
        } else if (action.type === "assinatura") {
          await apiViagens.atualizarAssinatura(action.paxId, action.assinatura);
        } else if (action.type === "abastecimento") {
          await apiViagens.atualizarAbastecimento(action.viagemId, action.abastecimento);
        }
      } catch(e) {
        remaining.push(action);
        if (isNetworkError(e)) {
          remaining.push(...queue.slice(index + 1));
          break;
        }
      }
    }
    writeStoredJson(OFFLINE_QUEUE_KEY, remaining);
    setPendingSync(remaining.length);
    syncingRef.current = false;
    setSyncing(false);
    if (remaining.length === 0) carregarTudo();
  }, [carregarTudo]);

  // Carregar dados quando logar
  useEffect(() => {
    if (authState === "logado") carregarTudo();
  }, [authState, carregarTudo]);

  useEffect(() => {
    if (authState !== "logado") return;
    const hasData = viagens.length > 0 || Object.values(db).some(list => Array.isArray(list) && list.length > 0);
    if (!hasData) return;
    writeStoredJson(OFFLINE_CACHE_KEY, { db, viagens, savedAt:Date.now() });
  }, [authState, db, viagens]);

  useEffect(() => {
    function online() {
      setIsOnline(true);
      syncOfflineQueue();
      carregarTudo();
    }
    function offline() { setIsOnline(false); }
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [carregarTudo, syncOfflineQueue]);

  useEffect(() => {
    if (authState === "logado" && isOnline) syncOfflineQueue();
  }, [authState, isOnline, syncOfflineQueue]);

  async function handleLogin(user, perfil) {
    const nextSession = { user, perfil };
    setSession(nextSession);
    writeStoredJson(OFFLINE_SESSION_KEY, nextSession);
    setAuthState("logado");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem(OFFLINE_SESSION_KEY);
    setSession(null);
    setAuthState("deslogado");
    setViagens([]);
    setDb({ pacientes:[], destinos:[], motoristas:[], veiculos:[], admins:[] });
  }

  async function handleStatusChange(viagemId, paxId, newStatus) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : {
      ...v, passageiros: v.passageiros.map(p => p.id !== paxId ? p : { ...p, status: newStatus })
    }));
    try {
      await apiViagens.atualizarStatusPassageiro(paxId, newStatus);
    } catch(e) {
      if (!isNetworkError(e)) throw e;
      enqueueOfflineAction({ type:"status", paxId, status:newStatus });
    }
  }

  async function handleAssinatura(viagemId, paxId, svg) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : {
      ...v, passageiros: v.passageiros.map(p => p.id !== paxId ? p : { ...p, assinatura: svg })
    }));
    try {
      await apiViagens.atualizarAssinatura(paxId, svg);
    } catch(e) {
      if (!isNetworkError(e)) throw e;
      enqueueOfflineAction({ type:"assinatura", paxId, assinatura:svg });
    }
  }

  async function handleAbastecimento(viagemId, dados) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : { ...v, abastecimento: dados }));
    try {
      await apiViagens.atualizarAbastecimento(viagemId, dados);
    } catch(e) {
      if (!isNetworkError(e)) throw e;
      enqueueOfflineAction({ type:"abastecimento", viagemId, abastecimento:dados });
    }
  }

  // Estados de carregamento
  if (authState === "checking") return <><style>{GS}</style><Loading msg="Verificando sessão..."/></>;
  if (authState === "logado" && loading) return <><style>{GS}</style><Loading msg="Carregando dados..."/></>;

  const perfil = session?.perfil;

  return (
    <>
      <style>{GS}</style>

      {/* Botão logout fixo quando logado */}
      {authState === "logado" && !painelPaciente && perfil?.perfil !== "motorista" && (
        <div style={{ position:"fixed", top:10, right:10, zIndex:300, display:"flex", gap:8, alignItems:"center" }}>
          {(!isOnline || pendingSync > 0 || syncing) && (
            <div style={{ fontSize:11, color:isOnline?"#92400e":"#991b1b", background:isOnline?"#fffbeb":"#fef2f2", borderRadius:8, padding:"4px 10px", border:"1px solid "+(isOnline?"#fcd34d":"#fca5a5"), fontWeight:700 }}>
              {!isOnline ? "Offline" : syncing ? "Sincronizando..." : `${pendingSync} pendente(s)`}
            </div>
          )}
          <div style={{ fontSize:11, color:"#475569", background:"#0a1628", borderRadius:8, padding:"4px 10px", border:"1px solid #1e293b" }}>
            {perfil?.nome}
          </div>
          <Btn small onClick={handleLogout} color="#475569">Sair</Btn>
        </div>
      )}

      {painelPaciente
        ? <PainelPaciente viagens={viagens} pacientes={db.pacientes} onBack={()=>setPainelPaciente(false)}/>
        : authState === "deslogado"
          ? <LoginScreen onLogin={handleLogin}/>
          : perfil?.perfil === "motorista"
            ? <DriverView
                viagens={viagens} setViagens={setViagens}
                onStatusChange={handleStatusChange}
                onAssinatura={handleAssinatura}
                onAbastecimento={handleAbastecimento}
                motoristaId={perfil.motorista_id}
                motoristas={db.motoristas}
                isOnline={isOnline}
                pendingSync={pendingSync}
                syncing={syncing}
                onLogout={handleLogout}
              />
            : <AdminView
                db={db} setDb={setDb}
                viagens={viagens} setViagens={setViagens}
                onStatusChange={handleStatusChange}
                recarregar={carregarTudo}
              />
      }
    </>
  );
}