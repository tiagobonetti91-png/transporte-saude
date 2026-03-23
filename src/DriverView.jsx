import { useState, useEffect, useCallback } from 'react';
import { Btn, SecTitle, ViagemStatusBadge } from './UI.jsx';
import { STATUS_CONFIG, VIAGEM_STATUS, fmtDate, fmtCurrency, TODAY, apiViagens, apiTransferencias } from './data.js';
import { ModalAssinatura, ModalAbastecimento } from './Modals.jsx';

const T = {
  bg:"#f0f4f8", bgCard:"#ffffff", bgCard2:"#f8fafc", border:"#dde3ed",
  headerBg:"linear-gradient(135deg,#1a56db,#1e40af)",
  text:"#111827", textSub:"#6b7280", textMuted:"#9ca3af",
  blue:"#1a56db", green:"#059669", purple:"#7c3aed", yellow:"#d97706", red:"#dc2626",
};

const SC = {
  indefinido:{ label:"Aguardando", bg:"#eff6ff", color:"#1a56db", border:"#bfdbfe" },
  embarcado: { label:"Embarcado",  bg:"#eff6ff", color:"#1d4ed8", border:"#93c5fd" },
  entregue:  { label:"Entregue",   bg:"#f5f3ff", color:"#7c3aed", border:"#c4b5fd" },
  pronto:    { label:"Pronto",     bg:"#f0fdf4", color:"#059669", border:"#86efac" },
  recolhido: { label:"Recolhido",  bg:"#fff7ed", color:"#d97706", border:"#fcd34d" },
  ausente:   { label:"Faltou",     bg:"#fef2f2", color:"#dc2626", border:"#fca5a5" },
};

const STATUS_ORDER = ["indefinido","embarcado","entregue","pronto","recolhido","ausente"];
function sortPax(paxList) { return [...paxList].sort((a,b)=>STATUS_ORDER.indexOf(a.status)-STATUS_ORDER.indexOf(b.status)); }

