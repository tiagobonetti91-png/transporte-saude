import { useState } from 'react';
import { fmtDate } from './data.js';

const T = {
  bg:"#f0f4f8", bgCard:"#ffffff", bgCard2:"#f8fafc", border:"#e5e7eb",
  text:"#111827", textSub:"#6b7280", textMuted:"#9ca3af",
  blue:"#1a56db", green:"#059669", purple:"#7c3aed", yellow:"#d97706", red:"#dc2626",
};

function Btn({ children, onClick, color="#1a56db", disabled, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding:"9px 18px", background:disabled?"#d1d5db":color, color:"#fff", border:"none", borderRadius:10, fontWeight:600, fontSize:13, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", opacity:disabled?0.7:1, ...style }}>
      {children}
    </button>
  );
}

export default function ImportarRoteiro({ onImportado, onClose, apiPacientes, apiDestinos, apiMotoristas, apiVeiculos, apiViagens, mapPaciente, mapDestino, mapMotorista, mapVeiculo, db, recarregar }) {
  const [etapa, setEtapa] = useState("upload"); // upload | processando | revisao | concluido
  const [dados, setDados] = useState(null);
  const [erroMsg, setErroMsg] = useState("");
  const [progresso, setProgresso] = useState("");
  const [resultado, setResultado] = useState(null);

  async function handleFile(file) {
    if (!file) return;
    setEtapa("processando");
    setProgresso("Lendo o arquivo PDF...");
    setErroMsg("");
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      setProgresso("Enviando para a IA extrair os dados...");
      const resp = await fetch("/api/importar-roteiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: base64, fileName: file.name })
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Nao foi possivel importar este roteiro.");

      if (!json.viagens || json.viagens.length === 0) throw new Error("Nenhuma viagem encontrada no arquivo.");
      setDados(json);
      setEtapa("revisao");
    } catch(e) {
      setErroMsg("Erro: " + e.message);
      setEtapa("upload");
    }
  }

  async function cadastrarTudo() {
    if (!dados) return;
    setEtapa("processando");
    setProgresso("Cadastrando dados no banco...");

    let motsCriados = 0, veicsCriados = 0, pacsCriados = 0, destsCriados = 0, viagsCriadas = 0;

    try {
      for (const v of dados.viagens) {
        setProgresso(`Processando viagem ${v.numeroViagem}...`);

        // 1. Motorista
        let motorista = db.motoristas.find(m => m.nome.toLowerCase() === v.motorista.nome.toLowerCase() || m.cnh === v.motorista.cnh);
        if (!motorista) {
          const [novo] = await apiMotoristas.criar({ nome: v.motorista.nome, cnh: v.motorista.cnh, telefone: "", categoriaCnh: "D" });
          motorista = mapMotorista(novo);
          motsCriados++;
        }

        // 2. Veiculo
        let veiculo = db.veiculos.find(x => x.placa === v.veiculo.placa);
        if (!veiculo) {
          const [novo] = await apiVeiculos.criar({ placa: v.veiculo.placa, modelo: v.veiculo.modelo, capacidade: v.veiculo.vagas||10, tipo: "Van", ano: 2020, cor: "Branco", kmAtual: 0, combustivel: "Diesel", consumoMedio: 10 });
          veiculo = mapVeiculo(novo);
          veicsCriados++;
        }

        // 3. Passageiros e destinos
        const passageirosViagem = [];
        for (const p of v.passageiros) {
          // Paciente
          let paciente = db.pacientes.find(x => x.cpf === p.cpf || x.nome.toLowerCase() === p.nome.toLowerCase());
          if (!paciente) {
            const [novo] = await apiPacientes.criar({ nome: p.nome, cpf: p.cpf||"", telefone: p.telefone||"", dataNasc: null });
            paciente = mapPaciente(novo);
            pacsCriados++;
          }

          // Destino
          let destino = db.destinos.find(x => x.nome.toLowerCase().includes(p.destino.toLowerCase()) || p.destino.toLowerCase().includes(x.nome.toLowerCase()));
          if (!destino) {
            const [novo] = await apiDestinos.criar({ nome: p.destino, cidade: "Florianopolis", especialidade: "", endereco: "", telefone: "" });
            destino = mapDestino(novo);
            destsCriados++;
          }

          // Acompanhantes
          const acompanhantes = (p.acompanhantes || []).map(a => ({ id: Date.now() + Math.random(), nome: a.nome, cpf: a.cpf || "", assinatura: null }));

          passageirosViagem.push({ paciente, destino, horarioChegada: p.horarioChegada || "08:00", localEmbarque: p.localEmbarque || "", tipoTrajeto: p.tipoTrajeto || "ida_volta", acompanhantes, status: "indefinido", assinatura: null });
        }

        // 4. Viagem
        await apiViagens.criar({ data: v.data, horarioSaida: v.horaSaida, veiculo, motorista, status: "agendada", passageiros: passageirosViagem, abastecimento: null });
        viagsCriadas++;
      }

      await recarregar();
      setResultado({ motsCriados, veicsCriados, pacsCriados, destsCriados, viagsCriadas });
      setEtapa("concluido");
    } catch(e) {
      setErroMsg("Erro ao cadastrar: " + e.message);
      setEtapa("revisao");
    }
  }

  const totalPax = dados?.viagens?.reduce((a, v) => a + v.passageiros.length, 0) || 0;
  const totalAcomp = dados?.viagens?.reduce((a, v) => a + v.passageiros.reduce((b, p) => b + (p.acompanhantes?.length || 0), 0), 0) || 0;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:500, padding:20, overflowY:"auto" }}>
      <div style={{ background:T.bgCard, borderRadius:20, width:"100%", maxWidth:720, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", marginTop:20 }}>
        {/* Header */}
        <div style={{ padding:"18px 24px", borderBottom:"1px solid "+T.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:T.text }}>Importar Roteiro de Viagem</div>
            <div style={{ fontSize:12, color:T.textSub }}>Carregue um PDF do roteiro para cadastrar automaticamente</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, color:T.textSub, cursor:"pointer" }}>×</button>
        </div>

        <div style={{ padding:24 }}>
          {/* Steps */}
          <div style={{ display:"flex", marginBottom:24 }}>
            {[["upload","1. Upload"],["processando","2. Processando"],["revisao","3. Revisao"],["concluido","4. Pronto"]].map(([id,label],i)=>(
              <div key={id} style={{ flex:1, textAlign:"center", padding:"8px 4px", fontSize:12, borderBottom:"2px solid "+(etapa===id?T.blue:["upload","processando","revisao","concluido"].indexOf(etapa)>i?"#059669":T.border), color:etapa===id?T.blue:["upload","processando","revisao","concluido"].indexOf(etapa)>i?"#059669":T.textMuted, fontWeight:etapa===id?600:400 }}>
                {label}
              </div>
            ))}
          </div>

          {/* UPLOAD */}
          {etapa==="upload" && (
            <div>
              <div onClick={()=>document.getElementById("pdf-input").click()}
                style={{ border:"2px dashed "+T.border, borderRadius:14, padding:"40px 20px", textAlign:"center", cursor:"pointer", background:T.bgCard2, transition:"all .2s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=T.blue}
                onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}
                onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor=T.blue;}}
                onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor=T.border;handleFile(e.dataTransfer.files[0]);}}>
                <div style={{ fontSize:40, marginBottom:12 }}>📄</div>
                <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:4 }}>Arraste o PDF do roteiro aqui</div>
                <div style={{ fontSize:13, color:T.textSub, marginBottom:16 }}>ou clique para selecionar</div>
                <Btn>Selecionar PDF</Btn>
                <input id="pdf-input" type="file" accept=".pdf" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])}/>
              </div>
              {erroMsg && <div style={{ marginTop:12, background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, padding:"10px 14px", fontSize:13, color:T.red }}>{erroMsg}</div>}
              <div style={{ marginTop:16, background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#1e40af" }}>
                <b>Como funciona:</b> A IA le o PDF e extrai automaticamente motoristas, veiculos, passageiros e destinos. Voce revisa antes de cadastrar no banco.
              </div>
            </div>
          )}

          {/* PROCESSANDO */}
          {etapa==="processando" && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ width:48, height:48, border:"3px solid #e5e7eb", borderTopColor:T.blue, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }}/>
              <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
              <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:4 }}>{progresso}</div>
              <div style={{ fontSize:12, color:T.textSub }}>Aguarde, isso pode levar alguns segundos...</div>
            </div>
          )}

          {/* REVISAO */}
          {etapa==="revisao" && dados && (
            <div>
              {/* Resumo */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
                {[
                  {l:"Viagens",   v:dados.viagens.length, c:T.blue},
                  {l:"Passageiros",v:totalPax,            c:T.purple},
                  {l:"Acomp.",    v:totalAcomp,           c:"#7c3aed"},
                  {l:"Data",      v:fmtDate(dados.viagens[0]?.data), c:T.green},
                ].map(s=>(
                  <div key={s.l} style={{ background:T.bgCard2, borderRadius:10, padding:"10px 8px", textAlign:"center", border:"1px solid "+T.border }}>
                    <div style={{ fontSize:18, fontWeight:700, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:10, color:T.textMuted }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:12, color:T.textSub, marginBottom:12 }}>Revise os dados extraidos. Campos editaveis antes de cadastrar.</div>

              <div style={{ maxHeight:380, overflowY:"auto", paddingRight:4 }}>
                {dados.viagens.map((v, vi) => (
                  <div key={vi} style={{ background:T.bgCard2, borderRadius:12, padding:14, marginBottom:10, border:"1px solid "+T.border }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div>
                        <span style={{ background:"#eff6ff", color:T.blue, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700, marginRight:8 }}>#{v.numeroViagem}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{fmtDate(v.data)} — {v.horaSaida}</span>
                      </div>
                      <span style={{ fontSize:11, color:T.textSub }}>{v.passageiros.length} pax</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10, fontSize:12 }}>
                      <div><span style={{ color:T.textMuted }}>Motorista: </span><b style={{ color:T.text }}>{v.motorista.nome}</b></div>
                      <div><span style={{ color:T.textMuted }}>CNH: </span><span style={{ color:T.text }}>{v.motorista.cnh}</span></div>
                      <div><span style={{ color:T.textMuted }}>Veiculo: </span><b style={{ color:T.text }}>{v.veiculo.placa} {v.veiculo.modelo}</b></div>
                    </div>
                    <div style={{ borderTop:"1px solid "+T.border, paddingTop:8 }}>
                      {v.passageiros.map((p, pi) => (
                        <div key={pi} style={{ display:"flex", gap:6, alignItems:"center", padding:"4px 0", borderBottom:pi<v.passageiros.length-1?"1px solid #f9fafb":"none", flexWrap:"wrap" }}>
                          <span style={{ fontSize:11, color:T.textMuted, minWidth:16 }}>{pi+1}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:T.text, flex:1 }}>{p.nome}</span>
                          <span style={{ fontSize:11, color:T.purple }}>{p.destino}</span>
                          <span style={{ fontSize:11, color:T.yellow }}>{p.horarioChegada}</span>
                          <span style={{ fontSize:10, background:p.tipoTrajeto==="ida_volta"?"#f0fdf4":p.tipoTrajeto==="ida"?"#eff6ff":"#fffbeb", color:p.tipoTrajeto==="ida_volta"?T.green:p.tipoTrajeto==="ida"?T.blue:T.yellow, borderRadius:6, padding:"1px 6px" }}>
                            {p.tipoTrajeto==="ida_volta"?"I/V":p.tipoTrajeto==="ida"?"Ida":"Volta"}
                          </span>
                          {(p.acompanhantes||[]).length>0 && <span style={{ fontSize:10, color:T.purple, background:"#f5f3ff", borderRadius:6, padding:"1px 6px" }}>+{p.acompanhantes.length} acomp.</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {erroMsg && <div style={{ marginTop:12, background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, padding:"10px 14px", fontSize:13, color:T.red }}>{erroMsg}</div>}

              <div style={{ display:"flex", gap:10, marginTop:16, justifyContent:"flex-end" }}>
                <button onClick={()=>setEtapa("upload")} style={{ padding:"9px 18px", background:T.bgCard2, color:T.textSub, border:"1px solid "+T.border, borderRadius:10, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                  Cancelar
                </button>
                <Btn onClick={cadastrarTudo} color={T.green}>
                  Cadastrar {dados.viagens.length} viagem(ns) no banco
                </Btn>
              </div>
            </div>
          )}

          {/* CONCLUIDO */}
          {etapa==="concluido" && resultado && (
            <div style={{ textAlign:"center", padding:"30px 20px" }}>
              <div style={{ fontSize:52, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:17, fontWeight:700, color:T.text, marginBottom:8 }}>Importacao concluida!</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, margin:"20px 0", maxWidth:400, marginLeft:"auto", marginRight:"auto" }}>
                {[
                  {l:"Viagens",    v:resultado.viagsCriadas, c:T.blue},
                  {l:"Pacientes",  v:resultado.pacsCriados,  c:T.purple},
                  {l:"Destinos",   v:resultado.destsCriados, c:T.green},
                  {l:"Motoristas", v:resultado.motsCriados,  c:T.yellow},
                  {l:"Veiculos",   v:resultado.veicsCriados, c:T.red},
                ].map(s=>(
                  <div key={s.l} style={{ background:T.bgCard2, borderRadius:10, padding:"10px 8px", textAlign:"center", border:"1px solid "+T.border }}>
                    <div style={{ fontSize:20, fontWeight:700, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:10, color:T.textMuted }}>{s.l} criados</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:12, color:T.textSub, marginBottom:20 }}>Todos os dados foram cadastrados no banco com sucesso.</div>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button onClick={()=>{setEtapa("upload");setDados(null);setResultado(null);}} style={{ padding:"9px 18px", background:T.bgCard2, color:T.textSub, border:"1px solid "+T.border, borderRadius:10, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                  Importar outro
                </button>
                <Btn onClick={onClose} color={T.blue}>Fechar</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
