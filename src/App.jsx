import { useState } from 'react';
import { S, Btn } from './UI.jsx';
import { INIT_PACIENTES, INIT_DESTINOS, INIT_MOTORISTAS, INIT_VEICULOS, INIT_ADMINS, INIT_VIAGENS, fmtDate, TODAY } from './data.js';
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

function LoginScreen({ motoristas, onLogin, onPaciente }) {
  const [perfil, setPerfil] = useState("motorista");
  const [motoristaId, setMotoristaId] = useState(motoristas[0]?.id || 1);

  return (
    <div style={{ minHeight:"100vh", background:"#050c18", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans', sans-serif", padding:20 }}>
      <div style={{ background:"#0a1628", borderRadius:24, padding:36, width:"100%", maxWidth:400, border:"1px solid #1e3a5f", textAlign:"center" }}>
        <div style={{ width:72, height:72, borderRadius:20, background:"linear-gradient(135deg,#3b82f6,#10b981)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, margin:"0 auto 20px" }}>🚑</div>
        <div style={{ fontSize:10, color:"#64748b", letterSpacing:3, textTransform:"uppercase", marginBottom:6 }}>SECRETARIA MUNICIPAL DE SAÚDE</div>
        <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>TransporteSaúde</div>
        <div style={{ fontSize:13, color:"#64748b", marginBottom:28 }}>Sistema de Controle de Passageiros</div>

        <div style={{ display:"flex", background:"#070f1f", borderRadius:12, padding:4, marginBottom:22, border:"1px solid #1e3a5f" }}>
          {[["motorista","🚐 Motorista"],["admin","🏥 Secretaria"]].map(([p,l]) => (
            <button key={p} onClick={()=>setPerfil(p)} style={{ flex:1, padding:10, background:perfil===p?"#1e3a5f":"none", border:"none", borderRadius:10, color:perfil===p?"#fff":"#64748b", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
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

      {/* Botão paciente */}
      <button onClick={onPaciente} style={{ marginTop:20, background:"none", border:"1px solid #1e3a5f", color:"#64748b", borderRadius:12, padding:"10px 24px", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans', sans-serif" }}>
        👤 Sou Paciente — Consultar Minhas Viagens
      </button>

      <div style={{ marginTop:24, fontSize:11, color:"#1e3a5f", textAlign:"center" }}>
        TransporteSaúde v1.0 · {fmtDate(TODAY)}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null); // null | { perfil, motoristaId }
  const [painelPaciente, setPainelPaciente] = useState(false);
  const [viagens, setViagens] = useState(INIT_VIAGENS);
  const [db, setDb] = useState({
    pacientes: INIT_PACIENTES,
    destinos:  INIT_DESTINOS,
    motoristas:INIT_MOTORISTAS,
    veiculos:  INIT_VEICULOS,
    admins:    INIT_ADMINS,
  });

  function handleStatusChange(viagemId, paxId, newStatus) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : {
      ...v, passageiros: v.passageiros.map(p => p.id !== paxId ? p : { ...p, status: newStatus })
    }));
  }

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
            ? <DriverView viagens={viagens} setViagens={setViagens} onStatusChange={handleStatusChange} motoristaId={session.motoristaId} motoristas={db.motoristas}/>
            : <AdminView db={db} setDb={setDb} viagens={viagens} setViagens={setViagens} onStatusChange={handleStatusChange}/>
      }
    </>
  );
}
