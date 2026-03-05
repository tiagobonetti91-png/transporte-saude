import { useState } from 'react';
import { Btn, SecTitle, ViagemStatusBadge } from './UI.jsx';
import { STATUS_CONFIG, VIAGEM_STATUS, fmtDate, fmtCurrency, TODAY, apiViagens } from './data.js';
import { ModalAssinatura, ModalAbastecimento } from './Modals.jsx';

// ── Tema claro (azul banco) ───────────────────────────────────────────────────
const T = {
  bg:       "#f0f4f8",
  bgCard:   "#ffffff",
  bgCard2:  "#f8fafc",
  border:   "#dde3ed",
  header:   "#1a56db",
  headerBg: "linear-gradient(135deg,#1a56db,#1e40af)",
  text:     "#111827",
  textSub:  "#6b7280",
  textMuted:"#9ca3af",
  blue:     "#1a56db",
  green:    "#059669",
  purple:   "#7c3aed",
  yellow:   "#d97706",
  red:      "#dc2626",
  tabBg:    "#ffffff",
  tabBorder:"#e5e7eb",
};

// Ordem de prioridade: indefinido vem primeiro, depois outros ativos, faltou vai pro fim
const STATUS_ORDER = ["indefinido","embarcado","entregue","pronto","recolhido","ausente"];

function sortPassageiros(passageiros) {
  return [...passageiros].sort((a,b) => {
    const ai = STATUS_ORDER.indexOf(a.status);
    const bi = STATUS_ORDER.indexOf(b.status);
    return ai - bi;
  });
}

