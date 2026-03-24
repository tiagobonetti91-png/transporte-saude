import { useState } from 'react';
import { fmtDate, fmtCurrency, TODAY } from './data.js';

const T = {
  bg:"#f0f4f8", bgCard:"#ffffff", bgCard2:"#f8fafc", border:"#e5e7eb",
  text:"#111827", textSub:"#6b7280", textMuted:"#9ca3af",
  blue:"#1a56db", green:"#059669", purple:"#7c3aed", yellow:"#d97706", red:"#dc2626",
};

function Card({ children, style={} }) {
  return <div style={{ background:T.bgCard, borderRadius:14, padding:16, border:"1px solid "+T.border, boxShadow:"0 1px 4px rgba(0,0,0,0.05)", ...style }}>{children}</div>;
}

function StatBox({ label, value, color, sub }) {
  return (
    <div style={{ background:T.bgCard2, borderRadius:12, padding:"12px 8px", textAlign:"center", border:"1px solid "+T.border }}>
      <div style={{ fontSize:24, fontWeight:800, color }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:T.textMuted, marginBottom:2 }}>{sub}</div>}
      <div style={{ fontSize:11, color:T.textSub }}>{label}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:T.textSub, letterSpacing:2, textTransform:"uppercase", marginBottom:10, marginTop:20 }}>{children}</div>;
}

