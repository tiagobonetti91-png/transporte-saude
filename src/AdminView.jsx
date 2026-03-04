import { useState } from 'react';
import { S, Btn, SecTitle, CrudList, ViagemStatusBadge, StatusBadge } from './UI.jsx';
import { STATUS_CONFIG, VIAGEM_STATUS, fmtDate, fmtCurrency, TODAY } from './data.js';
import { ModalPaciente, ModalDestino, ModalMotorista, ModalVeiculo, ModalAdmin, ModalViagem } from './Modals.jsx';
import Relatorios from './Relatorios.jsx';

export default function AdminView({ db, setDb, viagens, setViagens, onStatusChange }) {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [dashFilter, setDashFilter] = useState(null);

  const hoje = viagens.filter(v => v.data === TODAY);
  const totalPax = hoje.reduce((a,v) => a + v.passageiros.length, 0);

  function closeModal() { setModal(null); }
  function crudSave(key, item) {
    setDb(prev => {
      const list = prev[key];
      if(item.id && list.find(x=>x.id===item.id)) return { ...prev, [key]: list.map(x=>x.id===item.id?{...x,...item}:x) };
      const newId = Math.max(0,...list.map(x=>x.id))+1;
      return { ...prev, [key]: [...list,{...item,id:newId}] };
    });
    closeModal();
  }
  function crudDelete(key, id) {
    if(window.confirm("Confirma a exclusão?")) setDb(prev=>({...prev,[key]:prev[key].filter(x=>x.id!==id)}));
  }
  function saveViagem(form) {
    if(form.id) setViagens(prev=>prev.map(v=>v.id===form.id?{...v,...form}:v));
    else setViagens(prev=>[...prev,{...form,id:Math.max(0,...prev.map(v=>v.id))+1,abastecimento:null}]);
    closeModal();
  }
  function deleteViagem(id) {
    if(window.confirm("Excluir viagem?")) setViagens(prev=>prev.filter(v=>v.id!==id));
  }

  const DASH_STATS = [
    { key:"viagens",    label:"Viagens Hoje",  value:hoje.length,                                                                                   color:"#38bdf8", icon:"🚐" },
    { key:"total",      label:"Passageiros",   value:totalPax,                                                                                       color:"#a78bfa", icon:"👥" },
    { key:"embarcado",  label:"Embarcados",    value:hoje.reduce((a,v)=>a+v.passageiros.filter(p=>p.status==="embarcado").length,0),                 color:"#38bdf8", icon:"🟦" },
    { key:"entregue",   label:"Entregues",     value:hoje.reduce((a,v)=>a+v.passageiros.filter(p=>p.status==="entregue").length,0),                  color:"#a78bfa", icon:"🟣" },
    { key:"pronto",     label:"Prontos",       value:hoje.reduce((a,v)=>a+v.passageiros.filter(p=>p.status==="pronto").length,0),                    color:"#34d399", icon:"🟢" },
    { key:"recolhido",  label:"Recolhidos",    value:hoje.reduce((a,v)=>a+v.passageiros.filter(p=>p.status==="recolhido").length,0),                 color:"#fb923c", icon:"🟠" },
    { key:"ausente",    label:"Ausentes",      value:hoje.reduce((a,v)=>a+v.passageiros.filter(p=>p.status==="ausente").length,0),                   color:"#f87171", icon:"🔴" },
    { key:"assinados",  label:"Com Assinatura",value:hoje.reduce((a,v)=>a+v.passageiros.filter(p=>p.assinatura).length,0),                          color:"#34d399", icon:"✅" },
  ];

  const tabs = [
    { id:"dashboard",  label:"📊 Dashboard"   },
    { id:"viagens",    label:"🚐 Viagens"      },
    { id:"relatorios", label:"📄 Relatórios"   },
    { id:"pacientes",  label:"👥 Pacientes"    },
    { id:"clinicas",   label:"🏥 Clínicas"     },
    { id:"motoristas", label:"🧑‍✈️ Motoristas"  },
    { id:"veiculos",   label:"🚗 Veículos"     },
    { id:"admins",     label:"👤 Usuários"     },
  ];

  const allDates = [...new Set(viagens.map(v=>v.data))].sort().reverse();

  return (
    <div style={{ minHeight:"100vh", background:"#050c18", color:"#e2e8f0", fontFamily:"'DM Sans', sans-serif" }}>
      {/* Modais */}
      {modal?.type==="viagem"    && <ModalViagem item={modal.item} veiculos={db.veiculos} motoristas={db.motoristas} pacientes={db.pacientes} destinos={db.destinos} onSave={saveViagem} onClose={closeModal}/>}
      {modal?.type==="paciente"  && <ModalPaciente  item={modal.item} onSave={f=>crudSave("pacientes",f)}  onClose={closeModal}/>}
      {modal?.type==="destino"   && <ModalDestino   item={modal.item} onSave={f=>crudSave("destinos",f)}   onClose={closeModal}/>}
      {modal?.type==="motorista" && <ModalMotorista item={modal.item} onSave={f=>crudSave("motoristas",f)} onClose={closeModal}/>}
      {modal?.type==="veiculo"   && <ModalVeiculo   item={modal.item} onSave={f=>crudSave("veiculos",f)}   onClose={closeModal}/>}
      {modal?.type==="admin"     && <ModalAdmin     item={modal.item} onSave={f=>crudSave("admins",f)}     onClose={closeModal}/>}

      {/* Drill-down dashboard */}
      {dashFilter && (
        <div style={S.modal} onClick={()=>setDashFilter(null)}>
          <div style={{ ...S.modalBox, maxWidth:600 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontSize:16,fontWeight:700,color:"#fff" }}>{dashFilter==="viagens"?"Viagens de Hoje":dashFilter==="total"?"Todos os Passageiros":dashFilter==="assinados"?"Passageiros Assinados":`Passageiros — ${STATUS_CONFIG[dashFilter]?.label||""}`}</div>
              <button onClick={()=>setDashFilter(null)} style={{ background:"none",border:"none",color:"#64748b",fontSize:22,cursor:"pointer" }}>×</button>
            </div>
            {dashFilter==="viagens" ? hoje.map(v=>(
              <div key={v.id} style={{ ...S.card,marginBottom:10 }}>
                <div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>Viagem #{v.id} — {v.horarioSaida}</div>
                <div style={{ fontSize:12,color:"#94a3b8" }}>{v.motorista.nome} · {v.veiculo.modelo}</div>
                <div style={{ fontSize:12,color:"#64748b",marginTop:4 }}>{v.passageiros.length} passageiro(s)</div>
              </div>
            )) : (() => {
              let list=[];
              hoje.forEach(v=>v.passageiros.filter(p=>{
                if(dashFilter==="total") return true;
                if(dashFilter==="assinados") return !!p.assinatura;
                return p.status===dashFilter;
              }).forEach(p=>list.push({...p,viagem:v})));
              if(list.length===0) return <div style={{ textAlign:"center",color:"#475569",padding:24 }}>Nenhum</div>;
              return list.map(p=>(
                <div key={p.id} style={{ ...S.card,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:700,color:"#e2e8f0" }}>{p.paciente.nome}</div>
                    <div style={{ fontSize:11,color:"#a78bfa" }}>{p.destino.nome}</div>
                    <div style={{ fontSize:11,color:"#64748b" }}>Viagem #{p.viagem.id} · {p.horarioChegada} {p.assinatura?"· ✅ Assinado":""}</div>
                  </div>
                  <StatusBadge status={p.status} onClick={()=>onStatusChange(p.viagem.id,p.id,STATUS_CONFIG[p.status].next)}/>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0a1f35,#050c18)", padding:"18px 20px", borderBottom:"1px solid #10243b" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>🏥</div>
            <div>
              <div style={{ fontSize:10,color:"#64748b",letterSpacing:2,textTransform:"uppercase" }}>Secretaria Municipal de Saúde</div>
              <div style={{ fontSize:17,fontWeight:700,color:"#fff" }}>Gestão de Transporte</div>
            </div>
          </div>
          {tab==="viagens"    && <Btn onClick={()=>setModal({type:"viagem",item:null})}    color="#10b981" small>+ Nova Viagem</Btn>}
          {tab==="pacientes"  && <Btn onClick={()=>setModal({type:"paciente",item:null})}  color="#10b981" small>+ Paciente</Btn>}
          {tab==="clinicas"   && <Btn onClick={()=>setModal({type:"destino",item:null})}   color="#10b981" small>+ Clínica</Btn>}
          {tab==="motoristas" && <Btn onClick={()=>setModal({type:"motorista",item:null})} color="#10b981" small>+ Motorista</Btn>}
          {tab==="veiculos"   && <Btn onClick={()=>setModal({type:"veiculo",item:null})}   color="#10b981" small>+ Veículo</Btn>}
          {tab==="admins"     && <Btn onClick={()=>setModal({type:"admin",item:null})}     color="#10b981" small>+ Usuário</Btn>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",borderBottom:"1px solid #0f1f35",background:"#070f1f",overflowX:"auto" }}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"12px 14px",background:"none",border:"none",whiteSpace:"nowrap",color:tab===t.id?"#10b981":"#64748b",borderBottom:tab===t.id?"2px solid #10b981":"2px solid transparent",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>{t.label}</button>)}
      </div>

      {tab === "relatorios" && <Relatorios viagens={viagens} db={db}/>}

      {tab !== "relatorios" && (
        <div style={{ padding:20, maxWidth:800, margin:"0 auto" }}>
          {/* DASHBOARD */}
          {tab==="dashboard" && (
            <div>
              <SecTitle>RESUMO DO DIA — {fmtDate(TODAY)}</SecTitle>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24 }}>
                {DASH_STATS.map(s=>(
                  <button key={s.key} onClick={()=>setDashFilter(s.key)} style={{ background:"#0c1a2e",borderRadius:14,padding:16,border:`1px solid ${s.color}33`,textAlign:"center",cursor:"pointer",fontFamily:"inherit",outline:"none" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color;e.currentTarget.style.background="#0f2040";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=`${s.color}33`;e.currentTarget.style.background="#0c1a2e";}}>
                    <div style={{ fontSize:22,marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontSize:28,fontWeight:800,color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:11,color:"#64748b" }}>{s.label}</div>
                  </button>
                ))}
              </div>
              <SecTitle>PROGRESSO POR STATUS</SecTitle>
              {totalPax===0 ? <div style={{ color:"#475569",fontSize:13 }}>Nenhum passageiro hoje</div>
                : Object.entries(STATUS_CONFIG).map(([key,cfg])=>{
                  const count=hoje.reduce((a,v)=>a+v.passageiros.filter(p=>p.status===key).length,0);
                  if(count===0) return null;
                  return (
                    <div key={key} onClick={()=>setDashFilter(key)} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10,cursor:"pointer" }}>
                      <div style={{ width:90,fontSize:12,color:cfg.color,fontWeight:600 }}>{cfg.label}</div>
                      <div style={{ flex:1,height:10,background:"#1e293b",borderRadius:6,overflow:"hidden" }}>
                        <div style={{ width:`${(count/totalPax)*100}%`,height:"100%",background:cfg.color,borderRadius:6,transition:"width .5s" }}/>
                      </div>
                      <div style={{ width:24,textAlign:"right",fontSize:13,fontWeight:700,color:"#e2e8f0" }}>{count}</div>
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* VIAGENS */}
          {tab==="viagens" && allDates.map(data=>{
            const vs=viagens.filter(v=>v.data===data);
            return (
              <div key={data}>
                <SecTitle>{data===TODAY?`HOJE — ${fmtDate(data)}`:data>TODAY?`FUTURO — ${fmtDate(data)}`:fmtDate(data)}</SecTitle>
                {vs.map(v=>(
                  <div key={v.id} style={S.card}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:11,color:"#64748b",letterSpacing:2,textTransform:"uppercase",marginBottom:2 }}>VIAGEM #{v.id}</div>
                        <div style={{ fontSize:17,fontWeight:700,color:"#fff" }}>🕐 {v.horarioSaida}</div>
                        <div style={{ fontSize:12,color:"#94a3b8" }}>{v.motorista.nome} · {v.veiculo.modelo} ({v.veiculo.placa})</div>
                        {v.abastecimento && <div style={{ fontSize:11,color:"#34d399",marginTop:2 }}>⛽ Abastecimento: {fmtCurrency(v.abastecimento.total)}</div>}
                      </div>
                      <ViagemStatusBadge status={v.status}/>
                    </div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:12 }}>
                      {v.passageiros.map(p=>(
                        <span key={p.id} style={{ background:STATUS_CONFIG[p.status].color+"18",border:`1px solid ${STATUS_CONFIG[p.status].color}44`,borderRadius:8,padding:"4px 10px",fontSize:11,color:"#e2e8f0" }}>
                          {p.paciente.nome.split(" ")[0]} — <span style={{ color:STATUS_CONFIG[p.status].color }}>{STATUS_CONFIG[p.status].label}</span>{p.assinatura?" ✅":""}
                        </span>
                      ))}
                    </div>
                    <div style={{ display:"flex",gap:8 }}>
                      <Btn small onClick={()=>setModal({type:"viagem",item:v})} color="#3b82f6">✏️ Editar</Btn>
                      <Btn small danger onClick={()=>deleteViagem(v.id)}>🗑️ Excluir</Btn>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* CRUD lists */}
          {tab==="pacientes" && <CrudList title="Pacientes" icon="👥" items={db.pacientes}
            renderRow={p=><div><div style={{ fontSize:14,fontWeight:700,color:"#e2e8f0" }}>{p.nome}</div><div style={{ fontSize:12,color:"#64748b" }}>{p.cpf} · {p.telefone}</div></div>}
            onNew={()=>setModal({type:"paciente",item:null})} onEdit={item=>setModal({type:"paciente",item})} onDelete={id=>crudDelete("pacientes",id)}/>}

          {tab==="clinicas" && <CrudList title="Clínicas e Hospitais" icon="🏥" items={db.destinos}
            renderRow={d=><div><div style={{ fontSize:14,fontWeight:700,color:"#e2e8f0" }}>{d.nome}</div><div style={{ fontSize:12,color:"#a78bfa" }}>{d.especialidade} · {d.cidade}</div><div style={{ fontSize:11,color:"#64748b" }}>{d.endereco}</div></div>}
            onNew={()=>setModal({type:"destino",item:null})} onEdit={item=>setModal({type:"destino",item})} onDelete={id=>crudDelete("destinos",id)}/>}

          {tab==="motoristas" && <CrudList title="Motoristas" icon="🧑‍✈️" items={db.motoristas}
            renderRow={m=><div><div style={{ fontSize:14,fontWeight:700,color:"#e2e8f0" }}>{m.nome}</div><div style={{ fontSize:12,color:"#64748b" }}>CNH {m.cnh} · Cat. {m.categoriaCnh} · {m.telefone}</div></div>}
            onNew={()=>setModal({type:"motorista",item:null})} onEdit={item=>setModal({type:"motorista",item})} onDelete={id=>crudDelete("motoristas",id)}/>}

          {tab==="veiculos" && <CrudList title="Frota" icon="🚗" items={db.veiculos}
            renderRow={v=><div><div style={{ fontSize:14,fontWeight:700,color:"#e2e8f0" }}>{v.placa} — {v.modelo}</div><div style={{ fontSize:12,color:"#64748b" }}>{v.tipo} · {v.capacidade} lug. · {v.ano} · {v.combustivel} · {v.consumoMedio}km/l</div><div style={{ fontSize:11,color:"#475569" }}>KM atual: {v.kmAtual?.toLocaleString()}</div></div>}
            onNew={()=>setModal({type:"veiculo",item:null})} onEdit={item=>setModal({type:"veiculo",item})} onDelete={id=>crudDelete("veiculos",id)}/>}

          {tab==="admins" && <CrudList title="Usuários Admin" icon="👤" items={db.admins}
            renderRow={a=><div><div style={{ fontSize:14,fontWeight:700,color:"#e2e8f0" }}>{a.nome}</div><div style={{ fontSize:12,color:"#64748b" }}>{a.email}</div><div style={{ fontSize:11,color:"#a78bfa" }}>{a.cargo}</div></div>}
            onNew={()=>setModal({type:"admin",item:null})} onEdit={item=>setModal({type:"admin",item})} onDelete={id=>crudDelete("admins",id)}/>}
        </div>
      )}
    </div>
  );
}
