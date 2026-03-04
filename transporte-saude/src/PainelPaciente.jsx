import { useState } from 'react';
import { S, Btn, SecTitle, StatusBadge } from './UI.jsx';
import { STATUS_CONFIG, fmtDate, TODAY } from './data.js';

export default function PainelPaciente({ viagens, pacientes, onBack }) {
  const [cpf, setCpf] = useState("");
  const [cpfBusca, setCpfBusca] = useState("");
  const [nomeBusca, setNomeBusca] = useState("");
  const [modoLogin, setModoLogin] = useState("cpf"); // cpf | nome

  function buscar() {
    if(modoLogin==="cpf") setCpfBusca(cpf.replace(/\D/g,""));
    else setCpfBusca("nome:"+nomeBusca.toLowerCase().trim());
  }

  // Encontrar passageiro
  let pacienteEncontrado = null;
  let minhasViagens = [];

  if(cpfBusca) {
    if(cpfBusca.startsWith("nome:")) {
      const termo = cpfBusca.replace("nome:","");
      pacienteEncontrado = pacientes.find(p => p.nome.toLowerCase().includes(termo));
    } else {
      pacienteEncontrado = pacientes.find(p => p.cpf.replace(/\D/g,"") === cpfBusca);
    }
    if(pacienteEncontrado) {
      minhasViagens = viagens
        .map(v => ({ ...v, meuPax: v.passageiros.find(p => p.paciente.id === pacienteEncontrado.id) }))
        .filter(v => v.meuPax)
        .sort((a,b) => b.data.localeCompare(a.data));
    }
  }

  const proxima = minhasViagens.find(v => v.data >= TODAY && v.status !== "cancelada");
  const historico = minhasViagens.filter(v => v.data < TODAY || v.status === "concluida");

  const statusDescricao = {
    indefinido: "Aguardando confirmação de embarque",
    embarcado:  "Você foi embarcado no veículo ✅",
    entregue:   "Você foi entregue no destino ✅",
    pronto:     "Você está pronto para o retorno",
    recolhido:  "Você foi recolhido — viagem concluída ✅",
    ausente:    "Você foi marcado como ausente",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#090e1a", color:"#e2e8f0", fontFamily:"'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f2040,#0a1628)", padding:"18px 20px", borderBottom:"1px solid #1e3a5f" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <button onClick={onBack} style={{ background:"#1e3a5f", border:"none", color:"#38bdf8", borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← Voltar</button>
          <div>
            <div style={{ fontSize:10, color:"#64748b", letterSpacing:2, textTransform:"uppercase" }}>Secretaria de Saúde</div>
            <div style={{ fontSize:17, fontWeight:700, color:"#fff" }}>Acompanhamento do Paciente</div>
          </div>
        </div>
        <div style={{ fontSize:13, color:"#64748b" }}>Consulte suas viagens e status de transporte</div>
      </div>

      <div style={{ padding:20, maxWidth:500, margin:"0 auto" }}>
        {/* Login do paciente */}
        {!cpfBusca && (
          <div style={{ ...S.card, background:"#0f1e36", border:"1px solid #1e3a5f" }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>🔍 Identificar-se</div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>Digite seu CPF ou nome para consultar suas viagens</div>

            <div style={{ display:"flex", background:"#070f1f", borderRadius:10, padding:4, marginBottom:16, border:"1px solid #1e3a5f" }}>
              {[["cpf","Por CPF"],["nome","Por Nome"]].map(([k,l]) => (
                <button key={k} onClick={()=>setModoLogin(k)} style={{ flex:1, padding:"8px", background:modoLogin===k?"#1e3a5f":"none", border:"none", borderRadius:8, color:modoLogin===k?"#fff":"#64748b", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
              ))}
            </div>

            {modoLogin==="cpf" ? (
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>CPF</label>
                <input value={cpf} onChange={e=>setCpf(e.target.value)} placeholder="000.000.000-00" style={S.input} onKeyDown={e=>e.key==="Enter"&&buscar()}/>
              </div>
            ) : (
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>Nome Completo</label>
                <input value={nomeBusca} onChange={e=>setNomeBusca(e.target.value)} placeholder="Digite seu nome..." style={S.input} onKeyDown={e=>e.key==="Enter"&&buscar()}/>
              </div>
            )}
            <Btn full onClick={buscar} color="#3b82f6">Consultar Minhas Viagens</Btn>
          </div>
        )}

        {/* Resultado */}
        {cpfBusca && !pacienteEncontrado && (
          <div style={{ ...S.card, textAlign:"center", padding:32 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>❌</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#f87171", marginBottom:8 }}>Paciente não encontrado</div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>Verifique seus dados ou entre em contato com a Secretaria de Saúde.</div>
            <Btn onClick={()=>{setCpfBusca("");setCpf("");setNomeBusca("");}} color="#475569">Tentar novamente</Btn>
          </div>
        )}

        {cpfBusca && pacienteEncontrado && (
          <>
            {/* Card do paciente */}
            <div style={{ ...S.card, background:"#0f1e36", border:"1px solid #1e3a5f", marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{pacienteEncontrado.nome}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>CPF: {pacienteEncontrado.cpf}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{pacienteEncontrado.telefone}</div>
                </div>
                <div style={{ background:"#052e1c", border:"1px solid #34d39944", borderRadius:10, padding:"6px 12px", fontSize:12, color:"#34d399", fontWeight:600 }}>
                  {minhasViagens.length} viagem(ns)
                </div>
              </div>
              <button onClick={()=>{setCpfBusca("");setCpf("");setNomeBusca("");}} style={{ marginTop:12, background:"none", border:"1px solid #1e3a5f", color:"#64748b", borderRadius:8, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Sair</button>
            </div>

            {/* Próxima viagem */}
            {proxima && (
              <>
                <SecTitle>PRÓXIMA VIAGEM</SecTitle>
                <div style={{ ...S.card, background:"#0f1e36", border:`1px solid ${STATUS_CONFIG[proxima.meuPax.status].color}44`, marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:11, color:"#38bdf8", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>VIAGEM #{proxima.id}</div>
                      <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>📅 {fmtDate(proxima.data)}</div>
                      <div style={{ fontSize:13, color:"#94a3b8" }}>Saída às {proxima.horarioSaida}</div>
                    </div>
                    <StatusBadge status={proxima.meuPax.status}/>
                  </div>

                  {/* Status visual */}
                  <div style={{ background:"#0a1628", borderRadius:12, padding:14, marginBottom:12 }}>
                    <div style={{ fontSize:12, color:"#64748b", marginBottom:6 }}>SEU STATUS ATUAL</div>
                    <div style={{ fontSize:14, fontWeight:600, color:STATUS_CONFIG[proxima.meuPax.status].color }}>
                      {statusDescricao[proxima.meuPax.status]}
                    </div>
                    {/* Barra de progresso */}
                    <div style={{ display:"flex", gap:4, marginTop:12 }}>
                      {["indefinido","embarcado","entregue","pronto","recolhido"].map((s,i)=>{
                        const ordem = ["indefinido","embarcado","entregue","pronto","recolhido"];
                        const atual = ordem.indexOf(proxima.meuPax.status);
                        const ativo = i <= atual && proxima.meuPax.status !== "ausente";
                        return (
                          <div key={s} style={{ flex:1 }}>
                            <div style={{ height:6, borderRadius:3, background:ativo?STATUS_CONFIG[s].color:"#1e293b", transition:"background .3s" }}/>
                            <div style={{ fontSize:9, color:ativo?STATUS_CONFIG[s].color:"#475569", marginTop:3, textAlign:"center" }}>{STATUS_CONFIG[s].label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ background:"#0a1628", borderRadius:10, padding:"10px 14px" }}>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>SEU DESTINO</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#c4b5fd" }}>{proxima.meuPax.destino.nome}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{proxima.meuPax.destino.especialidade} · {proxima.meuPax.destino.cidade}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#fbbf24", marginTop:6 }}>Horário de chegada: {proxima.meuPax.horarioChegada}</div>
                  </div>

                  {proxima.meuPax.status === "ausente" && (
                    <div style={{ background:"#2d0000", border:"1px solid #f8717144", borderRadius:10, padding:"10px 14px", marginTop:10, fontSize:12, color:"#f87171" }}>
                      ⚠️ Você foi marcado como ausente nesta viagem. Entre em contato com a Secretaria de Saúde: (67) 3300-0000
                    </div>
                  )}
                </div>
              </>
            )}

            {!proxima && (
              <div style={{ ...S.card, textAlign:"center", padding:24 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>📅</div>
                <div style={{ fontSize:14, color:"#64748b" }}>Nenhuma viagem agendada para os próximos dias.</div>
              </div>
            )}

            {/* Histórico */}
            {historico.length > 0 && <>
              <SecTitle>HISTÓRICO DE VIAGENS</SecTitle>
              {historico.map(v => (
                <div key={v.id} style={{ ...S.card, padding:"12px 16px", marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{fmtDate(v.data)}</div>
                      <div style={{ fontSize:11, color:"#a78bfa" }}>{v.meuPax.destino.nome}</div>
                      <div style={{ fontSize:11, color:"#64748b" }}>{v.meuPax.destino.especialidade}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <StatusBadge status={v.meuPax.status}/>
                      {v.meuPax.assinatura && <div style={{ fontSize:10, color:"#34d399", marginTop:4 }}>✅ Assinado</div>}
                    </div>
                  </div>
                </div>
              ))}
            </>}
          </>
        )}

        {/* Info de contato */}
        <div style={{ marginTop:24, padding:16, background:"#0c1a2e", borderRadius:14, border:"1px solid #1e293b", textAlign:"center" }}>
          <div style={{ fontSize:12, color:"#64748b" }}>Dúvidas? Entre em contato:</div>
          <div style={{ fontSize:14, fontWeight:600, color:"#38bdf8", marginTop:4 }}>Secretaria de Saúde</div>
          <div style={{ fontSize:13, color:"#e2e8f0" }}>(67) 3300-0000</div>
          <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>Seg–Sex, 7h às 17h</div>
        </div>
      </div>
    </div>
  );
}
