import { useState } from 'react';
import { S, Field, Inp, Sel, Btn, ModalHdr, AutoC, SecTitle, StatusBadge } from './UI.jsx';
import { TODAY, VIAGEM_STATUS, COMBUSTIVEIS, fmtDate, fmtCurrency } from './data.js';

export function ModalPaciente({ item, onSave, onClose }) {
  const [f,setF]=useState(item||{nome:"",cpf:"",telefone:"",dataNasc:""});
  return (
    <div style={S.modal}><div style={S.modalBox}>
      <ModalHdr title={item?"Editar Paciente":"Novo Paciente"} onClose={onClose}/>
      <Inp label="Nome Completo" value={f.nome} onChange={e=>setF(p=>({...p,nome:e.target.value}))}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Inp label="CPF" value={f.cpf} onChange={e=>setF(p=>({...p,cpf:e.target.value}))} placeholder="000.000.000-00"/>
        <Inp label="Telefone" value={f.telefone} onChange={e=>setF(p=>({...p,telefone:e.target.value}))} placeholder="(67) 99000-0000"/>
      </div>
      <Inp label="Data de Nascimento" type="date" value={f.dataNasc} onChange={e=>setF(p=>({...p,dataNasc:e.target.value}))}/>
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        <Btn full onClick={()=>onSave(f)} color="#10b981" disabled={!f.nome}>Salvar</Btn>
        <Btn full onClick={onClose} color="#475569">Cancelar</Btn>
      </div>
    </div></div>
  );
}

export function ModalDestino({ item, onSave, onClose }) {
  const [f,setF]=useState(item||{nome:"",cidade:"",especialidade:"",endereco:"",telefone:""});
  return (
    <div style={S.modal}><div style={{ ...S.modalBox, maxWidth:600 }}>
      <ModalHdr title={item?"Editar Clínica/Hospital":"Nova Clínica/Hospital"} onClose={onClose}/>
      <Inp label="Nome" value={f.nome} onChange={e=>setF(p=>({...p,nome:e.target.value}))}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Inp label="Cidade" value={f.cidade} onChange={e=>setF(p=>({...p,cidade:e.target.value}))}/>
        <Inp label="Especialidade" value={f.especialidade} onChange={e=>setF(p=>({...p,especialidade:e.target.value}))}/>
      </div>
      <Inp label="Endereço" value={f.endereco} onChange={e=>setF(p=>({...p,endereco:e.target.value}))}/>
      <Inp label="Telefone" value={f.telefone} onChange={e=>setF(p=>({...p,telefone:e.target.value}))}/>
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        <Btn full onClick={()=>onSave(f)} color="#10b981" disabled={!f.nome}>Salvar</Btn>
        <Btn full onClick={onClose} color="#475569">Cancelar</Btn>
      </div>
    </div></div>
  );
}

export function ModalMotorista({ item, onSave, onClose }) {
  const [f,setF]=useState(item||{nome:"",cnh:"",telefone:"",categoriaCnh:"B"});
  return (
    <div style={S.modal}><div style={S.modalBox}>
      <ModalHdr title={item?"Editar Motorista":"Novo Motorista"} onClose={onClose}/>
      <Inp label="Nome Completo" value={f.nome} onChange={e=>setF(p=>({...p,nome:e.target.value}))}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Inp label="CNH" value={f.cnh} onChange={e=>setF(p=>({...p,cnh:e.target.value}))}/>
        <Sel label="Categoria" value={f.categoriaCnh} onChange={v=>setF(p=>({...p,categoriaCnh:v}))} options={["A","B","C","D","E"].map(c=>({value:c,label:"Cat. "+c}))}/>
      </div>
      <Inp label="Telefone" value={f.telefone} onChange={e=>setF(p=>({...p,telefone:e.target.value}))}/>
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        <Btn full onClick={()=>onSave(f)} color="#10b981" disabled={!f.nome}>Salvar</Btn>
        <Btn full onClick={onClose} color="#475569">Cancelar</Btn>
      </div>
    </div></div>
  );
}