// ── Gerador de PDF do relatório ────────────────────────────────────────────────
function gerarPDFRelatorio({ filtradas, periodo, mesRef, totais, porMotorista, porVeiculo, porDestino, estatPax }) {
  const titulo = periodo==="hoje" ? "Relatório do Dia — "+fmtDate(TODAY)
    : periodo==="mes" ? "Relatório Mensal — "+mesRef
    : "Relatório Geral";

  const rowsMot = Object.entries(porMotorista).map(([nome,d],i) =>
    `<tr style="background:${i%2===0?"#f8fafc":"#fff"}">
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:600">${nome}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#1a56db;font-weight:700">${d.viagens}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#7c3aed;font-weight:700">${d.pax}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#059669;font-weight:700">${d.ausentes}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#d97706;font-weight:700">${d.km} km</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;color:#059669;font-weight:700">${fmtCurrency(d.custo)}</td>
    </tr>`
  ).join("");

  const rowsDest = Object.entries(porDestino).sort((a,b)=>b[1].total-a[1].total).map(([nome,d],i) =>
    `<tr style="background:${i%2===0?"#f8fafc":"#fff"}">
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:600">${nome}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700">${d.total}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#059669;font-weight:700">${d.concluidos}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:700">${d.ausentes}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280">${d.total>0?Math.round((d.concluidos/d.total)*100):0}%</td>
    </tr>`
  ).join("");

  const rowsAbast = filtradas.filter(v=>v.abastecimento?.total).map((v,i) =>
    `<tr style="background:${i%2===0?"#f8fafc":"#fff"}">
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">#${v.id} — ${fmtDate(v.data)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${v.motorista?.nome||""}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${v.veiculo?.placa||""}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${v.abastecimento.litros||""}L</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${v.abastecimento.combustivel||""}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${v.abastecimento.posto||"—"}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;color:#059669;font-weight:700">${fmtCurrency(v.abastecimento.total)}</td>
    </tr>`
  ).join("");

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
  <title>${titulo}</title>
  <style>
    @page{size:A4;margin:16mm 14mm;}
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,sans-serif;font-size:13px;color:#111827;background:#fff;}
    @media print{.no-print{display:none;}}
    table{width:100%;border-collapse:collapse;}
    th{background:#1a56db;color:#fff;padding:9px 10px;text-align:left;font-size:11px;}
  </style></head><body>
  <div class="no-print" style="background:#1a56db;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
    <span style="color:#fff;font-weight:700;font-size:15px">📊 ${titulo}</span>
    <button onclick="window.print()" style="background:#fff;color:#1a56db;border:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer">🖨️ Imprimir / Salvar PDF</button>
  </div>
  <div style="padding:0 4px">
    <!-- Cabeçalho -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #1a56db">
      <div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:2px;margin-bottom:2px">Secretaria Municipal de Saude</div>
        <div style="font-size:22px;font-weight:800;color:#1a56db">TransporteSaude</div>
        <div style="font-size:12px;color:#6b7280">Gerado em ${new Date().toLocaleString("pt-BR")}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:800;color:#111827">${titulo}</div>
      </div>
    </div>

    <!-- Resumo geral -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px">
      ${[
        {label:"Viagens",        value:totais.viagens,    color:"#1a56db"},
        {label:"Passageiros",    value:totais.pax,        color:"#7c3aed"},
        {label:"Ausencias",      value:totais.ausentes,   color:"#dc2626"},
        {label:"Com Assinatura", value:totais.assinados,  color:"#059669"},
      ].map(s=>`<div style="background:#f8fafc;border-radius:10px;padding:12px;text-align:center;border:1px solid #e5e7eb">
        <div style="font-size:26px;font-weight:900;color:${s.color}">${s.value}</div>
        <div style="font-size:10px;color:#9ca3af">${s.label}</div>
      </div>`).join("")}
    </div>

    <!-- Combustível -->
    ${totais.totalAbast>0?`
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px 16px;margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Controle de Combustivel</div>
      <div style="display:flex;gap:32px;flex-wrap:wrap">
        <span><b style="font-size:16px;color:#059669">${fmtCurrency(totais.totalAbast)}</b> <span style="color:#6b7280;font-size:12px">total gasto</span></span>
        <span><b style="font-size:16px;color:#d97706">${totais.totalLitros.toFixed(1)}L</b> <span style="color:#6b7280;font-size:12px">abastecidos</span></span>
        <span><b style="font-size:16px;color:#1a56db">${totais.totalKm} km</b> <span style="color:#6b7280;font-size:12px">rodados</span></span>
      </div>
    </div>`:""}

    <!-- Por motorista -->
    ${rowsMot?`
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Produtividade por Motorista</div>
      <table><thead><tr>
        <th>Motorista</th><th style="text-align:center">Viagens</th><th style="text-align:center">Pacientes</th><th style="text-align:center">Ausencias</th><th style="text-align:center">KM</th><th style="text-align:right">Combustivel</th>
      </tr></thead><tbody>${rowsMot}</tbody></table>
    </div>`:""}

    <!-- Por destino -->
    ${rowsDest?`
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Atendimentos por Unidade de Saude</div>
      <table><thead><tr>
        <th>Unidade</th><th style="text-align:center">Total</th><th style="text-align:center">Concluidos</th><th style="text-align:center">Ausentes</th><th style="text-align:center">Taxa</th>
      </tr></thead><tbody>${rowsDest}</tbody></table>
    </div>`:""}

    <!-- Abastecimentos -->
    ${rowsAbast?`
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Abastecimentos Registrados</div>
      <table><thead><tr>
        <th>Viagem</th><th>Motorista</th><th>Veiculo</th><th style="text-align:center">Litros</th><th style="text-align:center">Tipo</th><th>Posto</th><th style="text-align:right">Total</th>
      </tr></thead><tbody>${rowsAbast}</tbody></table>
    </div>`:""}

    <!-- Pacientes frequentes -->
    ${estatPax.length>0?`
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Pacientes Mais Frequentes</div>
      <table><thead><tr><th>#</th><th>Paciente</th><th style="text-align:center">Viagens</th></tr></thead>
      <tbody>${estatPax.map(([nome,qtd],i)=>`<tr style="background:${i%2===0?"#f8fafc":"#fff"}"><td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:600">${i+1}</td><td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${nome}</td><td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;color:#7c3aed">${qtd}x</td></tr>`).join("")}
      </tbody></table>
    </div>`:""}

    <div style="margin-top:16px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px">
      TransporteSaude · Secretaria Municipal de Saude · Documento gerado automaticamente
    </div>
  </div></body></html>`;

  const win = window.open("","_blank","width=900,height=700");
  win.document.write(html);
  win.document.close();
}

// ── Gerador de Excel (CSV) ─────────────────────────────────────────────────────
function exportarCSV(filtradas, periodo, mesRef) {
  const titulo = periodo==="hoje"?"Hoje":periodo==="mes"?mesRef:"Geral";
  let csv = "Viagem;Data;Motorista;Veiculo;Placa;Status;Passageiros;Ausentes;Assinados;Combustivel(L);Custo(R$)\n";
  filtradas.forEach(v => {
    const ausentes = v.passageiros.filter(p=>p.status==="ausente").length;
    const assinados = v.passageiros.filter(p=>p.assinatura).length;
    csv += `#${v.id};${fmtDate(v.data)};${v.motorista?.nome||""};${v.veiculo?.modelo||""};${v.veiculo?.placa||""};${v.status};${v.passageiros.length};${ausentes};${assinados};${v.abastecimento?.litros||0};${Number(v.abastecimento?.total||0).toFixed(2)}\n`;
  });
  const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-transporte-${titulo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Relatorios({ viagens, db }) {
  const [periodo, setPeriodo] = useState("mes");
  const [mesRef, setMesRef] = useState(TODAY.substring(0,7));

  const filtradas = viagens.filter(v => {
    if(periodo==="hoje") return v.data === TODAY;
    if(periodo==="mes") return v.data.startsWith(mesRef);
    return true;
  });

  // Totais
  const totalPax      = filtradas.reduce((a,v)=>a+v.passageiros.length,0);
  const totalAssinados= filtradas.reduce((a,v)=>a+v.passageiros.filter(p=>p.assinatura).length,0);
  const totalAusentes = filtradas.reduce((a,v)=>a+v.passageiros.filter(p=>p.status==="ausente").length,0);
  const totalAbast    = filtradas.filter(v=>v.abastecimento?.total).reduce((a,v)=>a+(v.abastecimento?.total||0),0);
  const totalLitros   = filtradas.filter(v=>v.abastecimento?.litros).reduce((a,v)=>a+(parseFloat(v.abastecimento?.litros)||0),0);
  const totalKm       = filtradas.filter(v=>v.abastecimento?.kmInicial&&v.abastecimento?.kmFinal).reduce((a,v)=>a+((v.abastecimento.kmFinal-v.abastecimento.kmInicial)||0),0);
  const totalAcomp    = filtradas.reduce((a,v)=>a+v.passageiros.reduce((b,p)=>b+(p.acompanhantes?.length||0),0),0);

  // Por motorista
  const porMotorista = {};
  filtradas.forEach(v=>{
    const n = v.motorista?.nome||"?";
    if(!porMotorista[n]) porMotorista[n]={viagens:0,pax:0,ausentes:0,km:0,custo:0};
    porMotorista[n].viagens++;
    porMotorista[n].pax+=v.passageiros.length;
    porMotorista[n].ausentes+=v.passageiros.filter(p=>p.status==="ausente").length;
    porMotorista[n].km+=(v.abastecimento?.kmFinal&&v.abastecimento?.kmInicial)?(v.abastecimento.kmFinal-v.abastecimento.kmInicial):0;
    porMotorista[n].custo+=v.abastecimento?.total||0;
  });

  // Por veiculo
  const porVeiculo = {};
  filtradas.forEach(v=>{
    const n = `${v.veiculo?.placa||"?"} — ${v.veiculo?.modelo||""}`;
    if(!porVeiculo[n]) porVeiculo[n]={viagens:0,pax:0,litros:0,custo:0,km:0};
    porVeiculo[n].viagens++;
    porVeiculo[n].pax+=v.passageiros.length;
    porVeiculo[n].litros+=parseFloat(v.abastecimento?.litros)||0;
    porVeiculo[n].custo+=v.abastecimento?.total||0;
    porVeiculo[n].km+=(v.abastecimento?.kmFinal&&v.abastecimento?.kmInicial)?(v.abastecimento.kmFinal-v.abastecimento.kmInicial):0;
  });

  // Por destino
  const porDestino = {};
  filtradas.forEach(v=>v.passageiros.forEach(p=>{
    const n = p.destino?.nome||"?";
    if(!porDestino[n]) porDestino[n]={total:0,concluidos:0,ausentes:0};
    porDestino[n].total++;
    if(["recolhido","entregue","pronto"].includes(p.status)) porDestino[n].concluidos++;
    if(p.status==="ausente") porDestino[n].ausentes++;
  }));

  // Pacientes frequentes
  const estatPax = Object.entries(
    filtradas.reduce((acc,v)=>{
      v.passageiros.forEach(p=>{ const n=p.paciente?.nome||"?"; acc[n]=(acc[n]||0)+1; });
      return acc;
    },{})
  ).sort((a,b)=>b[1]-a[1]).slice(0,8);

  const totais = { viagens:filtradas.length, pax:totalPax, assinados:totalAssinados, ausentes:totalAusentes, totalAbast, totalLitros, totalKm };

  const taxaAssinatura = totalPax>0?Math.round((totalAssinados/totalPax)*100):0;
  const taxaPresenca   = totalPax>0?Math.round(((totalPax-totalAusentes)/totalPax)*100):0;

  return (
    <div style={{ padding:20, maxWidth:860, margin:"0 auto", background:T.bg, minHeight:"100vh", fontFamily:"'DM Sans',sans-serif" }}>

      {/* Filtros */}
      <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ fontSize:12,fontWeight:700,color:T.textSub,textTransform:"uppercase",letterSpacing:1 }}>Periodo:</div>
        {[["hoje","Hoje"],["mes","Por Mes"],["geral","Geral"]].map(([k,l])=>(
          <button key={k} onClick={()=>setPeriodo(k)}
            style={{ background:periodo===k?T.blue:"#fff",color:periodo===k?"#fff":T.textSub,border:"1px solid "+(periodo===k?T.blue:T.border),borderRadius:10,padding:"7px 18px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
            {l}
          </button>
        ))}
        {periodo==="mes"&&(
          <input type="month" value={mesRef} onChange={e=>setMesRef(e.target.value)}
            style={{ padding:"7px 12px",borderRadius:10,border:"1px solid "+T.border,fontSize:13,color:T.text,background:"#fff",fontFamily:"inherit" }}/>
        )}
        <div style={{ marginLeft:"auto",display:"flex",gap:8,flexWrap:"wrap" }}>
          <button onClick={()=>gerarPDFRelatorio({filtradas,periodo,mesRef,totais,porMotorista,porVeiculo,porDestino,estatPax})}
            style={{ padding:"8px 16px",background:T.blue,color:"#fff",border:"none",borderRadius:10,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
            📄 Exportar PDF
          </button>
          <button onClick={()=>exportarCSV(filtradas,periodo,mesRef)}
            style={{ padding:"8px 16px",background:T.green,color:"#fff",border:"none",borderRadius:10,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
            📊 Exportar Excel
          </button>
        </div>
      </div>

      {filtradas.length===0&&(
        <Card style={{ textAlign:"center",padding:40 }}>
          <div style={{ fontSize:32,marginBottom:8 }}>📊</div>
          <div style={{ color:T.textMuted }}>Nenhuma viagem no periodo selecionado</div>
        </Card>
      )}

      {filtradas.length>0&&<>
        {/* Resumo */}
        <SectionTitle>Resumo Geral</SectionTitle>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:8 }}>
          <StatBox label="Viagens"        value={filtradas.length}  color={T.blue}/>
          <StatBox label="Passageiros"    value={totalPax}          color={T.purple}/>
          <StatBox label="Acompanhantes"  value={totalAcomp}        color="#7c3aed"/>
          <StatBox label="Ausencias"      value={totalAusentes}     color={T.red}/>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20 }}>
          <Card style={{ padding:"12px 16px" }}>
            <div style={{ fontSize:11,color:T.textSub,marginBottom:6 }}>Taxa de Presenca</div>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ flex:1,height:10,background:"#f0f4f8",borderRadius:6,overflow:"hidden" }}>
                <div style={{ width:taxaPresenca+"%",height:"100%",background:T.green,borderRadius:6,transition:"width .5s" }}/>
              </div>
              <span style={{ fontSize:16,fontWeight:800,color:T.green }}>{taxaPresenca}%</span>
            </div>
          </Card>
          <Card style={{ padding:"12px 16px" }}>
            <div style={{ fontSize:11,color:T.textSub,marginBottom:6 }}>Taxa de Assinatura</div>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ flex:1,height:10,background:"#f0f4f8",borderRadius:6,overflow:"hidden" }}>
                <div style={{ width:taxaAssinatura+"%",height:"100%",background:T.blue,borderRadius:6,transition:"width .5s" }}/>
              </div>
              <span style={{ fontSize:16,fontWeight:800,color:T.blue }}>{taxaAssinatura}%</span>
            </div>
          </Card>
        </div>

        {/* Combustivel */}
        {totalAbast>0&&<>
          <SectionTitle>Controle de Combustivel</SectionTitle>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:8 }}>
            <StatBox label="Total Gasto"       value={fmtCurrency(totalAbast)}        color={T.green}/>
            <StatBox label="Litros"            value={totalLitros.toFixed(1)+"L"}     color={T.yellow}/>
            <StatBox label="KM Rodados"        value={totalKm+" km"}                  color={T.blue}/>
          </div>
          {totalKm>0&&totalLitros>0&&(
            <Card style={{ padding:"12px 16px",marginBottom:8 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:12,color:T.textSub }}>Media de consumo da frota</span>
                <span style={{ fontSize:18,fontWeight:800,color:T.purple }}>{(totalKm/totalLitros).toFixed(1)} km/L</span>
              </div>
            </Card>
          )}
          {/* Abastecimentos detalhados */}
          <div style={{ marginBottom:20 }}>
            {filtradas.filter(v=>v.abastecimento?.total).map(v=>(
              <Card key={v.id} style={{ marginBottom:8,padding:"12px 14px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:700,color:T.text }}>Viagem #{v.id} — {fmtDate(v.data)}</div>
                    <div style={{ fontSize:12,color:T.textSub }}>{v.veiculo?.placa} · {v.motorista?.nome}</div>
                    {v.abastecimento.posto&&<div style={{ fontSize:11,color:T.textSub }}>Posto: {v.abastecimento.posto}</div>}
                    <div style={{ fontSize:11,color:T.textMuted }}>{v.abastecimento.combustivel} · {v.abastecimento.litros}L · R$ {Number(v.abastecimento.valorLitro||0).toFixed(2)}/L</div>
                    {v.abastecimento.kmInicial&&v.abastecimento.kmFinal&&(
                      <div style={{ fontSize:11,color:T.textSub }}>KM: {v.abastecimento.kmInicial} → {v.abastecimento.kmFinal} ({v.abastecimento.kmFinal-v.abastecimento.kmInicial} km)</div>
                    )}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18,fontWeight:800,color:T.green }}>{fmtCurrency(v.abastecimento.total)}</div>
                    {v.abastecimento.nota&&<div style={{ fontSize:10,color:T.textMuted }}>NF: {v.abastecimento.nota}</div>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>}

        {/* Por motorista */}
        {Object.keys(porMotorista).length>0&&<>
          <SectionTitle>Produtividade por Motorista</SectionTitle>
          {Object.entries(porMotorista).sort((a,b)=>b[1].pax-a[1].pax).map(([nome,d])=>(
            <Card key={nome} style={{ marginBottom:10 }}>
              <div style={{ fontSize:14,fontWeight:700,color:T.text,marginBottom:10 }}>🧑‍✈️ {nome}</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,textAlign:"center" }}>
                <div><div style={{ fontSize:20,fontWeight:800,color:T.blue }}>{d.viagens}</div><div style={{ fontSize:10,color:T.textMuted }}>Viagens</div></div>
                <div><div style={{ fontSize:20,fontWeight:800,color:T.purple }}>{d.pax}</div><div style={{ fontSize:10,color:T.textMuted }}>Pacientes</div></div>
                <div><div style={{ fontSize:20,fontWeight:800,color:T.red }}>{d.ausentes}</div><div style={{ fontSize:10,color:T.textMuted }}>Ausencias</div></div>
                <div><div style={{ fontSize:20,fontWeight:800,color:T.yellow }}>{fmtCurrency(d.custo)}</div><div style={{ fontSize:10,color:T.textMuted }}>Combustivel</div></div>
              </div>
            </Card>
          ))}
        </>}

        {/* Por veiculo */}
        {Object.keys(porVeiculo).length>0&&<>
          <SectionTitle>Desempenho por Veiculo</SectionTitle>
          {Object.entries(porVeiculo).sort((a,b)=>b[1].viagens-a[1].viagens).map(([nome,d])=>(
            <Card key={nome} style={{ marginBottom:10 }}>
              <div style={{ fontSize:14,fontWeight:700,color:T.text,marginBottom:10 }}>🚐 {nome}</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,textAlign:"center" }}>
                <div><div style={{ fontSize:20,fontWeight:800,color:T.blue }}>{d.viagens}</div><div style={{ fontSize:10,color:T.textMuted }}>Viagens</div></div>
                <div><div style={{ fontSize:20,fontWeight:800,color:T.purple }}>{d.pax}</div><div style={{ fontSize:10,color:T.textMuted }}>Pacientes</div></div>
                <div><div style={{ fontSize:20,fontWeight:800,color:T.yellow }}>{d.litros.toFixed(1)}L</div><div style={{ fontSize:10,color:T.textMuted }}>Litros</div></div>
                <div><div style={{ fontSize:20,fontWeight:800,color:T.green }}>{fmtCurrency(d.custo)}</div><div style={{ fontSize:10,color:T.textMuted }}>Combustivel</div></div>
              </div>
              {d.km>0&&d.litros>0&&(
                <div style={{ marginTop:10,padding:"6px 10px",background:"#f8fafc",borderRadius:8,fontSize:12,color:T.textSub,display:"flex",justifyContent:"space-between" }}>
                  <span>Consumo medio</span>
                  <span style={{ fontWeight:700,color:T.purple }}>{(d.km/d.litros).toFixed(1)} km/L</span>
                </div>
              )}
            </Card>
          ))}
        </>}

        {/* Por destino */}
        {Object.keys(porDestino).length>0&&<>
          <SectionTitle>Atendimentos por Unidade de Saude</SectionTitle>
          {Object.entries(porDestino).sort((a,b)=>b[1].total-a[1].total).map(([nome,d])=>{
            const taxa = d.total>0?Math.round((d.concluidos/d.total)*100):0;
            return (
              <Card key={nome} style={{ marginBottom:8,padding:"12px 14px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                  <div style={{ fontSize:13,fontWeight:600,color:T.text,flex:1 }}>{nome}</div>
                  <div style={{ display:"flex",gap:16,flexShrink:0 }}>
                    <div style={{ textAlign:"center" }}><div style={{ fontSize:16,fontWeight:800,color:T.text }}>{d.total}</div><div style={{ fontSize:10,color:T.textMuted }}>Total</div></div>
                    <div style={{ textAlign:"center" }}><div style={{ fontSize:16,fontWeight:800,color:T.green }}>{d.concluidos}</div><div style={{ fontSize:10,color:T.textMuted }}>Concluidos</div></div>
                    <div style={{ textAlign:"center" }}><div style={{ fontSize:16,fontWeight:800,color:T.red }}>{d.ausentes}</div><div style={{ fontSize:10,color:T.textMuted }}>Ausentes</div></div>
                  </div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ flex:1,height:8,background:"#f0f4f8",borderRadius:4,overflow:"hidden" }}>
                    <div style={{ width:taxa+"%",height:"100%",background:T.green,borderRadius:4 }}/>
                  </div>
                  <span style={{ fontSize:12,fontWeight:700,color:T.green,width:36,textAlign:"right" }}>{taxa}%</span>
                </div>
              </Card>
            );
          })}
        </>}

        {/* Pacientes frequentes */}
        {estatPax.length>0&&<>
          <SectionTitle>Pacientes Mais Frequentes</SectionTitle>
          <Card>
            {estatPax.map(([nome,qtd],i)=>(
              <div key={nome} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 4px",borderBottom:i<estatPax.length-1?"1px solid "+T.border:"none" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:28,height:28,borderRadius:8,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:T.blue }}>{i+1}</div>
                  <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{nome}</div>
                </div>
                <div style={{ background:"#f5f3ff",border:"1px solid #c4b5fd",borderRadius:20,padding:"3px 14px",fontSize:13,fontWeight:700,color:T.purple }}>{qtd}x</div>
              </div>
            ))}
          </Card>
        </>}
      </>}
    </div>
  );
}
