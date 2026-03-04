import { useState } from 'react';
import { S, Btn, StatusBadge, SecTitle, ModalHdr, ViagemStatusBadge } from './UI.jsx';
import { STATUS_CONFIG, VIAGEM_STATUS, fmtDate, TODAY } from './data.js';
import { ModalAssinatura, ModalAbastecimento } from './Modals.jsx';

export default function DriverView({ viagens, setViagens, onStatusChange, motoristaId, motoristas }) {
  const [tab, setTab] = useState("roteiro");
  const [assinaturaModal, setAssinaturaModal] = useState(null);
  const [abastModal, setAbastModal] = useState(null);

  const motorista = motoristas.find(m => m.id === motoristaId) || { nome: "Motorista" };
  const minhas = viagens.filter(v => v.motorista.id === motoristaId);
  const hoje = minhas.filter(v => v.data === TODAY && v.status !== "cancelada");
  const agendadas = minhas.filter(v => v.data > TODAY && v.status !== "cancelada" && v.status !== "concluida").sort((a,b) => a.data.localeCompare(b.data));
  const historico = minhas.filter(v => v.status === "concluida" || (v.data < TODAY && v.status !== "agendada")).sort((a,b) => b.data.localeCompare(a.data));

  function salvarAssinatura(viagemId, paxId, svg) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : {
      ...v, passageiros: v.passageiros.map(p => p.id !== paxId ? p : { ...p, assinatura: svg })
    }));
    setAssinaturaModal(null);
  }
  function salvarAbastecimento(viagemId, dados) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : { ...v, abastecimento: dados }));
    setAbastModal(null);
  }

  const tabs = [
    { id:"roteiro",   label:"🗓️ Hoje" },
    { id:"agendadas", label:`📅 Agendadas (${agendadas.length})` },
    { id:"historico", label:"📋 Histórico" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#090e1a", color:"#e2e8f0", fontFamily:"'DM Sans', sans-serif" }}>
      {assinaturaModal && (
        <ModalAssinatura
          passageiro={assinaturaModal.pax}
          onSave={svg => salvarAssinatura(assinaturaModal.viagemId, assinaturaModal.pax.id, svg)}
          onClose={() => setAssinaturaModal(null)}
        />
      )}
      {abastModal && (
        <ModalAbastecimento
          viagemId={abastModal.viagemId}
          veiculo={abastModal.veiculo}
          motoristaNome={motorista.nome}
          onSave={dados => salvarAbastecimento(abastModal.viagemId, dados)}
          onClose={() => setAbastModal(null)}
        />
      )}

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f2040,#0a1628)", padding:"18px 20px", borderBottom:"1px solid #1e3a5f" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>🚐</div>
          <div>
            <div style={{ fontSize:10,color:"#64748b",letterSpacing:2,textTransform:"uppercase" }}>Secretaria de Saúde</div>
            <div style={{ fontSize:17,fontWeight:700,color:"#fff" }}>Portal do Motorista</div>
          </div>
        </div>
        <div style={{ fontSize:13,color:"#94a3b8",marginTop:8 }}>Olá, <span style={{ color:"#38bdf8",fontWeight:600 }}>{motorista.nome}</span> · {fmtDate(TODAY)}</div>
        <div style={{ display:"flex",gap:8,marginTop:10,flexWrap:"wrap" }}>
          <div style={{ background:"#0c2d48",borderRadius:8,padding:"4px 12px",fontSize:12,color:"#38bdf8" }}>Hoje: {hoje.length} viagem(ns)</div>
          <div style={{ background:"#1e1040",borderRadius:8,padding:"4px 12px",fontSize:12,color:"#a78bfa" }}>Agendadas: {agendadas.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",borderBottom:"1px solid #1e293b",background:"#0c1524",overflowX:"auto" }}>
        {tabs.map(t => <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,minWidth:90,padding:"12px 8px",background:"none",border:"none",color:tab===t.id?"#38bdf8":"#64748b",borderBottom:tab===t.id?"2px solid #38bdf8":"2px solid transparent",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>{t.label}</button>)}
      </div>

      <div style={{ padding:16,maxWidth:600,margin:"0 auto" }}>

        {/* ── HOJE ── */}
        {tab==="roteiro" && <>
          {hoje.length===0 && <div style={{ ...S.card,textAlign:"center",color:"#475569",padding:40 }}>✅ Nenhuma viagem para hoje</div>}
          {hoje.map(viagem => (
            <div key={viagem.id} style={{ marginBottom:24 }}>
              {/* Cabeçalho viagem */}
              <div style={{ ...S.card,background:"#0f1e36",border:"1px solid #1e3a5f",marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:11,color:"#3b82f6",letterSpacing:2,textTransform:"uppercase",marginBottom:4 }}>VIAGEM #{viagem.id}</div>
                    <div style={{ fontSize:22,fontWeight:700,color:"#fff" }}>🕐 {viagem.horarioSaida}</div>
                    <div style={{ fontSize:12,color:"#64748b" }}>Jardim / MS</div>
                  </div>
                  <div style={{ background:"#1e3a5f",borderRadius:10,padding:"8px 12px",textAlign:"center" }}>
                    <div style={{ fontSize:11,color:"#38bdf8" }}>{viagem.veiculo.tipo}</div>
                    <div style={{ fontSize:14,fontWeight:700,color:"#fff" }}>{viagem.veiculo.placa}</div>
                    <div style={{ fontSize:11,color:"#64748b" }}>{viagem.veiculo.modelo}</div>
                  </div>
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <div style={{ flex:1,background:"#0a1628",borderRadius:10,padding:"8px 12px",textAlign:"center" }}>
                    <div style={{ fontSize:10,color:"#64748b" }}>PASSAGEIROS</div>
                    <div style={{ fontSize:18,fontWeight:700,color:"#fff" }}>{viagem.passageiros.length}<span style={{ fontSize:11,color:"#64748b" }}>/{viagem.veiculo.capacidade}</span></div>
                  </div>
                  <div style={{ flex:1,background:"#0a1628",borderRadius:10,padding:"8px 12px",textAlign:"center" }}>
                    <div style={{ fontSize:10,color:"#64748b" }}>ASSINATURAS</div>
                    <div style={{ fontSize:18,fontWeight:700,color:"#34d399" }}>{viagem.passageiros.filter(p=>p.assinatura).length}<span style={{ fontSize:11,color:"#64748b" }}>/{viagem.passageiros.length}</span></div>
                  </div>
                </div>
                {/* Botão abastecimento */}
                <div style={{ marginTop:10 }}>
                  {viagem.abastecimento
                    ? <div style={{ background:"#052e1c",border:"1px solid #34d39944",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#34d399" }}>⛽ Abastecimento registrado — {viagem.abastecimento.litros}L · R$ {Number(viagem.abastecimento.total||0).toFixed(2)}</div>
                    : <Btn small color="#fbbf24" onClick={()=>setAbastModal({viagemId:viagem.id,veiculo:viagem.veiculo})}>⛽ Registrar Abastecimento</Btn>
                  }
                </div>
              </div>

              <SecTitle>LISTA DE PASSAGEIROS</SecTitle>
              {viagem.passageiros.map((p,i) => (
                <div key={p.id} style={{ background:"#0f1e36",borderRadius:14,padding:14,marginBottom:10,border:`1px solid ${STATUS_CONFIG[p.status].color}33` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <div style={{ width:34,height:34,borderRadius:10,background:STATUS_CONFIG[p.status].color+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:STATUS_CONFIG[p.status].color }}>{i+1}</div>
                      <div>
                        <div style={{ fontSize:14,fontWeight:700,color:"#e2e8f0" }}>{p.paciente.nome}</div>
                        <div style={{ fontSize:11,color:"#64748b" }}>{p.paciente.telefone}</div>
                        {p.assinatura && <div style={{ fontSize:11,color:"#34d399",marginTop:2 }}>✅ Assinado</div>}
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end" }}>
                      <StatusBadge status={p.status} onClick={()=>onStatusChange(viagem.id,p.id,STATUS_CONFIG[p.status].next)}/>
                      {p.status!=="ausente" && <button onClick={()=>onStatusChange(viagem.id,p.id,"ausente")} style={{ background:"#2d0000",color:"#f87171",border:"1.5px solid #f87171",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Ausente</button>}
                    </div>
                  </div>
                  <div style={{ background:"#0a1628",borderRadius:10,padding:"8px 12px",marginBottom:8 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontSize:10,color:"#64748b",marginBottom:2 }}>DESTINO</div>
                        <div style={{ fontSize:12,fontWeight:600,color:"#c4b5fd" }}>{p.destino.nome}</div>
                        <div style={{ fontSize:11,color:"#64748b" }}>{p.destino.especialidade}</div>
                      </div>
                      <div style={{ fontSize:18,fontWeight:700,color:"#fbbf24" }}>{p.horarioChegada}</div>
                    </div>
                    {p.localEmbarque && <div style={{ marginTop:6,fontSize:11,color:"#94a3b8" }}>📍 <span style={{color:"#e2e8f0"}}>{p.localEmbarque}</span></div>}
                    <div style={{ marginTop:4,fontSize:11 }}>
                      <span style={{ background:p.tipoTrajeto==="ida_volta"?"#052e1c":p.tipoTrajeto==="ida"?"#0c2d48":"#2d1a00", color:p.tipoTrajeto==="ida_volta"?"#34d399":p.tipoTrajeto==="ida"?"#38bdf8":"#fbbf24", borderRadius:6,padding:"2px 8px" }}>
                        {(!p.tipoTrajeto||p.tipoTrajeto==="ida_volta")?"Ida e Volta":p.tipoTrajeto==="ida"?"Somente Ida":"Somente Volta"}
                      </span>
                    </div>
                  </div>
                  {/* Botão Assinatura */}
                  {!p.assinatura
                    ? <Btn small color="#3b82f6" full onClick={()=>setAssinaturaModal({viagemId:viagem.id,pax:p})}>✍️ Colher Assinatura</Btn>
                    : <div style={{ background:"#052e1c",border:"1px solid #34d39944",borderRadius:8,padding:"6px 12px",fontSize:12,color:"#34d399",textAlign:"center" }}>✅ Assinatura coletada</div>
                  }
                </div>
              ))}
            </div>
          ))}
        </>}

        {/* ── AGENDADAS ── */}
        {tab==="agendadas" && <>
          <SecTitle>PRÓXIMAS VIAGENS</SecTitle>
          {agendadas.length===0 && <div style={{ ...S.card,textAlign:"center",color:"#475569",padding:40 }}>Nenhuma viagem agendada</div>}
          {agendadas.map(v => (
            <div key={v.id} style={{ ...S.card,background:"#0f1e36",border:"1px solid #1e3a5f",marginBottom:16 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11,color:"#38bdf8",letterSpacing:2,textTransform:"uppercase",marginBottom:4 }}>VIAGEM #{v.id}</div>
                  <div style={{ fontSize:20,fontWeight:700,color:"#fff" }}>📅 {fmtDate(v.data)}</div>
                  <div style={{ fontSize:13,color:"#94a3b8" }}>Saída às {v.horarioSaida}</div>
                </div>
                <div style={{ background:"#1e3a5f",borderRadius:10,padding:"8px 12px",textAlign:"center" }}>
                  <div style={{ fontSize:11,color:"#38bdf8" }}>{v.veiculo.tipo}</div>
                  <div style={{ fontSize:14,fontWeight:700,color:"#fff" }}>{v.veiculo.placa}</div>
                </div>
              </div>
              <SecTitle>PASSAGEIROS ({v.passageiros.length}/{v.veiculo.capacidade})</SecTitle>
              {v.passageiros.map((p,i) => (
                <div key={p.id} style={{ background:"#0a1628",borderRadius:10,padding:"10px 14px",marginBottom:8 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:28,height:28,borderRadius:8,background:"#1e3a5f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#38bdf8" }}>{i+1}</div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:700,color:"#e2e8f0" }}>{p.paciente.nome}</div>
                      <div style={{ fontSize:11,color:"#a78bfa" }}>{p.destino.nome} · <span style={{color:"#64748b"}}>{p.destino.especialidade}</span></div>
                      <div style={{ fontSize:11,color:"#fbbf24" }}>Chegada: {p.horarioChegada}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>}

        {/* ── HISTÓRICO ── */}
        {tab==="historico" && <>
          <SecTitle>VIAGENS REALIZADAS</SecTitle>
          {historico.length===0 && <div style={{ ...S.card,textAlign:"center",color:"#475569",padding:40 }}>Nenhum histórico</div>}
          {historico.map(v => (
            <div key={v.id} style={S.card}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>Viagem #{v.id} · {fmtDate(v.data)}</div>
                  <div style={{ fontSize:12,color:"#64748b" }}>{v.veiculo.modelo} · {v.horarioSaida}</div>
                  <div style={{ fontSize:12,color:"#94a3b8" }}>{v.passageiros.length} passageiro(s) · {v.passageiros.filter(p=>p.assinatura).length} assinatura(s)</div>
                </div>
                <ViagemStatusBadge status={v.status}/>
              </div>
              {v.abastecimento && <div style={{ background:"#052e1c",border:"1px solid #34d39944",borderRadius:8,padding:"6px 12px",fontSize:11,color:"#34d399",marginBottom:8 }}>⛽ {v.abastecimento.litros}L de {v.abastecimento.combustivel} · R$ {Number(v.abastecimento.total||0).toFixed(2)}</div>}
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {v.passageiros.map(p => (
                  <span key={p.id} style={{ background:STATUS_CONFIG[p.status].color+"18",border:`1px solid ${STATUS_CONFIG[p.status].color}44`,borderRadius:8,padding:"3px 10px",fontSize:11,color:"#e2e8f0" }}>
                    {p.paciente.nome.split(" ")[0]} — <span style={{ color:STATUS_CONFIG[p.status].color }}>{STATUS_CONFIG[p.status].label}</span>{p.assinatura?" ✅":""}
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