export function ModalVeiculo({ item, onSave, onClose }) {
  const [f,setF]=useState(item||{placa:"",modelo:"",capacidade:7,tipo:"Van Pequena",ano:2024,cor:"Branco",kmAtual:0,combustivel:"Gasolina",consumoMedio:10});
  return (
    <div style={S.modal}><div style={S.modalBox}>
      <ModalHdr title={item?"Editar Veículo":"Novo Veículo"} onClose={onClose}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Inp label="Placa" value={f.placa} onChange={e=>setF(p=>({...p,placa:e.target.value}))} placeholder="ABC-1234"/>
        <Sel label="Tipo" value={f.tipo} onChange={v=>setF(p=>({...p,tipo:v}))} options={["Carro","Van Pequena","Van Grande","Micro-ônibus"].map(t=>({value:t,label:t}))}/>
      </div>
      <Inp label="Modelo" value={f.modelo} onChange={e=>setF(p=>({...p,modelo:e.target.value}))}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        <Inp label="Capacidade" type="number" value={f.capacidade} onChange={e=>setF(p=>({...p,capacidade:parseInt(e.target.value)||1}))}/>
        <Inp label="Ano" type="number" value={f.ano} onChange={e=>setF(p=>({...p,ano:parseInt(e.target.value)||2024}))}/>
        <Inp label="Cor" value={f.cor} onChange={e=>setF(p=>({...p,cor:e.target.value}))}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        <Inp label="KM Atual" type="number" value={f.kmAtual} onChange={e=>setF(p=>({...p,kmAtual:parseInt(e.target.value)||0}))}/>
        <Sel label="Combustível" value={f.combustivel} onChange={v=>setF(p=>({...p,combustivel:v}))} options={COMBUSTIVEIS.map(c=>({value:c,label:c}))}/>
        <Inp label="Consumo (km/l)" type="number" value={f.consumoMedio} onChange={e=>setF(p=>({...p,consumoMedio:parseFloat(e.target.value)||10}))}/>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        <Btn full onClick={()=>onSave(f)} color="#10b981" disabled={!f.placa}>Salvar</Btn>
        <Btn full onClick={onClose} color="#475569">Cancelar</Btn>
      </div>
    </div></div>
  );
}

export function ModalAdmin({ item, onSave, onClose }) {
  const [f,setF]=useState(item||{nome:"",email:"",cargo:"",senha:""});
  return (
    <div style={S.modal}><div style={S.modalBox}>
      <ModalHdr title={item?"Editar Usuário":"Novo Usuário Admin"} onClose={onClose}/>
      <Inp label="Nome Completo" value={f.nome} onChange={e=>setF(p=>({...p,nome:e.target.value}))}/>
      <Inp label="E-mail" type="email" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/>
      <Inp label="Cargo / Função" value={f.cargo} onChange={e=>setF(p=>({...p,cargo:e.target.value}))}/>
      {!item && <Inp label="Senha" type="password" value={f.senha} onChange={e=>setF(p=>({...p,senha:e.target.value}))}/>}
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        <Btn full onClick={()=>onSave(f)} color="#10b981" disabled={!f.nome}>Salvar</Btn>
        <Btn full onClick={onClose} color="#475569">Cancelar</Btn>
      </div>
    </div></div>
  );
}