// Modal KM
function ModalKm({ titulo, subtitulo, placeholder, onSave, onClose }) {
  const [km, setKm] = useState("");
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20 }}>
      <div style={{ background:T.bgCard,borderRadius:20,padding:28,width:"100%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize:18,fontWeight:700,color:T.text,marginBottom:6 }}>{titulo}</div>
        <div style={{ fontSize:13,color:T.textSub,marginBottom:20 }}>{subtitulo}</div>
        <label style={{ fontSize:12,fontWeight:600,color:T.textSub,letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:6 }}>KM do Veículo</label>
        <input
          type="number"
          value={km}
          onChange={e=>setKm(e.target.value)}
          placeholder={placeholder||"Ex: 45200"}
          inputMode="numeric"
          style={{ width:"100%",padding:"14px 16px",borderRadius:12,border:"2px solid "+T.border,fontSize:18,fontWeight:700,color:T.text,background:T.bgCard2,outline:"none",boxSizing:"border-box",fontFamily:"inherit" }}
          autoFocus
        />
        <div style={{ display:"flex",gap:10,marginTop:20 }}>
          <button onClick={()=>km&&parseInt(km)>0?onSave(parseInt(km)):null} disabled={!km||parseInt(km)<=0}
            style={{ flex:1,padding:"14px",background:km&&parseInt(km)>0?T.blue:"#d1d5db",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:km?"pointer":"not-allowed",fontFamily:"inherit" }}>
            Confirmar
          </button>
          <button onClick={onClose} style={{ padding:"14px 20px",background:T.bgCard2,color:T.textSub,border:"1px solid "+T.border,borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DriverView({ viagens, setViagens, onStatusChange, onAssinatura, onAbastecimento, motoristaId, motoristas }) {
  const [tab, setTab] = useState("roteiro");
  const [assinaturaModal, setAssinaturaModal] = useState(null);
  const [abastModal, setAbastModal] = useState(null);
  const [kmModal, setKmModal] = useState(null); // {viagemId, tipo: "iniciar"|"finalizar"}
  const [expandido, setExpandido] = useState(null);

  const motorista = motoristas.find(m => m.id === motoristaId) || { nome: "Motorista" };
  const minhas = viagens.filter(v => v.motorista?.id === motoristaId);
  const hoje = minhas.filter(v => v.data === TODAY && v.status !== "cancelada");
  const agendadas = minhas.filter(v => v.data > TODAY && v.status !== "cancelada").sort((a,b)=>a.data.localeCompare(b.data));
  const historico = minhas.filter(v => v.status === "concluida" || (v.data < TODAY)).sort((a,b)=>b.data.localeCompare(a.data));

  function salvarAssinatura(viagemId, paxId, svg, acompId=null) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : {
      ...v, passageiros: v.passageiros.map(p => {
        if(p.id !== paxId) return p;
        if(acompId) return {...p, acompanhantes: (p.acompanhantes||[]).map(a => a.id===acompId ? {...a,assinatura:svg} : a)};
        return {...p, assinatura: svg};
      })
    }));
    onAssinatura && onAssinatura(viagemId, paxId, svg);
    setAssinaturaModal(null);
  }

  async function handleKm(km) {
    const { viagemId, tipo } = kmModal;
    setKmModal(null);
    const novoStatus = tipo === "iniciar" ? "em_andamento" : "concluida";
    const abast = tipo === "iniciar"
      ? { kmInicial: km }
      : viagens.find(v=>v.id===viagemId)?.abastecimento
        ? { ...viagens.find(v=>v.id===viagemId).abastecimento, kmFinal: km }
        : { kmFinal: km };
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : { ...v, status: novoStatus, abastecimento: { ...(v.abastecimento||{}), ...abast } }));
    try {
      await apiViagens.atualizarAbastecimento(viagemId, abast);
      await apiViagens.atualizar(viagemId, { ...viagens.find(v=>v.id===viagemId), status: novoStatus });
    } catch(e) { console.error(e); }
  }

  async function handleStatusChange(viagemId, paxId, newStatus) {
    setViagens(prev => prev.map(v => v.id !== viagemId ? v : {
      ...v, passageiros: v.passageiros.map(p => p.id !== paxId ? p : { ...p, status: newStatus })
    }));
    await onStatusChange(viagemId, paxId, newStatus);
  }

  const tabs = [
    { id:"roteiro",   label:"Hoje" },
    { id:"agendadas", label:"Agendadas" },
    { id:"historico", label:"Histórico" },
  ];

  // ── STATUS CONFIG para tema claro ─────────────────────────────────────────
  const SC = {
    indefinido:{ label:"Aguardando",  bg:"#eff6ff", color:"#1a56db", border:"#bfdbfe" },
    embarcado: { label:"Embarcado",   bg:"#eff6ff", color:"#1d4ed8", border:"#93c5fd" },
    entregue:  { label:"Entregue",    bg:"#f5f3ff", color:"#7c3aed", border:"#c4b5fd" },
    pronto:    { label:"Pronto",      bg:"#f0fdf4", color:"#059669", border:"#86efac" },
    recolhido: { label:"Recolhido",   bg:"#fff7ed", color:"#d97706", border:"#fcd34d" },
    ausente:   { label:"Faltou",      bg:"#fef2f2", color:"#dc2626", border:"#fca5a5" },
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans',sans-serif" }}>

      {/* Modais */}
      {assinaturaModal && (
        <ModalAssinatura
          passageiro={assinaturaModal.pax}
          nomeOverride={assinaturaModal.nomeAcomp}
          onSave={svg=>salvarAssinatura(assinaturaModal.viagemId,assinaturaModal.pax.id,svg,assinaturaModal.acompId||null)}
          onClose={()=>setAssinaturaModal(null)}
        />
      )}
      {abastModal && (
        <ModalAbastecimento
          viagemId={abastModal.viagemId}
          veiculo={abastModal.veiculo}
          motoristaNome={motorista.nome}
          onSave={dados=>{onAbastecimento&&onAbastecimento(abastModal.viagemId,dados);setAbastModal(null);}}
          onClose={()=>setAbastModal(null)}
        />
      )}
      {kmModal && (
        <ModalKm
          titulo={kmModal.tipo==="iniciar"?"Iniciar Viagem":"Finalizar Viagem"}
          subtitulo={kmModal.tipo==="iniciar"?"Informe o KM atual do veículo para iniciar a viagem":"Informe o KM final para encerrar a viagem"}
          placeholder="Ex: 45200"
          onSave={handleKm}
          onClose={()=>setKmModal(null)}
        />
      )}

      {/* Header */}
      <div style={{ background:T.headerBg, padding:"20px 20px 16px", color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
          <div style={{ width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>🚐</div>
          <div>
            <div style={{ fontSize:10,opacity:0.7,letterSpacing:2,textTransform:"uppercase" }}>Portal do Motorista</div>
            <div style={{ fontSize:18,fontWeight:700 }}>{motorista.nome}</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          <div style={{ background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"4px 12px",fontSize:12 }}>📅 {fmtDate(TODAY)}</div>
          <div style={{ background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"4px 12px",fontSize:12 }}>{hoje.length} viagem(ns) hoje</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",background:T.tabBg,borderBottom:"1px solid "+T.tabBorder,overflowX:"auto" }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,minWidth:90,padding:"13px 8px",background:"none",border:"none",color:tab===t.id?T.blue:T.textSub,borderBottom:tab===t.id?"2px solid "+T.blue:"2px solid transparent",fontWeight:tab===t.id?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:16, maxWidth:600, margin:"0 auto" }}>

        {/* ── HOJE ── */}
        {tab==="roteiro" && (
          <>
            {hoje.length===0 && (
              <div style={{ background:T.bgCard,borderRadius:16,padding:40,textAlign:"center",color:T.textMuted,border:"1px solid "+T.border }}>
                <div style={{ fontSize:32,marginBottom:8 }}>✅</div>
                Nenhuma viagem para hoje
              </div>
            )}
            {hoje.map(viagem => {
              const paxOrdenados = sortPassageiros(viagem.passageiros);
              const emAndamento = viagem.status === "em_andamento";
              const concluida = viagem.status === "concluida";
              const agendada = viagem.status === "agendada";
              const totalAcomp = viagem.passageiros.reduce((a,p)=>a+(p.acompanhantes?.length||0),0);

              return (
                <div key={viagem.id} style={{ marginBottom:20 }}>
                  {/* Card cabeçalho viagem */}
                  <div style={{ background:T.bgCard,borderRadius:16,padding:16,marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid "+T.border }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:11,color:T.blue,letterSpacing:2,textTransform:"uppercase",fontWeight:600,marginBottom:2 }}>VIAGEM #{viagem.id}</div>
                        <div style={{ fontSize:24,fontWeight:800,color:T.text }}>🕐 {viagem.horarioSaida}</div>
                        <div style={{ fontSize:12,color:T.textSub }}>{viagem.veiculo?.modelo} · {viagem.veiculo?.placa}</div>
                      </div>
                      <div style={{ background:agendada?"#eff6ff":emAndamento?"#fffbeb":concluida?"#f0fdf4":"#f9fafb", border:"1px solid "+(agendada?"#bfdbfe":emAndamento?"#fcd34d":concluida?"#86efac":"#e5e7eb"), borderRadius:10,padding:"6px 14px",textAlign:"center" }}>
                        <div style={{ fontSize:11,fontWeight:700,color:agendada?T.blue:emAndamento?T.yellow:concluida?T.green:T.textSub }}>
                          {agendada?"Agendada":emAndamento?"Em Andamento":concluida?"Concluída":viagem.status}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14 }}>
                      {[
                        {label:"Passageiros",value:`${viagem.passageiros.length}/${viagem.veiculo?.capacidade}`,color:T.blue},
                        {label:"Acomp.",value:totalAcomp,color:T.purple},
                        {label:"Assinados",value:viagem.passageiros.filter(p=>p.assinatura).length,color:T.green},
                      ].map(s=>(
                        <div key={s.label} style={{ background:T.bgCard2,borderRadius:10,padding:"8px",textAlign:"center",border:"1px solid "+T.border }}>
                          <div style={{ fontSize:18,fontWeight:800,color:s.color }}>{s.value}</div>
                          <div style={{ fontSize:10,color:T.textMuted }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Botões Iniciar / Finalizar */}
                    <div style={{ display:"flex",gap:8,marginBottom:8 }}>
                      {agendada && (
                        <button onClick={()=>setKmModal({viagemId:viagem.id,tipo:"iniciar"})}
                          style={{ flex:1,padding:"12px",background:T.blue,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>
                          ▶ Iniciar Viagem
                        </button>
                      )}
                      {emAndamento && (
                        <button onClick={()=>setKmModal({viagemId:viagem.id,tipo:"finalizar"})}
                          style={{ flex:1,padding:"12px",background:T.green,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>
                          ✓ Finalizar Viagem
                        </button>
                      )}
                      <button onClick={()=>setAbastModal({viagemId:viagem.id,veiculo:viagem.veiculo})}
                        style={{ padding:"12px 16px",background:viagem.abastecimento?"#f0fdf4":T.bgCard2,color:viagem.abastecimento?T.green:T.textSub,border:"1px solid "+(viagem.abastecimento?"#86efac":T.border),borderRadius:12,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
                        ⛽ {viagem.abastecimento?"Abast.":"Abast."}
                      </button>
                    </div>
                  </div>

                  {/* Lista de passageiros */}
                  {(emAndamento || agendada) && paxOrdenados.map((p) => {
                    const sc = SC[p.status] || SC.indefinido;
                    const faltou = p.status === "ausente";
                    const isExp = expandido === p.id;

                    return (
                      <div key={p.id} style={{ background:T.bgCard,borderRadius:14,marginBottom:8,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:"1px solid "+T.border,overflow:"hidden",opacity:faltou?0.6:1 }}>
                        {/* Linha principal */}
                        <div style={{ padding:"12px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer" }} onClick={()=>setExpandido(isExp?null:p.id)}>
                          <div style={{ width:36,height:36,borderRadius:10,background:sc.bg,border:"1px solid "+sc.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:sc.color,flexShrink:0 }}>
                            {p.status==="indefinido"?"?":p.status==="embarcado"?"🚐":p.status==="entregue"?"🏥":p.status==="pronto"?"✓":p.status==="recolhido"?"🏠":"✗"}
                          </div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:14,fontWeight:700,color:faltou?T.textMuted:T.text,textDecoration:faltou?"line-through":"none" }}>{p.paciente?.nome}</div>
                            <div style={{ fontSize:11,color:T.textSub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.destino?.nome}</div>
                          </div>
                          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0 }}>
                            <span style={{ background:sc.bg,color:sc.color,border:"1px solid "+sc.border,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700 }}>{sc.label}</span>
                            <span style={{ fontSize:10,color:T.textMuted }}>{isExp?"▲":"▼"}</span>
                          </div>
                        </div>

                        {/* Expandido */}
                        {isExp && (
                          <div style={{ borderTop:"1px solid "+T.border,padding:"12px 14px",background:T.bgCard2 }}>
                            {/* Destino e horário */}
                            <div style={{ background:T.bgCard,borderRadius:10,padding:"10px 12px",marginBottom:10,border:"1px solid "+T.border }}>
                              <div style={{ fontSize:10,color:T.textMuted,marginBottom:2,letterSpacing:1,textTransform:"uppercase" }}>Destino</div>
                              <div style={{ fontSize:13,fontWeight:600,color:T.purple }}>{p.destino?.nome}</div>
                              <div style={{ fontSize:11,color:T.textSub }}>{p.destino?.especialidade}</div>
                              <div style={{ display:"flex",gap:12,marginTop:6,flexWrap:"wrap" }}>
                                <span style={{ fontSize:11,color:T.yellow,fontWeight:600 }}>🕐 {p.horarioChegada}</span>
                                {p.localEmbarque && <span style={{ fontSize:11,color:T.textSub }}>📍 {p.localEmbarque}</span>}
                                <span style={{ fontSize:11,fontWeight:600,color:p.tipoTrajeto==="volta"?T.yellow:p.tipoTrajeto==="ida"?T.blue:T.green }}>
                                  {(!p.tipoTrajeto||p.tipoTrajeto==="ida_volta")?"↔ Ida e Volta":p.tipoTrajeto==="ida"?"→ Somente Ida":"← Somente Volta"}
                                </span>
                              </div>
                            </div>

                            {/* Botões de status */}
                            {!faltou && (
                              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:10 }}>
                                {["embarcado","entregue","pronto","recolhido"].map(s=>(
                                  <button key={s} onClick={()=>handleStatusChange(viagem.id,p.id,s)}
                                    style={{ padding:"8px 14px",background:p.status===s?SC[s].bg:T.bgCard,color:p.status===s?SC[s].color:T.textSub,border:"1.5px solid "+(p.status===s?SC[s].border:T.border),borderRadius:20,fontSize:12,fontWeight:p.status===s?700:500,cursor:"pointer",fontFamily:"inherit" }}>
                                    {SC[s].label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Botão Faltou */}
                            <div style={{ marginBottom:10 }}>
                              <button onClick={()=>handleStatusChange(viagem.id,p.id,faltou?"indefinido":"ausente")}
                                style={{ padding:"8px 16px",background:faltou?"#fef2f2":T.bgCard,color:faltou?T.red:T.textSub,border:"1.5px solid "+(faltou?"#fca5a5":T.border),borderRadius:20,fontSize:12,fontWeight:faltou?700:500,cursor:"pointer",fontFamily:"inherit" }}>
                                {faltou?"↩ Desfazer Faltou":"✗ Faltou"}
                              </button>
                            </div>

                            {/* Assinatura paciente */}
                            {!faltou && (!p.assinatura
                              ? <button onClick={()=>setAssinaturaModal({viagemId:viagem.id,pax:p,acompId:null})}
                                  style={{ width:"100%",padding:"10px",background:"#eff6ff",color:T.blue,border:"1px solid #bfdbfe",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:6 }}>
                                  ✍️ Assinatura do Paciente
                                </button>
                              : <div style={{ background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:"8px 12px",fontSize:12,color:T.green,textAlign:"center",marginBottom:6 }}>✅ Paciente assinou</div>
                            )}

                            {/* Acompanhantes */}
                            {(p.acompanhantes||[]).length>0 && (
                              <div>
                                {p.acompanhantes.map(a=>(
                                  <div key={a.id} style={{ background:T.bgCard,borderRadius:10,padding:"8px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid "+T.border }}>
                                    <div>
                                      <div style={{ fontSize:10,color:T.textMuted }}>ACOMPANHANTE</div>
                                      <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{a.nome}</div>
                                    </div>
                                    {!a.assinatura
                                      ? <button onClick={()=>setAssinaturaModal({viagemId:viagem.id,pax:p,acompId:a.id,nomeAcomp:a.nome})}
                                          style={{ padding:"6px 12px",background:"#f5f3ff",color:T.purple,border:"1px solid #c4b5fd",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                                          ✍️ Assinar
                                        </button>
                                      : <span style={{ fontSize:11,color:T.green,fontWeight:600 }}>✅ Assinou</span>
                                    }
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Se concluída mostra resumo */}
                  {concluida && (
                    <div style={{ background:"#f0fdf4",border:"1px solid #86efac",borderRadius:14,padding:16 }}>
                      <div style={{ fontSize:14,fontWeight:700,color:T.green,marginBottom:8 }}>✅ Viagem Concluída</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                        {viagem.passageiros.map(p=>(
                          <span key={p.id} style={{ background:"#fff",border:"1px solid #86efac",borderRadius:8,padding:"4px 10px",fontSize:11,color:T.text }}>
                            {p.paciente?.nome?.split(" ")[0]} — <span style={{color:SC[p.status]?.color}}>{SC[p.status]?.label}</span>
                            {p.assinatura?" ✅":""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── AGENDADAS ── */}
        {tab==="agendadas" && (
          <>
            <div style={{ fontSize:13,fontWeight:600,color:T.textSub,letterSpacing:1,textTransform:"uppercase",marginBottom:12 }}>Próximas Viagens</div>
            {agendadas.length===0 && (
              <div style={{ background:T.bgCard,borderRadius:16,padding:40,textAlign:"center",color:T.textMuted,border:"1px solid "+T.border }}>Nenhuma viagem agendada</div>
            )}
            {agendadas.map(v=>(
              <div key={v.id} style={{ background:T.bgCard,borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid "+T.border }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:11,color:T.blue,letterSpacing:2,textTransform:"uppercase",fontWeight:600,marginBottom:2 }}>VIAGEM #{v.id}</div>
                    <div style={{ fontSize:20,fontWeight:800,color:T.text }}>📅 {fmtDate(v.data)}</div>
                    <div style={{ fontSize:13,color:T.textSub }}>Saída às {v.horarioSaida} · {v.veiculo?.placa}</div>
                  </div>
                  <div style={{ background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"6px 14px",fontSize:12,fontWeight:700,color:T.blue }}>{v.passageiros.length} pax</div>
                </div>
                {v.passageiros.map((p,i)=>(
                  <div key={p.id} style={{ background:T.bgCard2,borderRadius:10,padding:"10px 12px",marginBottom:6,border:"1px solid "+T.border,display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:26,height:26,borderRadius:8,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.blue }}>{i+1}</div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{p.paciente?.nome}</div>
                      <div style={{ fontSize:11,color:T.purple }}>{p.destino?.nome} · <span style={{color:T.textSub}}>{p.horarioChegada}</span></div>
                      {(p.acompanhantes||[]).length>0 && <div style={{ fontSize:11,color:T.textMuted }}>+{p.acompanhantes.length} acomp.</div>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* ── HISTÓRICO ── */}
        {tab==="historico" && (
          <>
            <div style={{ fontSize:13,fontWeight:600,color:T.textSub,letterSpacing:1,textTransform:"uppercase",marginBottom:12 }}>Viagens Realizadas</div>
            {historico.length===0 && (
              <div style={{ background:T.bgCard,borderRadius:16,padding:40,textAlign:"center",color:T.textMuted,border:"1px solid "+T.border }}>Nenhum histórico</div>
            )}
            {historico.map(v=>(
              <div key={v.id} style={{ background:T.bgCard,borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"1px solid "+T.border }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14,fontWeight:700,color:T.text }}>Viagem #{v.id} · {fmtDate(v.data)}</div>
                    <div style={{ fontSize:12,color:T.textSub }}>{v.veiculo?.modelo} · {v.horarioSaida}</div>
                    <div style={{ fontSize:12,color:T.textSub }}>{v.passageiros.length} passageiro(s) · {v.passageiros.filter(p=>p.assinatura).length} assinatura(s)</div>
                  </div>
                  <div style={{ background:v.status==="concluida"?"#f0fdf4":"#f9fafb",border:"1px solid "+(v.status==="concluida"?"#86efac":"#e5e7eb"),borderRadius:10,padding:"4px 12px",fontSize:11,fontWeight:700,color:v.status==="concluida"?T.green:T.textSub }}>
                    {v.status==="concluida"?"Concluída":"Cancelada"}
                  </div>
                </div>
                {v.abastecimento?.total && (
                  <div style={{ background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"6px 12px",fontSize:11,color:T.green,marginBottom:8 }}>
                    ⛽ {v.abastecimento.litros}L · {fmtCurrency(v.abastecimento.total)}
                  </div>
                )}
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {v.passageiros.map(p=>(
                    <span key={p.id} style={{ background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"3px 10px",fontSize:11,color:T.text }}>
                      {p.paciente?.nome?.split(" ")[0]} — <span style={{color:SC[p.status]?.color||T.textSub}}>{SC[p.status]?.label}</span>{p.assinatura?" ✅":""}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
