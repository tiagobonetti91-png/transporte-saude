import { useState, useEffect, useCallback } from 'react';
import { supabase, apiPacientes, apiDestinos, apiMotoristas, apiVeiculos, apiAdmins, apiViagens, mapPaciente, mapDestino, mapMotorista, mapVeiculo, fmtDate, TODAY } from './data.js';
import { Btn } from './UI.jsx';
import LoginScreen from './Auth.jsx';
import DriverView from './DriverView.jsx';
import AdminView from './AdminView.jsx';
import PainelPaciente from './PainelPaciente.jsx';

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
      <div style={{ fontSize:34,margin:"0 auto 14px" }}><img src="/logo.png" style={{width:52,height:52,borderRadius:12,objectFit:"cover"}}/></div>
      <div style={{ fontSize:16, color:"#38bdf8", fontWeight:600 }}>{msg}</div>
      <div style={{ fontSize:12, color:"#475569", marginTop:8 }}>Aguarde...</div>
    </div>
  );
}

export default function App() {
  const [authState, setAuthState] = useState("checking"); // checking | logado | deslogado
  const [session, setSession] = useState(null);   // { user, perfil }
  const [painelPaciente, setPainelPaciente] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viagens, setViagens] = useState([]);
  const [db, setDb] = useState({ pacientes:[], destinos:[], motoristas:[], veiculos:[], admins:[] });

  // Verificar sessão salva ao abrir o app
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const { data: perfData } = await supabase.from("perfis").select("*").eq("id", data.session.user.id).single();
        if (perfData?.ativo) {
          setSession({ user: data.session.user, perfil: perfData });
          setAuthState("logado");
        } else {
          setAuthState("deslogado");
        }
      } else {
        setAuthState("deslogado");
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
      const [pacientes, destinos, motoristas, veiculos, admins, viagens] = await Promise.all([
        apiPacientes.listar(), apiDestinos.listar(), apiMotoristas.listar(),
        apiVeiculos.listar(), apiAdmins.listar(), apiViagens.listar(),
      ]);
      setDb({
        pacientes: (pacientes||[]).map(mapPaciente),
        destinos:  (destinos||[]).map(mapDestino),
        motoristas:(motoristas||[]).map(mapMotorista),
        veiculos:  (veiculos||[]).map(mapVeiculo),
        admins:    admins||[],
      });
      setViagens(viagens||[]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // Carregar dados quando logar
  useEffect(() => {
    if (authState === "logado") carregarTudo();
  }, [authState, carregarTudo]);

  async function handleLogin(user, perfil) {
    setSession({ user, perfil });
    setAuthState("logado");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setAuthState("deslogado");
    setViagens([]);
    setDb({ pacientes:[], destinos:[], motoristas:[], veiculos:[], admins:[] });
  }

  async function handleStatusChange(viagemId, paxId, newStatus) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : {
      ...v, passageiros: v.passageiros.map(p => p.id !== paxId ? p : { ...p, status: newStatus })
    }));
    await apiViagens.atualizarStatusPassageiro(paxId, newStatus);
  }

  async function handleAssinatura(viagemId, paxId, svg) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : {
      ...v, passageiros: v.passageiros.map(p => p.id !== paxId ? p : { ...p, assinatura: svg })
    }));
    await apiViagens.atualizarAssinatura(paxId, svg);
  }

  async function handleAbastecimento(viagemId, dados) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : { ...v, abastecimento: dados }));
    await apiViagens.atualizarAbastecimento(viagemId, dados);
  }

  // Estados de carregamento
  if (authState === "checking") return <><style>{GS}</style><Loading msg="Verificando sessão..."/></>;
  if (authState === "logado" && loading) return <><style>{GS}</style><Loading msg="Carregando dados..."/></>;

  const perfil = session?.perfil;

  return (
    <>
      <style>{GS}</style>

      {/* Botão logout fixo quando logado */}
      {authState === "logado" && !painelPaciente && (
        <div style={{ position:"fixed", top:10, right:10, zIndex:300, display:"flex", gap:8, alignItems:"center" }}>
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