export function ModalViagem({ item, veiculos, motoristas, pacientes, destinos, onSave, onClose }) {
  const [form,setForm]=useState(item
    ?{id:item.id,data:item.data,horarioSaida:item.horarioSaida,veiculoId:item.veiculo.id,motoristaId:item.motorista.id,passageiros:item.passageiros,status:item.status,abastecimento:item.abastecimento||null}
    :{data:TODAY,horarioSaida:"05:30",veiculoId:veiculos[0]?.id||1,motoristaId:motoristas[0]?.id||1,passageiros:[],status:"agendada",abastecimento:null});
  const [paxQ,setPaxQ]=useState(""); const [paxRes,setPaxRes]=useState([]);
  const [destQ,setDestQ]=useState(""); const [destRes,setDestRes]=useState([]);
  const [selPac,setSelPac]=useState(null); const [selDest,setSelDest]=useState(null);
  const [horCheg,setHorCheg]=useState("08:00");
  const [localEmbarque,setLocalEmbarque]=useState("");
  const [tipoTrajeto,setTipoTrajeto]=useState("ida_volta");
  const [acompNome,setAcompNome]=useState("");
  const [acompList,setAcompList]=useState([]);

  const cap=veiculos.find(v=>v.id===parseInt(form.veiculoId))?.capacidade||0;
  // total de vagas = passageiros + seus acompanhantes
  const totalVagas = form.passageiros.reduce((a,p)=>a+1+(p.acompanhantes?.length||0),0);

  const TRAJETOS=[
    {value:"ida_volta", label:"Ida e Volta"},
    {value:"ida",       label:"Somente Ida"},
    {value:"volta",     label:"Somente Volta"},
  ];

  function addAcomp() {
    if(!acompNome.trim()) return;
    setAcompList(prev=>[...prev,{id:Date.now(),nome:acompNome.trim(),assinatura:null}]);
    setAcompNome("");
  }
  function removeAcomp(id) { setAcompList(prev=>prev.filter(a=>a.id!==id)); }

  function addPax() {
    if(!selPac||!selDest) return;
    const vagasNecessarias = 1 + acompList.length;
    if(totalVagas + vagasNecessarias > cap) { alert(`Veículo lotado! Capacidade: ${cap} vagas.`); return; }
    setForm(f=>({...f,passageiros:[...f.passageiros,{id:Date.now(),paciente:selPac,destino:selDest,horarioChegada:horCheg,localEmbarque,tipoTrajeto,acompanhantes:acompList,status:"indefinido",assinatura:null}]}));
    setSelPac(null);setPaxQ("");setSelDest(null);setDestQ("");setPaxRes([]);setDestRes([]);
    setLocalEmbarque(""); setTipoTrajeto("ida_volta"); setAcompList([]); setAcompNome("");
  }
  function save() {
    const veiculo=veiculos.find(v=>v.id===parseInt(form.veiculoId));
    const motorista=motoristas.find(m=>m.id===parseInt(form.motoristaId));
    onSave({...form,veiculo,motorista});
  }
  return (
    <div style={S.modal}><div style={{ ...S.modalBox, maxWidth:620 }}>
      <ModalHdr title={item?`Editar Viagem #${item.id}`:"Nova Viagem"} onClose={onClose}/>
      {item && <div style={{ background:VIAGEM_STATUS[item.status]?.color+"18", border:`1px solid ${VIAGEM_STATUS[item.status]?.color}44`, borderRadius:10, padding:"8px 14px", marginBottom:16, fontSize:12, color:VIAGEM_STATUS[item.status]?.color }}>Status atual: <b>{VIAGEM_STATUS[item.status]?.label}</b> — alterações aplicadas imediatamente.</div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Inp label="Data" type="date" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/>
        <Inp label="Saída" type="time" value={form.horarioSaida} onChange={e=>setForm(f=>({...f,horarioSaida:e.target.value}))}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Sel label="Motorista" value={form.motoristaId} onChange={v=>setForm(f=>({...f,motoristaId:parseInt(v)}))} options={motoristas.map(m=>({value:m.id,label:m.nome}))}/>
        <Sel label="Veículo" value={form.veiculoId} onChange={v=>setForm(f=>({...f,veiculoId:parseInt(v)}))} options={veiculos.map(v=>({value:v.id,label:`${v.placa} (${v.capacidade}lug.)`}))}/>
      </div>
      <Sel label="Status" value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={Object.entries(VIAGEM_STATUS).map(([k,v])=>({value:k,label:v.label}))}/>
      <div style={{ background:"#0f2040", borderRadius:14, padding:14, border:"1px solid #1e3a5f", marginBottom:14 }}>
        <SecTitle>Adicionar Passageiro ({form.passageiros.length}/{cap})</SecTitle>
        <AutoC label="Paciente" placeholder="Digite o nome..." value={selPac?selPac.nome:paxQ} results={paxRes}
          onQuery={q=>{setPaxQ(q);setPaxRes(q?pacientes.filter(p=>p.nome.toLowerCase().includes(q.toLowerCase())).slice(0,5):[]);}}
          onSelect={p=>{setSelPac(p);setPaxRes([]);}}
          renderItem={p=><span>{p.nome} <span style={{fontSize:11,color:"#64748b"}}>— {p.cpf}</span></span>}/>
        <AutoC label="Destino" placeholder="Hospital, clínica ou especialidade..." value={selDest?selDest.nome:destQ} results={destRes}
          onQuery={q=>{setDestQ(q);setDestRes(q?destinos.filter(d=>d.nome.toLowerCase().includes(q.toLowerCase())||d.especialidade.toLowerCase().includes(q.toLowerCase())).slice(0,5):[]);}}
          onSelect={d=>{setSelDest(d);setDestRes([]);}}
          renderItem={d=><span>{d.nome} <span style={{fontSize:11,color:"#a78bfa"}}>— {d.especialidade}</span></span>}/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={S.label}>Horário Chegada</label>
            <input type="time" value={horCheg} onChange={e=>setHorCheg(e.target.value)} style={S.input}/>
          </div>
          <div>
            <label style={S.label}>Trajeto</label>
            <select value={tipoTrajeto} onChange={e=>setTipoTrajeto(e.target.value)} style={S.input}>
              {TRAJETOS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop:10 }}>
          <label style={S.label}>Local de Embarque</label>
          <input value={localEmbarque} onChange={e=>setLocalEmbarque(e.target.value)} placeholder="Ex: Rua das Flores, 123 / Praça Central" style={S.input}/>
        </div>
        {/* Acompanhantes */}
        <div style={{ marginTop:10 }}>
          <label style={S.label}>Acompanhantes ({acompList.length})</label>
          <div style={{ display:"flex", gap:8 }}>
            <input value={acompNome} onChange={e=>setAcompNome(e.target.value)} placeholder="Nome do acompanhante" style={{...S.input,marginBottom:0}} onKeyDown={e=>e.key==="Enter"&&addAcomp()}/>
            <Btn onClick={addAcomp} disabled={!acompNome.trim()} color="#a78bfa" small>+ Add</Btn>
          </div>
          {acompList.map(a=>(
            <div key={a.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",background:"#0a1628",borderRadius:8,padding:"6px 12px",marginTop:6,fontSize:12,color:"#e2e8f0" }}>
              <span>👤 {a.nome}</span>
              <button onClick={()=>removeAcomp(a.id)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:16 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10 }}>
          <Btn onClick={addPax} disabled={!selPac||!selDest||totalVagas>=cap} color="#3b82f6" full>+ Adicionar Passageiro</Btn>
        </div>
      </div>
      {form.passageiros.length>0 && <>
        <SecTitle>Passageiros ({totalVagas}/{cap} vagas)</SecTitle>
        {form.passageiros.map((p,i)=>(
          <div key={p.id} style={{ background:"#0f2040", borderRadius:10, padding:"10px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{p.paciente.nome}</div>
              <div style={{ fontSize:11, color:"#a78bfa" }}>{p.destino.nome} <span style={{color:"#64748b"}}>• {p.horarioChegada}</span></div>
              <div style={{ fontSize:11, color:"#64748b" }}>
                {p.localEmbarque && <span>📍 {p.localEmbarque} • </span>}
                <span style={{color: p.tipoTrajeto==="ida_volta"?"#34d399":p.tipoTrajeto==="ida"?"#38bdf8":"#fbbf24"}}>
                  {p.tipoTrajeto==="ida_volta"?"Ida e Volta":p.tipoTrajeto==="ida"?"Somente Ida":"Somente Volta"}
                </span>
              </div>
            </div>
            <button onClick={()=>setForm(f=>({...f,passageiros:f.passageiros.filter((_,j)=>j!==i)}))} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:18 }}>×</button>
          </div>
          {p.acompanhantes?.length>0 && (
            <div style={{ paddingLeft:14,marginTop:4 }}>
              {p.acompanhantes.map(a=>(
                <div key={a.id} style={{ fontSize:11,color:"#94a3b8",padding:"2px 0" }}>👤 {a.nome}</div>
              ))}
            </div>
          )}
        ))}
      </>}
      <div style={{ display:"flex", gap:10, marginTop:12 }}>
        <Btn full onClick={save} color="#10b981" disabled={form.passageiros.length===0}>💾 Salvar Viagem</Btn>
        <Btn full onClick={onClose} color="#475569">Cancelar</Btn>
      </div>
    </div></div>
  );
}

// Modal de Abastecimento
export function ModalAbastecimento({ viagemId, veiculo, motoristaNome, onSave, onClose }) {
  const [f,setF]=useState({ litros:"", valorLitro:"", kmInicial:veiculo?.kmAtual||"", kmFinal:"", combustivel:veiculo?.combustivel||"Diesel", posto:"", nota:"" });
  const total = (parseFloat(f.litros)||0)*(parseFloat(f.valorLitro)||0);
  const km = (parseInt(f.kmFinal)||0)-(parseInt(f.kmInicial)||0);
  const consumo = km>0 && f.litros>0 ? (km/(parseFloat(f.litros)||1)).toFixed(1) : null;
  return (
    <div style={S.modal}><div style={S.modalBox}>
      <ModalHdr title="Registrar Abastecimento" onClose={onClose}/>
      <div style={{ background:"#0f2040", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
        <div style={{ fontSize:12, color:"#64748b" }}>Veículo: <span style={{color:"#38bdf8",fontWeight:600}}>{veiculo?.placa} — {veiculo?.modelo}</span></div>
        <div style={{ fontSize:12, color:"#64748b" }}>Motorista: <span style={{color:"#e2e8f0"}}>{motoristaNome}</span></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Inp label="Litros Abastecidos" type="number" step="0.1" value={f.litros} onChange={e=>setF(p=>({...p,litros:e.target.value}))} placeholder="0.0"/>
        <Inp label="Valor por Litro (R$)" type="number" step="0.01" value={f.valorLitro} onChange={e=>setF(p=>({...p,valorLitro:e.target.value}))} placeholder="0.00"/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Inp label="KM Inicial" type="number" value={f.kmInicial} onChange={e=>setF(p=>({...p,kmInicial:e.target.value}))}/>
        <Inp label="KM Final" type="number" value={f.kmFinal} onChange={e=>setF(p=>({...p,kmFinal:e.target.value}))}/>
      </div>
      <Sel label="Combustível" value={f.combustivel} onChange={v=>setF(p=>({...p,combustivel:v}))} options={COMBUSTIVEIS.map(c=>({value:c,label:c}))}/>
      <Inp label="Nome do Posto" value={f.posto} onChange={e=>setF(p=>({...p,posto:e.target.value}))} placeholder="Ex: Posto Ipiranga Centro"/>
      <Inp label="Nota Fiscal / Cupom" value={f.nota} onChange={e=>setF(p=>({...p,nota:e.target.value}))} placeholder="Ex: NF-0001"/>
      {total>0 && (
        <div style={{ background:"#052e1c", border:"1px solid #34d39944", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:11, color:"#64748b" }}>Total</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#34d399" }}>{fmtCurrency(total)}</div>
            </div>
            {consumo && <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, color:"#64748b" }}>Consumo Calculado</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#fbbf24" }}>{consumo} km/l</div>
            </div>}
          </div>
        </div>
      )}
      <div style={{ display:"flex", gap:10 }}>
        <Btn full onClick={()=>onSave({...f,total,km,viagemId})} color="#10b981" disabled={!f.litros||!f.valorLitro}>💾 Salvar</Btn>
        <Btn full onClick={onClose} color="#475569">Cancelar</Btn>
      </div>
    </div></div>
  );
}

// Modal de Assinatura Digital
export function ModalAssinatura({ passageiro, nomeOverride, onSave, onClose }) {
  const [signed, setSigned] = useState(false);
  const [points, setPoints] = useState([]);
  const [drawing, setDrawing] = useState(false);

  function getPos(e, rect) {
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }
  function startDraw(e) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = getPos(e, rect);
    setDrawing(true);
    setPoints(prev => [...prev, [pos]]);
  }
  function draw(e) {
    e.preventDefault();
    if(!drawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = getPos(e, rect);
    setPoints(prev => { const n=[...prev]; n[n.length-1]=[...n[n.length-1],pos]; return n; });
    setSigned(true);
  }
  function endDraw(e) { e.preventDefault(); setDrawing(false); }
  function clear() { setPoints([]); setSigned(false); }

  function saveSign() {
    // Build SVG path from points
    const paths = points.map(stroke => {
      if(stroke.length===0) return "";
      let d = `M ${stroke[0].x} ${stroke[0].y}`;
      stroke.slice(1).forEach(p => { d += ` L ${p.x} ${p.y}`; });
      return `<path d="${d}" stroke="#38bdf8" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    }).join("");
    const svg = `data:image/svg+xml;base64,${btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='160' style='background:#070f1f'>${paths}</svg>`)}`;
    onSave(svg);
  }

  return (
    <div style={S.modal}><div style={S.modalBox}>
      <ModalHdr title="Assinatura Digital" onClose={onClose}/>
      <div style={{ marginBottom:14 }}>
        {nomeOverride
          ? <><div style={{ fontSize:11,color:"#a78bfa",marginBottom:2 }}>ACOMPANHANTE DE {passageiro.paciente.nome}</div><div style={{ fontSize:14,fontWeight:600,color:"#e2e8f0" }}>{nomeOverride}</div></>
          : <><div style={{ fontSize:14,fontWeight:600,color:"#e2e8f0" }}>{passageiro.paciente.nome}</div><div style={{ fontSize:12,color:"#64748b" }}>Destino: {passageiro.destino.nome}</div><div style={{ fontSize:12,color:"#a78bfa" }}>CPF: {passageiro.paciente.cpf}</div></>
        }
      </div>
      <div style={{ background:"#070f1f", border:"2px dashed #1e3a5f", borderRadius:12, marginBottom:14, position:"relative", overflow:"hidden", touchAction:"none" }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}>
        <svg width="100%" height="160" style={{ display:"block" }}>
          {points.map((stroke,i) => stroke.length>1 && (
            <polyline key={i} points={stroke.map(p=>`${p.x},${p.y}`).join(" ")} stroke="#38bdf8" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          ))}
          {!signed && <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#1e3a5f" fontSize="13" fontFamily="sans-serif">Assine aqui com o dedo</text>}
        </svg>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <Btn full onClick={saveSign} color="#10b981" disabled={!signed}>✅ Confirmar Assinatura</Btn>
        <Btn onClick={clear} color="#475569" small>🗑️ Limpar</Btn>
        <Btn onClick={onClose} color="#475569" small>Cancelar</Btn>
      </div>
      <div style={{ marginTop:12, fontSize:11, color:"#475569", textAlign:"center" }}>
        A assinatura confirma o embarque do paciente e serve como comprovante para prestação de contas.
      </div>
    </div></div>
  );
}