// ── Modal KM ──────────────────────────────────────────────────────────────────
function ModalKm({ titulo, subtitulo, onSave, onClose }) {
  const [km,setKm]=useState("");
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20 }}>
      <div style={{ background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize:18,fontWeight:700,color:T.text,marginBottom:4 }}>{titulo}</div>
        <div style={{ fontSize:13,color:T.textSub,marginBottom:20 }}>{subtitulo}</div>
        <label style={{ fontSize:12,fontWeight:600,color:T.textSub,letterSpacing:1,display:"block",marginBottom:6,textTransform:"uppercase" }}>KM do Veiculo</label>
        <input type="number" value={km} onChange={e=>setKm(e.target.value)} placeholder="Ex: 45200" inputMode="numeric" autoFocus
          style={{ width:"100%",padding:"14px 16px",borderRadius:12,border:"2px solid #dde3ed",fontSize:20,fontWeight:700,color:T.text,background:"#f8fafc",outline:"none",boxSizing:"border-box",fontFamily:"inherit" }}/>
        <div style={{ display:"flex",gap:10,marginTop:20 }}>
          <button onClick={()=>km&&parseInt(km)>0?onSave(parseInt(km)):null} disabled={!km||parseInt(km)<=0}
            style={{ flex:1,padding:"14px",background:km&&parseInt(km)>0?T.blue:"#d1d5db",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:km?"pointer":"not-allowed",fontFamily:"inherit" }}>
            Confirmar
          </button>
          <button onClick={onClose} style={{ padding:"14px 20px",background:"#f8fafc",color:T.textSub,border:"1px solid #dde3ed",borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Transferencia ───────────────────────────────────────────────────────
function ModalTransferencia({ pax, viagem, viagensDestino, motoristas, motoristaId, onEnviar, onClose }) {
  const [motoristaDestId, setMotoristaDestId] = useState("");
  const [viagemDestId, setViagemDestId] = useState("");

  const motoristasOpcoes = motoristas.filter(m => m.id !== motoristaId);
  const viagensDoMotorista = motoristaDestId
    ? viagensDestino.filter(v =>
        v.motorista?.id === parseInt(motoristaDestId) &&
        v.data === TODAY &&
        v.status !== "cancelada" &&
        v.status !== "concluida"
      )
    : [];

  function vagasDisponiveis(v) {
    const ocupadas = v.passageiros.reduce((a,p)=>a+1+(p.acompanhantes?.length||0),0);
    const precisam = 1 + (pax.acompanhantes?.length||0);
    return (v.veiculo?.capacidade||0) - ocupadas >= precisam;
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:20 }}>
      <div style={{ background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <div style={{ fontSize:17,fontWeight:700,color:T.text }}>Transferir Passageiro</div>
          <button onClick={onClose} style={{ background:"none",border:"none",fontSize:22,color:T.textSub,cursor:"pointer" }}>x</button>
        </div>

        {/* Paciente */}
        <div style={{ background:"#f8fafc",borderRadius:12,padding:"10px 14px",marginBottom:16,border:"1px solid #e5e7eb" }}>
          <div style={{ fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:1 }}>Transferindo</div>
          <div style={{ fontSize:14,fontWeight:700,color:T.text }}>{pax.paciente?.nome}</div>
          <div style={{ fontSize:12,color:T.purple }}>{pax.destino?.nome}</div>
          {(pax.acompanhantes?.length>0)&&<div style={{ fontSize:11,color:T.textMuted }}>+{pax.acompanhantes.length} acompanhante(s)</div>}
        </div>

        {/* Selecionar motorista */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12,fontWeight:600,color:T.textSub,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1 }}>Motorista Destino</label>
          <select value={motoristaDestId} onChange={e=>{setMotoristaDestId(e.target.value);setViagemDestId("");}}
            style={{ width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid #dde3ed",fontSize:14,color:T.text,background:"#f8fafc",fontFamily:"inherit" }}>
            <option value="">Selecione...</option>
            {motoristasOpcoes.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>

        {/* Selecionar viagem */}
        {motoristaDestId && (
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12,fontWeight:600,color:T.textSub,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1 }}>Viagem Destino (hoje)</label>
            {viagensDoMotorista.length===0
              ? <div style={{ background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:10,padding:"10px 14px",fontSize:13,color:T.red }}>Nenhuma viagem disponivel hoje para este motorista</div>
              : viagensDoMotorista.map(v=>{
                  const temVaga = vagasDisponiveis(v);
                  const ocupadas = v.passageiros.reduce((a,p)=>a+1+(p.acompanhantes?.length||0),0);
                  return (
                    <div key={v.id} onClick={()=>temVaga&&setViagemDestId(v.id)}
                      style={{ background:viagemDestId===v.id?"#eff6ff":temVaga?"#f8fafc":"#f9fafb",border:"1.5px solid "+(viagemDestId===v.id?"#1a56db":temVaga?"#e5e7eb":"#e5e7eb"),borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:temVaga?"pointer":"not-allowed",opacity:temVaga?1:0.5 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                        <div>
                          <div style={{ fontSize:13,fontWeight:600,color:T.text }}>Viagem #{v.id} - {v.horarioSaida}</div>
                          <div style={{ fontSize:11,color:T.textSub }}>{v.veiculo?.modelo} - {v.veiculo?.placa}</div>
                        </div>
                        <div style={{ fontSize:12,fontWeight:700,color:temVaga?T.green:T.red }}>
                          {ocupadas}/{v.veiculo?.capacidade} vagas
                        </div>
                      </div>
                      {!temVaga && <div style={{ fontSize:11,color:T.red,marginTop:4 }}>Sem vagas suficientes</div>}
                    </div>
                  );
                })
            }
          </div>
        )}

        <div style={{ display:"flex",gap:10 }}>
          <button onClick={()=>viagemDestId&&onEnviar(parseInt(motoristaDestId),parseInt(viagemDestId))}
            disabled={!viagemDestId}
            style={{ flex:1,padding:"12px",background:viagemDestId?T.blue:"#d1d5db",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:viagemDestId?"pointer":"not-allowed",fontFamily:"inherit" }}>
            Enviar Pedido
          </button>
          <button onClick={onClose} style={{ padding:"12px 20px",background:"#f8fafc",color:T.textSub,border:"1px solid #e5e7eb",borderRadius:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Banner de Transferencias Pendentes ────────────────────────────────────────
function BannerTransferencias({ pendentes, viagens, motoristas, onAceitar, onRecusar }) {
  if (pendentes.length === 0) return null;
  return (
    <div style={{ background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:14,padding:14,marginBottom:16 }}>
      <div style={{ fontSize:13,fontWeight:700,color:T.yellow,marginBottom:10 }}>
        📨 {pendentes.length} pedido(s) de transferencia pendente(s)
      </div>
      {pendentes.map(t=>{
        const viagem = viagens.find(v=>v.id===t.viagem_origem_id);
        const pax = viagem?.passageiros.find(p=>p.id===t.passageiro_id);
        const motOrigem = motoristas.find(m=>m.id===t.motorista_origem_id);
        const viagemDest = viagens.find(v=>v.id===t.viagem_destino_id);
        const ocupadas = viagemDest?.passageiros.reduce((a,p)=>a+1+(p.acompanhantes?.length||0),0)||0;
        const temVaga = (viagemDest?.veiculo?.capacidade||0) - ocupadas > 0;
        return (
          <div key={t.id} style={{ background:"#fff",borderRadius:10,padding:"12px 14px",marginBottom:8,border:"1px solid #fcd34d" }}>
            <div style={{ fontSize:13,fontWeight:600,color:T.text,marginBottom:2 }}>
              {pax?.paciente?.nome || "Passageiro"}
            </div>
            <div style={{ fontSize:11,color:T.purple,marginBottom:2 }}>{pax?.destino?.nome}</div>
            <div style={{ fontSize:11,color:T.textSub,marginBottom:10 }}>
              De: {motOrigem?.nome} (Viagem #{t.viagem_origem_id}) para Viagem #{t.viagem_destino_id}
            </div>
            {!temVaga && <div style={{ fontSize:11,color:T.red,marginBottom:8 }}>Atencao: sua viagem pode estar sem vagas suficientes</div>}
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>onAceitar(t)}
                style={{ flex:1,padding:"9px",background:T.green,color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
                Aceitar
              </button>
              <button onClick={()=>onRecusar(t)}
                style={{ flex:1,padding:"9px",background:"#fff",color:T.red,border:"1.5px solid #fca5a5",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
                Recusar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DriverView({ viagens, setViagens, onStatusChange, onAssinatura, onAbastecimento, motoristaId, motoristas }) {
  const [tab,setTab]=useState("roteiro");
  const [assinaturaModal,setAssinaturaModal]=useState(null);
  const [abastModal,setAbastModal]=useState(null);
  const [kmModal,setKmModal]=useState(null);
  const [expandido,setExpandido]=useState(null);
  const [transferModal,setTransferModal]=useState(null);
  const [pendentes,setPendentes]=useState([]);
  const [recusadas,setRecusadas]=useState([]);
  const [avisoRecusa,setAvisoRecusa]=useState(null);

  const motorista=motoristas.find(m=>m.id===motoristaId)||{nome:"Motorista"};
  const minhas=viagens.filter(v=>v.motorista?.id===motoristaId);
  const hoje=minhas.filter(v=>v.data===TODAY&&v.status!=="cancelada");
  const agendadas=minhas.filter(v=>v.data>TODAY&&v.status!=="cancelada").sort((a,b)=>a.data.localeCompare(b.data));
  const historico=minhas.filter(v=>v.status==="concluida"||(v.data<TODAY)).sort((a,b)=>b.data.localeCompare(a.data));
  // Viagens de outros motoristas hoje (somente visualizacao)
  const outrasHoje=viagens.filter(v=>v.motorista?.id!==motoristaId&&v.data===TODAY&&v.status!=="cancelada");

  // Verificar transferencias pendentes e recusadas periodicamente
  const verificarTransferencias = useCallback(async () => {
    try {
      const todas = await apiTransferencias.listar();
      if (!todas) return;
      // Pendentes para mim aceitar
      const p = todas.filter(t=>t.motorista_destino_id===motoristaId&&t.status==="pendente");
      setPendentes(p);
      // Recusadas de pedidos que eu fiz
      const r = todas.filter(t=>t.motorista_origem_id===motoristaId&&t.status==="recusada");
      if (r.length > 0 && !avisoRecusa) {
        setAvisoRecusa(r[r.length-1]);
        // Marcar como visto deletando ou ignorando — por simplicidade apenas limpar da lista
      }
      setRecusadas(r);
    } catch(e) { console.error(e); }
  }, [motoristaId, avisoRecusa]);

  useEffect(() => {
    verificarTransferencias();
    const interval = setInterval(verificarTransferencias, 15000); // a cada 15s
    return () => clearInterval(interval);
  }, [verificarTransferencias]);

  function salvarAssinatura(viagemId,paxId,svg,acompId=null) {
    setViagens(prev=>prev.map(v=>v.id!==viagemId?v:{
      ...v,passageiros:v.passageiros.map(p=>{
        if(p.id!==paxId) return p;
        if(acompId) return {...p,acompanhantes:(p.acompanhantes||[]).map(a=>a.id===acompId?{...a,assinatura:svg}:a)};
        return {...p,assinatura:svg};
      })
    }));
    onAssinatura&&onAssinatura(viagemId,paxId,svg);
    setAssinaturaModal(null);
  }

  async function handleKm(km) {
    const {viagemId,tipo}=kmModal;
    setKmModal(null);
    const novoStatus=tipo==="iniciar"?"em_andamento":"concluida";
    const viagem=viagens.find(v=>v.id===viagemId);
    const novoAbast=tipo==="iniciar"
      ?{...(viagem?.abastecimento||{}),kmInicial:km}
      :{...(viagem?.abastecimento||{}),kmFinal:km};
    setViagens(prev=>prev.map(v=>v.id!==viagemId?v:{...v,status:novoStatus,abastecimento:novoAbast}));
    try {
      await apiViagens.atualizarAbastecimento(viagemId,novoAbast);
      const viaAtual=viagens.find(v=>v.id===viagemId);
      if(viaAtual) await apiViagens.atualizar(viagemId,{...viaAtual,status:novoStatus,abastecimento:novoAbast});
    } catch(e){console.error(e);}
  }

  async function handleStatusChange(viagemId,paxId,newStatus) {
    setViagens(prev=>prev.map(v=>v.id!==viagemId?v:{
      ...v,passageiros:v.passageiros.map(p=>p.id!==paxId?p:{...p,status:newStatus})
    }));
    await onStatusChange(viagemId,paxId,newStatus);
  }

  async function enviarTransferencia(pax, viagem, motoristaDestId, viagemDestId) {
    setTransferModal(null);
    try {
      await apiTransferencias.criar({
        passageiroId: pax.id,
        viagemOrigemId: viagem.id,
        viagemDestinoId: viagemDestId,
        motoristaOrigemId: motoristaId,
        motoristaDestinoId: motoristaDestId,
      });
      alert("Pedido enviado! Aguarde o motorista aceitar.");
    } catch(e) { alert("Erro ao enviar: "+e.message); }
  }

  async function aceitarTransferencia(t) {
    try {
      await apiTransferencias.aceitar(t.id);
      await apiViagens.moverPassageiro(t.passageiro_id, t.viagem_destino_id);
      setPendentes(prev=>prev.filter(p=>p.id!==t.id));
      // Recarregar viagens localmente
      setViagens(prev=>{
        let paxMovido = null;
        const novas = prev.map(v=>{
          if(v.id===t.viagem_origem_id) {
            paxMovido = v.passageiros.find(p=>p.id===t.passageiro_id);
            return {...v, passageiros: v.passageiros.filter(p=>p.id!==t.passageiro_id)};
          }
          return v;
        }).map(v=>{
          if(v.id===t.viagem_destino_id && paxMovido) {
            return {...v, passageiros: [...v.passageiros, {...paxMovido, status:"indefinido"}]};
          }
          return v;
        });
        return novas;
      });
      alert("Passageiro aceito e transferido para sua viagem!");
    } catch(e) { alert("Erro ao aceitar: "+e.message); }
  }

  async function recusarTransferencia(t) {
    try {
      await apiTransferencias.recusar(t.id);
      setPendentes(prev=>prev.filter(p=>p.id!==t.id));
      alert("Transferencia recusada.");
    } catch(e) { alert("Erro ao recusar: "+e.message); }
  }

  const tabs=[
    {id:"roteiro",   label:"Hoje"},
    {id:"outras",    label:`Outros${outrasHoje.length>0?" ("+outrasHoje.length+")":""}`},
    {id:"agendadas", label:"Agendadas"},
    {id:"historico", label:"Historico"},
  ];

  return (
    <div style={{ minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'DM Sans',sans-serif" }}>

      {assinaturaModal&&<ModalAssinatura passageiro={assinaturaModal.pax} nomeOverride={assinaturaModal.nomeAcomp} onSave={svg=>salvarAssinatura(assinaturaModal.viagemId,assinaturaModal.pax.id,svg,assinaturaModal.acompId||null)} onClose={()=>setAssinaturaModal(null)}/>}
      {abastModal&&<ModalAbastecimento viagemId={abastModal.viagemId} veiculo={abastModal.veiculo} motoristaNome={motorista.nome} onSave={dados=>{onAbastecimento&&onAbastecimento(abastModal.viagemId,dados);setAbastModal(null);}} onClose={()=>setAbastModal(null)}/>}
      {kmModal&&<ModalKm titulo={kmModal.tipo==="iniciar"?"Iniciar Viagem":"Finalizar Viagem"} subtitulo={kmModal.tipo==="iniciar"?"Informe o KM atual para iniciar":"Informe o KM final para encerrar"} onSave={handleKm} onClose={()=>setKmModal(null)}/>}
      {transferModal&&(
        <ModalTransferencia
          pax={transferModal.pax}
          viagem={transferModal.viagem}
          viagensDestino={viagens}
          motoristas={motoristas}
          motoristaId={motoristaId}
          onEnviar={(mDestId,vDestId)=>enviarTransferencia(transferModal.pax,transferModal.viagem,mDestId,vDestId)}
          onClose={()=>setTransferModal(null)}
        />
      )}

      {/* Aviso de recusa */}
      {avisoRecusa&&(
        <div style={{ position:"fixed",top:0,left:0,right:0,background:"#fef2f2",border:"1px solid #fca5a5",padding:"12px 16px",zIndex:400,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <span style={{ fontSize:13,color:T.red,fontWeight:600 }}>Transferencia recusada pelo motorista destino.</span>
          <button onClick={()=>setAvisoRecusa(null)} style={{ background:"none",border:"none",color:T.red,fontSize:18,cursor:"pointer" }}>x</button>
        </div>
      )}

      {/* Header */}
      <div style={{ background:T.headerBg,padding:"20px 20px 16px",color:"#fff" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
          <div style={{ width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>🚐</div>
          <div>
            <div style={{ fontSize:10,opacity:0.7,letterSpacing:2,textTransform:"uppercase" }}>Portal do Motorista</div>
            <div style={{ fontSize:18,fontWeight:700 }}>{motorista.nome}</div>
          </div>
          {pendentes.length>0&&(
            <div style={{ marginLeft:"auto",background:"#fbbf24",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700,color:"#111" }}>
              {pendentes.length} pedido(s)
            </div>
          )}
        </div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          <div style={{ background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"4px 12px",fontSize:12 }}>📅 {fmtDate(TODAY)}</div>
          <div style={{ background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"4px 12px",fontSize:12 }}>{hoje.length} viagem(ns) hoje</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",background:"#fff",borderBottom:"1px solid #e5e7eb",overflowX:"auto" }}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,minWidth:80,padding:"13px 6px",background:"none",border:"none",color:tab===t.id?T.blue:T.textSub,borderBottom:tab===t.id?"2px solid "+T.blue:"2px solid transparent",fontWeight:tab===t.id?700:500,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>{t.label}</button>)}
      </div>

      <div style={{ padding:16,maxWidth:600,margin:"0 auto" }}>

        {/* ── HOJE ── */}
        {tab==="roteiro"&&<>
          {/* Banner transferencias pendentes */}
          <BannerTransferencias
            pendentes={pendentes}
            viagens={viagens}
            motoristas={motoristas}
            onAceitar={aceitarTransferencia}
            onRecusar={recusarTransferencia}
          />

          {hoje.length===0&&<div style={{ background:"#fff",borderRadius:16,padding:40,textAlign:"center",color:T.textMuted,border:"1px solid #e5e7eb" }}><div style={{ fontSize:32,marginBottom:8 }}>✅</div>Nenhuma viagem para hoje</div>}
          {hoje.map(viagem=>{
            const paxOrdenados=sortPax(viagem.passageiros);
            const agendada=viagem.status==="agendada";
            const emAndamento=viagem.status==="em_andamento";
            const concluida=viagem.status==="concluida";
            const totalAcomp=viagem.passageiros.reduce((a,p)=>a+(p.acompanhantes?.length||0),0);
            const totalVai=viagem.passageiros.filter(p=>p.status!=="ausente"&&(p.tipoTrajeto==="ida_volta"||p.tipoTrajeto==="ida"||!p.tipoTrajeto)).length;
            const totalVolta=viagem.passageiros.filter(p=>p.status!=="ausente"&&(p.tipoTrajeto==="ida_volta"||p.tipoTrajeto==="volta")).length;
            const totalVagas=viagem.passageiros.reduce((a,p)=>a+1+(p.acompanhantes?.length||0),0);

            return (
              <div key={viagem.id} style={{ marginBottom:20 }}>
                <div style={{ background:"#fff",borderRadius:16,padding:16,marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid #e5e7eb" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:11,color:T.blue,letterSpacing:2,textTransform:"uppercase",fontWeight:600,marginBottom:2 }}>VIAGEM #{viagem.id}</div>
                      <div style={{ fontSize:24,fontWeight:800,color:T.text }}>🕐 {viagem.horarioSaida}</div>
                      <div style={{ fontSize:12,color:T.textSub }}>{viagem.veiculo?.modelo} · {viagem.veiculo?.placa}</div>
                    </div>
                    <div style={{ background:agendada?"#eff6ff":emAndamento?"#fffbeb":"#f0fdf4",border:"1px solid "+(agendada?"#bfdbfe":emAndamento?"#fcd34d":"#86efac"),borderRadius:10,padding:"6px 14px",textAlign:"center" }}>
                      <div style={{ fontSize:12,fontWeight:700,color:agendada?T.blue:emAndamento?T.yellow:T.green }}>
                        {agendada?"Agendada":emAndamento?"Em Andamento":"Concluida"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:14 }}>
                    {[
                      {label:"Passag.",   value:`${viagem.passageiros.length}/${viagem.veiculo?.capacidade}`, color:T.blue},
                      {label:"Acomp.",    value:totalAcomp,  color:T.purple},
                      {label:"Vao (ida)", value:totalVai,    color:T.green},
                      {label:"Voltam",    value:totalVolta,  color:T.yellow},
                    ].map(s=>(
                      <div key={s.label} style={{ background:"#f8fafc",borderRadius:10,padding:"8px 4px",textAlign:"center",border:"1px solid #e5e7eb" }}>
                        <div style={{ fontSize:17,fontWeight:800,color:s.color }}>{s.value}</div>
                        <div style={{ fontSize:9,color:T.textMuted }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background:"#f0f4f8",borderRadius:10,padding:"8px 12px",marginBottom:12,border:"1px solid #dde3ed",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontSize:12,color:T.textSub }}>Ocupacao total (pax + acomp)</span>
                    <span style={{ fontSize:15,fontWeight:800,color:totalVagas>viagem.veiculo?.capacidade?T.red:T.green }}>
                      {totalVagas} / {viagem.veiculo?.capacidade} vagas
                    </span>
                  </div>

                  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                    {agendada&&<button onClick={()=>setKmModal({viagemId:viagem.id,tipo:"iniciar"})} style={{ flex:1,padding:"11px",background:T.blue,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>▶ Iniciar Viagem</button>}
                    {emAndamento&&<button onClick={()=>setKmModal({viagemId:viagem.id,tipo:"finalizar"})} style={{ flex:1,padding:"11px",background:T.green,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>✓ Finalizar Viagem</button>}
                    <button onClick={()=>setAbastModal({viagemId:viagem.id,veiculo:viagem.veiculo})} style={{ padding:"11px 14px",background:viagem.abastecimento?.total?"#f0fdf4":"#f8fafc",color:viagem.abastecimento?.total?T.green:T.textSub,border:"1px solid "+(viagem.abastecimento?.total?"#86efac":"#e5e7eb"),borderRadius:12,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>⛽</button>
                  </div>
                </div>

                {/* Lista passageiros */}
                {(emAndamento||agendada)&&paxOrdenados.map(p=>{
                  const sc=SC[p.status]||SC.indefinido;
                  const faltou=p.status==="ausente";
                  const isExp=expandido===p.id;
                  const trajeto=(!p.tipoTrajeto||p.tipoTrajeto==="ida_volta")?"↔ Ida e Volta":p.tipoTrajeto==="ida"?"→ Somente Ida":"← Somente Volta";
                  const trajetoColor=(!p.tipoTrajeto||p.tipoTrajeto==="ida_volta")?T.green:p.tipoTrajeto==="ida"?T.blue:T.yellow;

                  return (
                    <div key={p.id} style={{ background:"#fff",borderRadius:14,marginBottom:8,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:"1px solid #e5e7eb",overflow:"hidden",opacity:faltou?0.65:1 }}>
                      <div style={{ padding:"12px 14px",cursor:"pointer" }} onClick={()=>setExpandido(isExp?null:p.id)}>
                        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                          <div style={{ width:36,height:36,borderRadius:10,background:sc.bg,border:"1px solid "+sc.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>
                            {faltou?"✗":p.status==="indefinido"?"?":p.status==="embarcado"?"🚐":p.status==="entregue"?"🏥":p.status==="pronto"?"✓":"🏠"}
                          </div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:14,fontWeight:700,color:faltou?T.textMuted:T.text,textDecoration:faltou?"line-through":"none" }}>{p.paciente?.nome}</div>
                            <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:3 }}>
                              <span style={{ fontSize:11,color:T.purple,fontWeight:600 }}>{p.destino?.nome}</span>
                              <span style={{ fontSize:11,color:T.yellow,fontWeight:700 }}>🕐 {p.horarioChegada}</span>
                              <span style={{ fontSize:11,color:trajetoColor,fontWeight:600 }}>{trajeto}</span>
                            </div>
                            {p.localEmbarque&&<div style={{ fontSize:11,color:T.textSub,marginTop:2 }}>📍 {p.localEmbarque}</div>}
                          </div>
                          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0 }}>
                            <span style={{ background:sc.bg,color:sc.color,border:"1px solid "+sc.border,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700 }}>{sc.label}</span>
                            <span style={{ fontSize:10,color:T.textMuted }}>{isExp?"▲":"▼"}</span>
                          </div>
                        </div>
                        {(p.acompanhantes?.length>0)&&<div style={{ marginTop:6,fontSize:11,color:T.purple,background:"#f5f3ff",borderRadius:6,padding:"3px 8px",display:"inline-block" }}>+{p.acompanhantes.length} acompanhante(s)</div>}
                      </div>

                      {isExp&&(
                        <div style={{ borderTop:"1px solid #f0f0f0",padding:"12px 14px",background:"#f8fafc" }}>
                          {!faltou&&(
                            <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:10 }}>
                              {["embarcado","entregue","pronto","recolhido"].map(s=>(
                                <button key={s} onClick={()=>handleStatusChange(viagem.id,p.id,s)}
                                  style={{ padding:"8px 14px",background:p.status===s?SC[s].bg:"#fff",color:p.status===s?SC[s].color:T.textSub,border:"1.5px solid "+(p.status===s?SC[s].border:"#e5e7eb"),borderRadius:20,fontSize:12,fontWeight:p.status===s?700:500,cursor:"pointer",fontFamily:"inherit" }}>
                                  {SC[s].label}
                                </button>
                              ))}
                            </div>
                          )}
                          <div style={{ display:"flex",gap:8,marginBottom:10,flexWrap:"wrap" }}>
                            <button onClick={()=>handleStatusChange(viagem.id,p.id,faltou?"indefinido":"ausente")}
                              style={{ padding:"8px 16px",background:faltou?"#fef2f2":"#fff",color:faltou?T.red:T.textSub,border:"1.5px solid "+(faltou?"#fca5a5":"#e5e7eb"),borderRadius:20,fontSize:12,fontWeight:faltou?700:500,cursor:"pointer",fontFamily:"inherit" }}>
                              {faltou?"↩ Desfazer Faltou":"✗ Faltou"}
                            </button>
                            {/* Botao transferir */}
                            <button onClick={()=>setTransferModal({pax:p,viagem})}
                              style={{ padding:"8px 16px",background:"#f5f3ff",color:T.purple,border:"1.5px solid #c4b5fd",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                              ↗ Transferir
                            </button>
                          </div>
                          {!faltou&&(!p.assinatura
                            ?<button onClick={()=>setAssinaturaModal({viagemId:viagem.id,pax:p,acompId:null})} style={{ width:"100%",padding:"10px",background:"#eff6ff",color:T.blue,border:"1px solid #bfdbfe",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:6 }}>✍️ Assinatura do Paciente</button>
                            :<div style={{ background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:"8px 12px",fontSize:12,color:T.green,textAlign:"center",marginBottom:6 }}>✅ Paciente assinou</div>
                          )}
                          {(p.acompanhantes||[]).map(a=>(
                            <div key={a.id} style={{ background:"#fff",borderRadius:10,padding:"8px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #e5e7eb" }}>
                              <div>
                                <div style={{ fontSize:10,color:T.textMuted }}>ACOMPANHANTE</div>
                                <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{a.nome}</div>
                              </div>
                              {!a.assinatura
                                ?<button onClick={()=>setAssinaturaModal({viagemId:viagem.id,pax:p,acompId:a.id,nomeAcomp:a.nome})} style={{ padding:"6px 12px",background:"#f5f3ff",color:T.purple,border:"1px solid #c4b5fd",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>✍️ Assinar</button>
                                :<span style={{ fontSize:11,color:T.green,fontWeight:600 }}>✅ Assinou</span>
                              }
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {concluida&&(
                  <div style={{ background:"#f0fdf4",border:"1px solid #86efac",borderRadius:14,padding:16 }}>
                    <div style={{ fontSize:14,fontWeight:700,color:T.green,marginBottom:8 }}>✅ Viagem Concluida</div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                      {viagem.passageiros.map(p=>(
                        <span key={p.id} style={{ background:"#fff",border:"1px solid #86efac",borderRadius:8,padding:"4px 10px",fontSize:11,color:T.text }}>
                          {p.paciente?.nome?.split(" ")[0]} - <span style={{color:SC[p.status]?.color}}>{SC[p.status]?.label}</span>{p.assinatura?" ✅":""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>}

        {/* ── OUTRAS VIAGENS (somente visualizacao) ── */}
        {tab==="outras"&&<>
          <div style={{ background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#92400e" }}>
            👁️ Modo visualizacao — voce nao pode editar viagens de outros motoristas
          </div>
          {outrasHoje.length===0&&<div style={{ background:"#fff",borderRadius:16,padding:40,textAlign:"center",color:T.textMuted,border:"1px solid #e5e7eb" }}>Nenhuma outra viagem hoje</div>}
          {outrasHoje.map(v=>(
            <div key={v.id} style={{ background:"#fff",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid #e5e7eb" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11,color:T.textSub,letterSpacing:2,fontWeight:600,marginBottom:2,textTransform:"uppercase" }}>VIAGEM #{v.id}</div>
                  <div style={{ fontSize:18,fontWeight:800,color:T.text }}>🕐 {v.horarioSaida}</div>
                  <div style={{ fontSize:13,color:T.blue,fontWeight:600 }}>👤 {v.motorista?.nome}</div>
                  <div style={{ fontSize:12,color:T.textSub }}>{v.veiculo?.modelo} · {v.veiculo?.placa}</div>
                </div>
                <div>
                  <div style={{ background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:10,padding:"6px 14px",textAlign:"center",marginBottom:6 }}>
                    <div style={{ fontSize:16,fontWeight:800,color:T.text }}>{v.passageiros.reduce((a,p)=>a+1+(p.acompanhantes?.length||0),0)}/{v.veiculo?.capacidade}</div>
                    <div style={{ fontSize:10,color:T.textMuted }}>vagas</div>
                  </div>
                  <div style={{ background:v.status==="agendada"?"#eff6ff":v.status==="em_andamento"?"#fffbeb":"#f0fdf4",border:"1px solid "+(v.status==="agendada"?"#bfdbfe":v.status==="em_andamento"?"#fcd34d":"#86efac"),borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:v.status==="agendada"?T.blue:v.status==="em_andamento"?T.yellow:T.green,textAlign:"center" }}>
                    {v.status==="agendada"?"Agendada":v.status==="em_andamento"?"Em Andamento":"Concluida"}
                  </div>
                </div>
              </div>
              {v.passageiros.map((p,i)=>(
                <div key={p.id} style={{ background:"#f8fafc",borderRadius:10,padding:"10px 12px",marginBottom:6,border:"1px solid #e5e7eb" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:26,height:26,borderRadius:8,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.blue }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{p.paciente?.nome}</div>
                      <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:2 }}>
                        <span style={{ fontSize:11,color:T.purple }}>{p.destino?.nome}</span>
                        <span style={{ fontSize:11,color:T.yellow,fontWeight:600 }}>🕐 {p.horarioChegada}</span>
                      </div>
                    </div>
                    <span style={{ background:SC[p.status]?.bg,color:SC[p.status]?.color,border:"1px solid "+SC[p.status]?.border,borderRadius:20,padding:"3px 8px",fontSize:10,fontWeight:700 }}>{SC[p.status]?.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>}

        {/* ── AGENDADAS ── */}
        {tab==="agendadas"&&<>
          <div style={{ fontSize:13,fontWeight:600,color:T.textSub,letterSpacing:1,textTransform:"uppercase",marginBottom:12 }}>Proximas Viagens</div>
          {agendadas.length===0&&<div style={{ background:"#fff",borderRadius:16,padding:40,textAlign:"center",color:T.textMuted,border:"1px solid #e5e7eb" }}>Nenhuma viagem agendada</div>}
          {agendadas.map(v=>(
            <div key={v.id} style={{ background:"#fff",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid #e5e7eb" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11,color:T.blue,letterSpacing:2,fontWeight:600,marginBottom:2,textTransform:"uppercase" }}>VIAGEM #{v.id}</div>
                  <div style={{ fontSize:20,fontWeight:800,color:T.text }}>📅 {fmtDate(v.data)}</div>
                  <div style={{ fontSize:13,color:T.textSub }}>Saida as {v.horarioSaida} · {v.veiculo?.placa}</div>
                </div>
                <div style={{ background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"6px 14px",fontSize:12,fontWeight:700,color:T.blue }}>{v.passageiros.length} pax</div>
              </div>
              {v.passageiros.map((p,i)=>(
                <div key={p.id} style={{ background:"#f8fafc",borderRadius:10,padding:"10px 12px",marginBottom:6,border:"1px solid #e5e7eb" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:26,height:26,borderRadius:8,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.blue }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{p.paciente?.nome}</div>
                      <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:2 }}>
                        <span style={{ fontSize:11,color:T.purple }}>{p.destino?.nome}</span>
                        <span style={{ fontSize:11,color:T.yellow,fontWeight:600 }}>🕐 {p.horarioChegada}</span>
                        <span style={{ fontSize:11,color:(!p.tipoTrajeto||p.tipoTrajeto==="ida_volta")?T.green:p.tipoTrajeto==="ida"?T.blue:T.yellow,fontWeight:600 }}>
                          {(!p.tipoTrajeto||p.tipoTrajeto==="ida_volta")?"↔ Ida e Volta":p.tipoTrajeto==="ida"?"→ Somente Ida":"← Somente Volta"}
                        </span>
                      </div>
                      {(p.acompanhantes||[]).length>0&&<div style={{ fontSize:11,color:T.textMuted }}>+{p.acompanhantes.length} acomp.</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>}

        {/* ── HISTORICO ── */}
        {tab==="historico"&&<>
          <div style={{ fontSize:13,fontWeight:600,color:T.textSub,letterSpacing:1,textTransform:"uppercase",marginBottom:12 }}>Viagens Realizadas</div>
          {historico.length===0&&<div style={{ background:"#fff",borderRadius:16,padding:40,textAlign:"center",color:T.textMuted,border:"1px solid #e5e7eb" }}>Nenhum historico</div>}
          {historico.map(v=>(
            <div key={v.id} style={{ background:"#fff",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid #e5e7eb" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:700,color:T.text }}>Viagem #{v.id} · {fmtDate(v.data)}</div>
                  <div style={{ fontSize:12,color:T.textSub }}>{v.veiculo?.modelo} · {v.horarioSaida} · {v.passageiros.length} passageiro(s)</div>
                </div>
                <div style={{ background:v.status==="concluida"?"#f0fdf4":"#f9fafb",border:"1px solid "+(v.status==="concluida"?"#86efac":"#e5e7eb"),borderRadius:10,padding:"4px 12px",fontSize:11,fontWeight:700,color:v.status==="concluida"?T.green:T.textSub }}>
                  {v.status==="concluida"?"Concluida":"Cancelada"}
                </div>
              </div>
              {v.abastecimento?.total&&<div style={{ background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"6px 12px",fontSize:11,color:T.green,marginBottom:8 }}>⛽ {v.abastecimento.litros}L · {fmtCurrency(v.abastecimento.total)}</div>}
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {v.passageiros.map(p=>(
                  <span key={p.id} style={{ background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:8,padding:"3px 10px",fontSize:11,color:T.text }}>
                    {p.paciente?.nome?.split(" ")[0]} - <span style={{color:SC[p.status]?.color||T.textSub}}>{SC[p.status]?.label}</span>{p.assinatura?" ✅":""}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </>}
      </div>
    </div>
  );
}
