import { useState, useEffect, useCallback } from 'react';
import { S, Btn } from './UI.jsx';
import { apiPacientes, apiDestinos, apiMotoristas, apiVeiculos, apiAdmins, apiViagens, mapPaciente, mapDestino, mapMotorista, mapVeiculo, fmtDate, TODAY } from './data.js';
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

function Loading() {
  return (
    <div style={{ minHeight:"100vh", background:"#050c18", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ fontSize:48, marginBottom:20 }}>🚑</div>
      <div style={{ fontSize:16, color:"#38bdf8", fontWeight:600 }}>Carregando...</div>
      <div style={{ fontSize:12, color:"#475569", marginTop:8 }}>Conectando ao banco de dados</div>
    </div>
  );
}

function LoginScreen({ motoristas, onLogin, onPaciente }) {
  const [perfil, setPerfil] = useState("motorista");
  const [motoristaId, setMotoristaId] = useState(motoristas[0]?.id || 1);
  useEffect(() => { if(motoristas[0]) setMotoristaId(motoristas[0].id); }, [motoristas]);
  return (
    <div style={{ minHeight:"100vh", background:"#050c18", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans', sans-serif", padding:20 }}>
      <div style={{ background:"#0a1628", borderRadius:24, padding:36, width:"100%", maxWidth:400, border:"1px solid #1e3a5f", textAlign:"center" }}>
        <div style={{ width:72,height:72,borderRadius:20,background:"linear-gradient(135deg,#3b82f6,#10b981)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 20px" }}>🚑</div>
        <div style={{ fontSize:10,color:"#64748b",letterSpacing:3,textTransform:"uppercase",marginBottom:6 }}>SECRETARIA MUNICIPAL DE SAÚDE</div>
        <div style={{ fontSize:22,fontWeight:800,color:"#fff",marginBottom:4 }}>TransporteSaúde</div>
        <div style={{ fontSize:13,color:"#64748b",marginBottom:28 }}>Sistema de Controle de Passageiros</div>
        <div style={{ display:"flex",background:"#070f1f",borderRadius:12,padding:4,marginBottom:22,border:"1px solid #1e3a5f" }}>
          {[["motorista","🚐 Motorista"],["admin","🏥 Secretaria"]].map(([p,l]) => (
            <button key={p} onClick={()=>setPerfil(p)} style={{ flex:1,padding:10,background:perfil===p?"#1e3a5f":"none",border:"none",borderRadius:10,color:perfil===p?"#fff":"#64748b",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
          ))}
        </div>
        {perfil==="motorista" && (
          <div style={{ marginBottom:18 }}>
            <label style={S.label}>Selecione o Motorista</label>
            <select value={motoristaId} onChange={e=>setMotoristaId(parseInt(e.target.value))} style={S.input}>
              {motoristas.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
        )}
        <Btn full onClick={()=>onLogin(perfil, motoristaId)} color="#3b82f6" sx={{ fontSize:15, padding:"14px" }}>Entrar →</Btn>
      </div>
      <button onClick={onPaciente} style={{ marginTop:20,background:"none",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:12,padding:"10px 24px",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>
        👤 Sou Paciente — Consultar Minhas Viagens
      </button>
      <div style={{ marginTop:24,fontSize:11,color:"#1e3a5f",textAlign:"center" }}>TransporteSaúde v2.0 · {fmtDate(TODAY)}</div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [painelPaciente, setPainelPaciente] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [db, setDb] = useState({ pacientes:[], destinos:[], motoristas:[], veiculos:[], admins:[] });

  const carregarTudo = useCallback(async () => {
    try {
      setLoading(true);
      const [pacientes, destinos, motoristas, veiculos, admins, viagens] = await Promise.all([
        apiPacientes.listar(),
        apiDestinos.listar(),
        apiMotoristas.listar(),
        apiVeiculos.listar(),
        apiAdmins.listar(),
        apiViagens.listar(),
      ]);
      setDb({
        pacientes: (pacientes||[]).map(mapPaciente),
        destinos:  (destinos||[]).map(mapDestino),
        motoristas:(motoristas||[]).map(mapMotorista),
        veiculos:  (veiculos||[]).map(mapVeiculo),
        admins:    admins||[],
      });
      setViagens(viagens||[]);
      setError(null);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarTudo(); }, [carregarTudo]);

  async function handleStatusChange(viagemId, paxId, newStatus) {
    // Atualiza localmente de imediato (UI responsiva)
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : {
      ...v, passageiros: v.passageiros.map(p => p.id !== paxId ? p : { ...p, status: newStatus })
    }));
    // Salva no banco
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

  if (loading) return <><style>{GS}</style><Loading/></>;

  if (error) return (
    <div style={{ minHeight:"100vh", background:"#050c18", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:20 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
      <div style={{ fontSize:16, color:"#f87171", fontWeight:600, marginBottom:8 }}>Erro de conexão</div>
      <div style={{ fontSize:12, color:"#475569", marginBottom:20, textAlign:"center", maxWidth:360 }}>{error}</div>
      <Btn onClick={carregarTudo} color="#3b82f6">Tentar novamente</Btn>
    </div>
  );

  return (
    <>
      <style>{GS}</style>
      {session && (
        <div style={{ position:"fixed", top:10, right:10, zIndex:300 }}>
          <Btn small onClick={()=>setSession(null)} color="#475569">Sair</Btn>
        </div>
      )}
      {painelPaciente
        ? <PainelPaciente viagens={viagens} pacientes={db.pacientes} onBack={()=>setPainelPaciente(false)}/>
        : !session
          ? <LoginScreen motoristas={db.motoristas} onLogin={(perfil,mid)=>setSession({perfil,motoristaId:mid})} onPaciente={()=>setPainelPaciente(true)}/>
          : session.perfil==="motorista"
            ? <DriverView viagens={viagens} setViagens={setViagens} onStatusChange={handleStatusChange} onAssinatura={handleAssinatura} onAbastecimento={handleAbastecimento} motoristaId={session.motoristaId} motoristas={db.motoristas}/>
            : <AdminView db={db} setDb={setDb} viagens={viagens} setViagens={setViagens} onStatusChange={handleStatusChange} recarregar={carregarTudo}/>
      }
    </>
  );
}
