import { useState } from 'react';
import { S, Btn, SecTitle } from './UI.jsx';
import { fmtDate, fmtCurrency, STATUS_CONFIG, TODAY } from './data.js';

export default function Relatorios({ viagens, db }) {
  const [periodo, setPeriodo] = useState("mes");
  const [mesRef, setMesRef] = useState(TODAY.substring(0,7)); // YYYY-MM

  const filtradas = viagens.filter(v => {
    if(periodo==="hoje") return v.data === TODAY;
    if(periodo==="mes") return v.data.startsWith(mesRef);
    return true; // geral
  });

  const concluidas = filtradas.filter(v => v.status === "concluida" || v.status === "em_andamento");
  const totalPax = filtradas.reduce((a,v) => a + v.passageiros.length, 0);
  const totalAssinados = filtradas.reduce((a,v) => a + v.passageiros.filter(p=>p.assinatura).length, 0);
  const totalAusentes = filtradas.reduce((a,v) => a + v.passageiros.filter(p=>p.status==="ausente").length, 0);
  const totalAbast = filtradas.filter(v=>v.abastecimento).reduce((a,v)=>a+(v.abastecimento?.total||0),0);
  const totalLitros = filtradas.filter(v=>v.abastecimento).reduce((a,v)=>a+(parseFloat(v.abastecimento?.litros)||0),0);
  const totalKm = filtradas.filter(v=>v.abastecimento).reduce((a,v)=>a+(v.abastecimento?.km||0),0);

  const porMotorista = {};
  filtradas.forEach(v => {
    const n = v.motorista.nome;
    if(!porMotorista[n]) porMotorista[n] = { viagens:0, pax:0, km:0, custo:0 };
    porMotorista[n].viagens++;
    porMotorista[n].pax += v.passageiros.length;
    porMotorista[n].km += v.abastecimento?.km || 0;
    porMotorista[n].custo += v.abastecimento?.total || 0;
  });

  const porVeiculo = {};
  filtradas.forEach(v => {
    const n = `${v.veiculo.placa} — ${v.veiculo.modelo}`;
    if(!porVeiculo[n]) porVeiculo[n] = { viagens:0, pax:0, litros:0, custo:0 };
    porVeiculo[n].viagens++;
    porVeiculo[n].pax += v.passageiros.length;
    porVeiculo[n].litros += parseFloat(v.abastecimento?.litros)||0;
    porVeiculo[n].custo += v.abastecimento?.total||0;
  });

  const porDestino = {};
  filtradas.forEach(v => v.passageiros.forEach(p => {
    const n = p.destino.nome;
    if(!porDestino[n]) porDestino[n] = { total:0, recolhidos:0, ausentes:0 };
    porDestino[n].total++;
    if(["recolhido","entregue"].includes(p.status)) porDestino[n].recolhidos++;
    if(p.status==="ausente") porDestino[n].ausentes++;
  }));

  const estatPax = Object.entries(
    filtradas.reduce((acc,v) => {
      v.passageiros.forEach(p => {
        const nome = p.paciente.nome;
        acc[nome] = (acc[nome]||0)+1;
      });
      return acc;
    }, {})
  ).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const cardStyle = (color) => ({ background:"#0c1a2e",borderRadius:14,padding:16,border:`1px solid ${color}33`,textAlign:"center",flex:1 });

  return (
    <div style={{ padding:20,maxWidth:800,margin:"0 auto" }}>
      {/* Filtros */}
      <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center" }}>
        <SecTitle>PERÍODO:</SecTitle>
        {[["hoje","Hoje"],["mes","Por Mês"],["geral","Geral"]].map(([k,l])=>(
          <button key={k} onClick={()=>setPeriodo(k)} style={{ background:periodo===k?"#1e3a5f":"#0c1a2e",color:periodo===k?"#38bdf8":"#64748b",border:`1px solid ${periodo===k?"#38bdf8":"#1e293b"}`,borderRadius:10,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
        ))}
        {periodo==="mes" && <input type="month" value={mesRef} onChange={e=>setMesRef(e.target.value)} style={{ ...S.input,width:160 }}/>}
      </div>

      {/* Cards de resumo */}
      <SecTitle>RESUMO GERAL</SecTitle>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:24 }}>
        <div style={cardStyle("#38bdf8")}><div style={{ fontSize:28,fontWeight:800,color:"#38bdf8" }}>{filtradas.length}</div><div style={{ fontSize:12,color:"#64748b" }}>Viagens</div></div>
        <div style={cardStyle("#a78bfa")}><div style={{ fontSize:28,fontWeight:800,color:"#a78bfa" }}>{totalPax}</div><div style={{ fontSize:12,color:"#64748b" }}>Passageiros</div></div>
        <div style={cardStyle("#34d399")}><div style={{ fontSize:28,fontWeight:800,color:"#34d399" }}>{totalAssinados}</div><div style={{ fontSize:12,color:"#64748b" }}>Com Assinatura</div></div>
        <div style={cardStyle("#f87171")}><div style={{ fontSize:28,fontWeight:800,color:"#f87171" }}>{totalAusentes}</div><div style={{ fontSize:12,color:"#64748b" }}>Ausências</div></div>
      </div>

      {/* Combustível */}
      <SecTitle>CONTROLE DE COMBUSTÍVEL</SecTitle>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
        <div style={cardStyle("#fbbf24")}><div style={{ fontSize:22,fontWeight:800,color:"#fbbf24" }}>{fmtCurrency(totalAbast)}</div><div style={{ fontSize:11,color:"#64748b" }}>Total Gasto</div></div>
        <div style={cardStyle("#fb923c")}><div style={{ fontSize:22,fontWeight:800,color:"#fb923c" }}>{totalLitros.toFixed(1)}L</div><div style={{ fontSize:11,color:"#64748b" }}>Litros Abastecidos</div></div>
        <div style={cardStyle("#38bdf8")}><div style={{ fontSize:22,fontWeight:800,color:"#38bdf8" }}>{totalKm} km</div><div style={{ fontSize:11,color:"#64748b" }}>KM Rodados</div></div>
      </div>

      {/* Viagens com abastecimento */}
      {filtradas.filter(v=>v.abastecimento).length > 0 && <>
        <SecTitle>ABASTECIMENTOS REGISTRADOS</SecTitle>
        {filtradas.filter(v=>v.abastecimento).map(v=>(
          <div key={v.id} style={{ ...S.card,marginBottom:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>Viagem #{v.id} — {fmtDate(v.data)}</div>
                <div style={{ fontSize:12,color:"#64748b" }}>{v.veiculo.placa} · {v.motorista.nome}</div>
                <div style={{ fontSize:12,color:"#64748b" }}>Posto: {v.abastecimento.posto} · NF: {v.abastecimento.nota}</div>
                <div style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>{v.abastecimento.combustivel} · {v.abastecimento.litros}L · R${Number(v.abastecimento.valorLitro).toFixed(2)}/L</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:18,fontWeight:700,color:"#34d399" }}>{fmtCurrency(v.abastecimento.total)}</div>
                {v.abastecimento.km>0 && <div style={{ fontSize:11,color:"#64748b" }}>{v.abastecimento.km} km rodados</div>}
              </div>
            </div>
          </div>
        ))}
      </>}

      {/* Por motorista */}
      {Object.keys(porMotorista).length > 0 && <>
        <SecTitle>PRODUTIVIDADE POR MOTORISTA</SecTitle>
        {Object.entries(porMotorista).map(([nome,d])=>(
          <div key={nome} style={{ ...S.card,marginBottom:10 }}>
            <div style={{ fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:10 }}>🧑‍✈️ {nome}</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,textAlign:"center" }}>
              <div><div style={{ fontSize:18,fontWeight:700,color:"#38bdf8" }}>{d.viagens}</div><div style={{ fontSize:10,color:"#64748b" }}>Viagens</div></div>
              <div><div style={{ fontSize:18,fontWeight:700,color:"#a78bfa" }}>{d.pax}</div><div style={{ fontSize:10,color:"#64748b" }}>Pacientes</div></div>
              <div><div style={{ fontSize:18,fontWeight:700,color:"#38bdf8" }}>{d.km} km</div><div style={{ fontSize:10,color:"#64748b" }}>Percurso</div></div>
              <div><div style={{ fontSize:18,fontWeight:700,color:"#fbbf24" }}>{fmtCurrency(d.custo)}</div><div style={{ fontSize:10,color:"#64748b" }}>Combustível</div></div>
            </div>
          </div>
        ))}
      </>}

      {/* Por destino */}
      {Object.keys(porDestino).length > 0 && <>
        <SecTitle>ATENDIMENTOS POR UNIDADE DE SAÚDE</SecTitle>
        {Object.entries(porDestino).sort((a,b)=>b[1].total-a[1].total).map(([nome,d])=>(
          <div key={nome} style={{ ...S.card,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:600,color:"#e2e8f0" }}>{nome}</div>
              <div style={{ marginTop:6,height:6,background:"#1e293b",borderRadius:4,overflow:"hidden" }}>
                <div style={{ width:`${Math.min((d.recolhidos/d.total)*100,100)}%`,height:"100%",background:"#34d399",borderRadius:4 }}/>
              </div>
            </div>
            <div style={{ display:"flex",gap:16,marginLeft:16 }}>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:18,fontWeight:700,color:"#e2e8f0" }}>{d.total}</div><div style={{ fontSize:10,color:"#64748b" }}>Total</div></div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:18,fontWeight:700,color:"#34d399" }}>{d.recolhidos}</div><div style={{ fontSize:10,color:"#64748b" }}>Concluído</div></div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:18,fontWeight:700,color:"#f87171" }}>{d.ausentes}</div><div style={{ fontSize:10,color:"#64748b" }}>Ausente</div></div>
            </div>
          </div>
        ))}
      </>}

      {/* Pacientes mais frequentes */}
      {estatPax.length > 0 && <>
        <SecTitle>PACIENTES MAIS FREQUENTES</SecTitle>
        {estatPax.map(([nome,qtd],i)=>(
          <div key={nome} style={{ ...S.card,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 18px",marginBottom:8 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ width:28,height:28,borderRadius:8,background:"#1e3a5f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#38bdf8" }}>{i+1}</div>
              <div style={{ fontSize:13,fontWeight:600,color:"#e2e8f0" }}>{nome}</div>
            </div>
            <div style={{ fontSize:18,fontWeight:700,color:"#a78bfa" }}>{qtd}x</div>
          </div>
        ))}
      </>}

      {/* Exportar */}
      <div style={{ marginTop:24,padding:16,background:"#0c1a2e",borderRadius:14,border:"1px solid #1e293b",textAlign:"center" }}>
        <div style={{ fontSize:13,color:"#64748b",marginBottom:10 }}>Exportar relatório para prestação de contas</div>
        <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
          <Btn small color="#3b82f6" onClick={()=>alert("Em breve: exportar PDF completo com assinaturas digitais")}>📄 Exportar PDF</Btn>
          <Btn small color="#10b981" onClick={()=>alert("Em breve: exportar planilha Excel para contabilidade")}>📊 Exportar Excel</Btn>
          <Btn small color="#a78bfa" onClick={()=>alert("Em breve: enviar por e-mail para a prefeitura")}>📧 Enviar por E-mail</Btn>
        </div>
      </div>
    </div>
  );
}
