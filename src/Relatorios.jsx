import { useState } from 'react';
import { fmtDate, fmtCurrency, TODAY } from './data.js';

const T = {
  bg:"#f0f4f8", bgCard:"#ffffff", bgCard2:"#f8fafc", border:"#e5e7eb",
  text:"#111827", textSub:"#6b7280", textMuted:"#9ca3af",
  blue:"#1a56db", green:"#059669", purple:"#7c3aed", yellow:"#d97706", red:"#dc2626",
};

function Card({ children, style={} }) {
  return <div style={{ background:T.bgCard,borderRadius:14,padding:16,border:"1px solid "+T.border,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",...style }}>{children}</div>;
}
function FiltroBar({ periodo, setPeriodo, mesRef, setMesRef, onPDF, onCSV }) {
  return (
    <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
      {[["hoje","Hoje"],["mes","Mes"],["geral","Geral"]].map(([k,l])=>(
        <button key={k} onClick={()=>setPeriodo(k)}
          style={{ background:periodo===k?T.blue:"#fff",color:periodo===k?"#fff":T.textSub,border:"1px solid "+(periodo===k?T.blue:T.border),borderRadius:10,padding:"7px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
          {l}
        </button>
      ))}
      {periodo==="mes"&&<input type="month" value={mesRef} onChange={e=>setMesRef(e.target.value)} style={{ padding:"7px 12px",borderRadius:10,border:"1px solid "+T.border,fontSize:13,color:T.text,background:"#fff",fontFamily:"inherit" }}/>}
      <div style={{ marginLeft:"auto",display:"flex",gap:8 }}>
        {onPDF&&<button onClick={onPDF} style={{ padding:"7px 14px",background:T.blue,color:"#fff",border:"none",borderRadius:10,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>PDF</button>}
        {onCSV&&<button onClick={onCSV} style={{ padding:"7px 14px",background:T.green,color:"#fff",border:"none",borderRadius:10,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Excel</button>}
      </div>
    </div>
  );
}

function abrirPDF(titulo, corpo) {
  const html = "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'/><title>"+titulo+"</title><style>@page{size:A4;margin:16mm 14mm;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:13px;color:#111827;background:#fff;}@media print{.np{display:none;}}table{width:100%;border-collapse:collapse;}th{background:#1a56db;color:#fff;padding:9px 10px;text-align:left;font-size:11px;}td{padding:8px 10px;border-bottom:1px solid #e5e7eb;}tr:nth-child(even){background:#f8fafc;}</style></head><body>"
    +"<div class='np' style='background:#1a56db;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px'><span style='color:#fff;font-weight:700;font-size:15px'>"+titulo+"</span><button onclick='window.print()' style='background:#fff;color:#1a56db;border:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer'>Imprimir / Salvar PDF</button></div>"
    +"<div style='padding:0 4px'><div style='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #1a56db'><div><div style='font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:2px;margin-bottom:2px'>Secretaria Municipal de Saude</div><div style='font-size:22px;font-weight:800;color:#1a56db'>TransporteSaude</div><div style='font-size:12px;color:#6b7280'>Gerado em "+new Date().toLocaleString("pt-BR")+"</div></div><div style='font-size:18px;font-weight:800;color:#111827;text-align:right'>"+titulo+"</div></div>"
    +corpo
    +"<div style='margin-top:20px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px'>TransporteSaude - Secretaria Municipal de Saude</div></div></body></html>";
  const w = window.open("","_blank","width=900,height=700");
  w.document.write(html); w.document.close();
}

function exportCSV(nome, cab, linhas) {
  const csv = cab+"\n"+linhas.join("\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=nome+".csv"; a.click();
  URL.revokeObjectURL(url);
}

function useFiltro(viagens) {
  const [periodo,setPeriodo]=useState("mes");
  const [mesRef,setMesRef]=useState(TODAY.substring(0,7));
  const filtradas=viagens.filter(v=>{
    if(periodo==="hoje") return v.data===TODAY;
    if(periodo==="mes") return v.data.startsWith(mesRef);
    return true;
  });
  return {periodo,setPeriodo,mesRef,setMesRef,filtradas,labelPeriodo:periodo==="hoje"?"Hoje":periodo==="mes"?mesRef:"Geral"};
}

// ── 1. POR VIAGEM ─────────────────────────────────────────────────────────────
function RelViagem({ viagens }) {
  const {periodo,setPeriodo,mesRef,setMesRef,filtradas}=useFiltro(viagens);

  function gerarPDF(v) {
    const fmtTraj = t => (!t||t==="ida_volta")?"Ida e Volta":t==="ida"?"Somente Ida":"Somente Volta";
    const fmtStatus = s => ({ausente:"Faltou",recolhido:"Recolhido",entregue:"Entregue",pronto:"Pronto",embarcado:"Embarcado"}[s]||"Indefinido");
    const rows = v.passageiros.map((p,i)=>
      "<tr><td>"+(i+1)+"</td><td><b>"+(p.paciente?.nome||"")+"</b>"+((p.acompanhantes||[]).length>0?"<br/><small>+"+p.acompanhantes.length+" acomp.</small>":"")+"</td><td style='color:#7c3aed'>"+(p.destino?.nome||"")+"</td><td>"+(p.horarioChegada||"")+"</td><td>"+fmtTraj(p.tipoTrajeto)+"</td><td style='color:"+(p.status==="ausente"?"#dc2626":"#059669")+"'>"+fmtStatus(p.status)+"</td><td style='text-align:center'>"+(p.assinatura?"<img src='"+p.assinatura+"' style='height:28px;max-width:100px;background:#fff;border-radius:4px;padding:2px;border:1px solid #e5e7eb'/>":"<span style='color:#9ca3af'>-</span>")+"</td></tr>"
    ).join("");
    const infoBoxes = [
      {l:"Data",v:fmtDate(v.data)},{l:"Saida",v:v.horarioSaida},{l:"Status",v:v.status},
      {l:"Motorista",v:v.motorista?.nome||""},{l:"Veiculo",v:(v.veiculo?.modelo||"")+" - "+(v.veiculo?.placa||"")},{l:"Passageiros",v:v.passageiros.length+"/"+v.veiculo?.capacidade},
    ].map(x=>"<div style='background:#f8fafc;border-radius:10px;padding:10px 12px;border:1px solid #e5e7eb'><div style='font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px'>"+x.l+"</div><div style='font-size:14px;font-weight:700'>"+x.v+"</div></div>").join("");
    const abastHtml = v.abastecimento?.total
      ? "<div style='background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:10px 14px;margin-bottom:16px'><b style='color:#059669'>Abastecimento:</b> "+(v.abastecimento.litros||"")+"L de "+(v.abastecimento.combustivel||"")+" - R$ "+Number(v.abastecimento.valorLitro||0).toFixed(2)+"/L - <b>"+fmtCurrency(v.abastecimento.total)+"</b>"+(v.abastecimento.posto?" - Posto: "+v.abastecimento.posto:"")+(v.abastecimento.kmInicial&&v.abastecimento.kmFinal?" - KM: "+v.abastecimento.kmInicial+" > "+v.abastecimento.kmFinal+" ("+(v.abastecimento.kmFinal-v.abastecimento.kmInicial)+" km)":"")+"</div>"
      : "";
    const corpo = "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px'>"+infoBoxes+"</div>"+abastHtml
      +"<table><thead><tr><th>#</th><th>Paciente</th><th>Destino</th><th>Horario</th><th>Trajeto</th><th>Status</th><th style='text-align:center'>Assinatura</th></tr></thead><tbody>"+rows+"</tbody></table>"
      +"<div style='margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:24px'><div><div style='border-top:1.5px solid #111;padding-top:8px;font-size:12px;color:#6b7280;text-align:center'>Assinatura do Motorista<br/><b>"+(v.motorista?.nome||"")+"</b></div></div><div><div style='border-top:1.5px solid #111;padding-top:8px;font-size:12px;color:#6b7280;text-align:center'>Responsavel pela Secretaria</div></div></div>";
    abrirPDF("Relatorio Viagem #"+v.id+" - "+fmtDate(v.data), corpo);
  }

  return (
    <div>
      <FiltroBar periodo={periodo} setPeriodo={setPeriodo} mesRef={mesRef} setMesRef={setMesRef}/>
      {filtradas.length===0&&<Card style={{textAlign:"center",padding:40,color:T.textMuted}}>Nenhuma viagem no periodo</Card>}
      {filtradas.map(v=>{
        const ausentes=v.passageiros.filter(p=>p.status==="ausente").length;
        const assinados=v.passageiros.filter(p=>p.assinatura).length;
        const totalVagas=v.passageiros.reduce((a,p)=>a+1+(p.acompanhantes?.length||0),0);
        return (
          <Card key={v.id} style={{ marginBottom:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
              <div>
                <div style={{ fontSize:11,color:T.blue,fontWeight:700,letterSpacing:2,textTransform:"uppercase" }}>VIAGEM #{v.id}</div>
                <div style={{ fontSize:16,fontWeight:800,color:T.text }}>{fmtDate(v.data)} - {v.horarioSaida}</div>
                <div style={{ fontSize:12,color:T.textSub }}>{v.motorista?.nome} - {v.veiculo?.modelo} ({v.veiculo?.placa})</div>
              </div>
              <button onClick={()=>gerarPDF(v)} style={{ padding:"8px 14px",background:"#f5f3ff",color:T.purple,border:"1px solid #c4b5fd",borderRadius:10,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>PDF</button>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,textAlign:"center" }}>
              {[
                {l:"Vagas",v:totalVagas+"/"+v.veiculo?.capacidade,c:T.blue},
                {l:"Assinados",v:assinados,c:T.green},
                {l:"Ausentes",v:ausentes,c:T.red},
                {l:"Combustivel",v:v.abastecimento?.total?fmtCurrency(v.abastecimento.total):"--",c:T.yellow},
              ].map(s=>(
                <div key={s.l} style={{ background:T.bgCard2,borderRadius:8,padding:"8px 4px",border:"1px solid "+T.border }}>
                  <div style={{ fontSize:15,fontWeight:800,color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:9,color:T.textMuted }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── 2. POR MOTORISTA ──────────────────────────────────────────────────────────
function RelMotorista({ viagens }) {
  const {periodo,setPeriodo,mesRef,setMesRef,filtradas,labelPeriodo}=useFiltro(viagens);
  const por={};
  filtradas.forEach(v=>{
    const n=v.motorista?.nome||"?";
    if(!por[n]) por[n]={viagens:0,pax:0,ausentes:0,assinados:0,acomp:0,km:0,custo:0,litros:0};
    por[n].viagens++; por[n].pax+=v.passageiros.length;
    por[n].ausentes+=v.passageiros.filter(p=>p.status==="ausente").length;
    por[n].assinados+=v.passageiros.filter(p=>p.assinatura).length;
    por[n].acomp+=v.passageiros.reduce((a,p)=>a+(p.acompanhantes?.length||0),0);
    por[n].km+=(v.abastecimento?.kmFinal&&v.abastecimento?.kmInicial)?(v.abastecimento.kmFinal-v.abastecimento.kmInicial):0;
    por[n].custo+=v.abastecimento?.total||0;
    por[n].litros+=parseFloat(v.abastecimento?.litros)||0;
  });

  function pdf() {
    const rows=Object.entries(por).map(([n,d])=>"<tr><td><b>"+n+"</b></td><td style='text-align:center'>"+d.viagens+"</td><td style='text-align:center'>"+d.pax+"</td><td style='text-align:center'>"+d.acomp+"</td><td style='text-align:center;color:#dc2626'>"+d.ausentes+"</td><td style='text-align:center;color:#059669'>"+d.assinados+"</td><td style='text-align:center'>"+d.km+" km</td><td style='text-align:right;color:#059669'>"+fmtCurrency(d.custo)+"</td></tr>").join("");
    abrirPDF("Relatorio por Motorista - "+labelPeriodo,"<table><thead><tr><th>Motorista</th><th>Viagens</th><th>Pacientes</th><th>Acomp.</th><th>Ausencias</th><th>Assinados</th><th>KM</th><th>Combustivel</th></tr></thead><tbody>"+rows+"</tbody></table>");
  }
  function csv() {
    exportCSV("motoristas-"+labelPeriodo,"Motorista;Viagens;Pacientes;Acomp.;Ausencias;Assinados;KM;Combustivel(R$)",
      Object.entries(por).map(([n,d])=>n+";"+d.viagens+";"+d.pax+";"+d.acomp+";"+d.ausentes+";"+d.assinados+";"+d.km+";"+Number(d.custo).toFixed(2)));
  }

  return (
    <div>
      <FiltroBar periodo={periodo} setPeriodo={setPeriodo} mesRef={mesRef} setMesRef={setMesRef} onPDF={pdf} onCSV={csv}/>
      {Object.keys(por).length===0&&<Card style={{textAlign:"center",padding:40,color:T.textMuted}}>Nenhum dado no periodo</Card>}
      {Object.entries(por).sort((a,b)=>b[1].pax-a[1].pax).map(([nome,d])=>(
        <Card key={nome} style={{ marginBottom:10 }}>
          <div style={{ fontSize:15,fontWeight:700,color:T.text,marginBottom:12 }}>Motorista: {nome}</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,textAlign:"center",marginBottom:8 }}>
            {[
              {l:"Viagens",v:d.viagens,c:T.blue},{l:"Pacientes",v:d.pax,c:T.purple},{l:"Acomp.",v:d.acomp,c:"#7c3aed"},
              {l:"Ausencias",v:d.ausentes,c:T.red},{l:"Assinados",v:d.assinados,c:T.green},{l:"KM",v:d.km+" km",c:T.blue},
            ].map(s=>(
              <div key={s.l} style={{ background:T.bgCard2,borderRadius:10,padding:"10px 4px",border:"1px solid "+T.border }}>
                <div style={{ fontSize:20,fontWeight:800,color:s.c }}>{s.v}</div>
                <div style={{ fontSize:10,color:T.textMuted }}>{s.l}</div>
              </div>
            ))}
          </div>
          {d.custo>0&&<div style={{ background:"#f0fdf4",borderRadius:8,padding:"8px 12px",fontSize:13,display:"flex",justifyContent:"space-between",border:"1px solid #86efac" }}>
            <span style={{ color:T.textSub }}>Combustivel: {d.litros.toFixed(1)}L</span>
            <span style={{ fontWeight:700,color:T.green }}>{fmtCurrency(d.custo)}</span>
          </div>}
        </Card>
      ))}
    </div>
  );
}

// ── 3. POR VEICULO ────────────────────────────────────────────────────────────
function RelVeiculo({ viagens }) {
  const {periodo,setPeriodo,mesRef,setMesRef,filtradas,labelPeriodo}=useFiltro(viagens);
  const por={};
  filtradas.forEach(v=>{
    const n=(v.veiculo?.placa||"?")+" - "+(v.veiculo?.modelo||"");
    if(!por[n]) por[n]={viagens:0,pax:0,litros:0,custo:0,km:0};
    por[n].viagens++; por[n].pax+=v.passageiros.length;
    por[n].litros+=parseFloat(v.abastecimento?.litros)||0;
    por[n].custo+=v.abastecimento?.total||0;
    por[n].km+=(v.abastecimento?.kmFinal&&v.abastecimento?.kmInicial)?(v.abastecimento.kmFinal-v.abastecimento.kmInicial):0;
  });

  function pdf() {
    const rows=Object.entries(por).map(([n,d])=>"<tr><td><b>"+n+"</b></td><td style='text-align:center'>"+d.viagens+"</td><td style='text-align:center'>"+d.pax+"</td><td style='text-align:center'>"+d.km+" km</td><td style='text-align:center'>"+d.litros.toFixed(1)+"L</td><td style='text-align:center'>"+(d.litros>0&&d.km>0?(d.km/d.litros).toFixed(1)+" km/L":"--")+"</td><td style='text-align:right;color:#059669'>"+fmtCurrency(d.custo)+"</td></tr>").join("");
    abrirPDF("Relatorio por Veiculo - "+labelPeriodo,"<table><thead><tr><th>Veiculo</th><th>Viagens</th><th>Pacientes</th><th>KM Rodados</th><th>Litros</th><th>Consumo</th><th>Combustivel</th></tr></thead><tbody>"+rows+"</tbody></table>");
  }
  function csv() {
    exportCSV("veiculos-"+labelPeriodo,"Veiculo;Viagens;Pacientes;KM;Litros;Consumo(km/L);Combustivel(R$)",
      Object.entries(por).map(([n,d])=>n+";"+d.viagens+";"+d.pax+";"+d.km+";"+d.litros.toFixed(1)+";"+(d.litros>0&&d.km>0?(d.km/d.litros).toFixed(1):"0")+";"+Number(d.custo).toFixed(2)));
  }

  return (
    <div>
      <FiltroBar periodo={periodo} setPeriodo={setPeriodo} mesRef={mesRef} setMesRef={setMesRef} onPDF={pdf} onCSV={csv}/>
      {Object.keys(por).length===0&&<Card style={{textAlign:"center",padding:40,color:T.textMuted}}>Nenhum dado no periodo</Card>}
      {Object.entries(por).sort((a,b)=>b[1].viagens-a[1].viagens).map(([nome,d])=>(
        <Card key={nome} style={{ marginBottom:10 }}>
          <div style={{ fontSize:15,fontWeight:700,color:T.text,marginBottom:12 }}>Veiculo: {nome}</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,textAlign:"center" }}>
            {[
              {l:"Viagens",v:d.viagens,c:T.blue},{l:"Pacientes",v:d.pax,c:T.purple},{l:"KM Rodados",v:d.km+" km",c:T.blue},
              {l:"Litros",v:d.litros.toFixed(1)+"L",c:T.yellow},{l:"Consumo",v:d.litros>0&&d.km>0?(d.km/d.litros).toFixed(1)+" km/L":"--",c:T.purple},{l:"Combustivel",v:fmtCurrency(d.custo),c:T.green},
            ].map(s=>(
              <div key={s.l} style={{ background:T.bgCard2,borderRadius:10,padding:"10px 4px",border:"1px solid "+T.border }}>
                <div style={{ fontSize:18,fontWeight:800,color:s.c }}>{s.v}</div>
                <div style={{ fontSize:10,color:T.textMuted }}>{s.l}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── 4. COMBUSTIVEL ────────────────────────────────────────────────────────────
function RelCombustivel({ viagens }) {
  const {periodo,setPeriodo,mesRef,setMesRef,filtradas,labelPeriodo}=useFiltro(viagens);
  const comAbast=filtradas.filter(v=>v.abastecimento?.total);
  const totalGasto=comAbast.reduce((a,v)=>a+(v.abastecimento?.total||0),0);
  const totalLitros=comAbast.reduce((a,v)=>a+(parseFloat(v.abastecimento?.litros)||0),0);
  const totalKm=comAbast.reduce((a,v)=>a+((v.abastecimento?.kmFinal&&v.abastecimento?.kmInicial)?(v.abastecimento.kmFinal-v.abastecimento.kmInicial):0),0);

  function pdf() {
    const sumBoxes="<div style='display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px'>"
      +[{l:"Total Gasto",v:fmtCurrency(totalGasto),c:"#059669"},{l:"Total Litros",v:totalLitros.toFixed(1)+"L",c:"#d97706"},{l:"KM Rodados",v:totalKm+" km",c:"#1a56db"},{l:"Media Frota",v:totalLitros>0&&totalKm>0?(totalKm/totalLitros).toFixed(1)+" km/L":"--",c:"#7c3aed"}]
      .map(s=>"<div style='background:#f8fafc;border-radius:10px;padding:12px;text-align:center;border:1px solid #e5e7eb'><div style='font-size:20px;font-weight:900;color:"+s.c+"'>"+s.v+"</div><div style='font-size:10px;color:#9ca3af'>"+s.l+"</div></div>").join("")+"</div>";
    const rows=comAbast.map(v=>"<tr><td>#"+v.id+" - "+fmtDate(v.data)+"</td><td>"+v.motorista?.nome+"</td><td>"+v.veiculo?.placa+" "+v.veiculo?.modelo+"</td><td style='text-align:center'>"+(v.abastecimento.litros||"")+"L</td><td>"+( v.abastecimento.combustivel||"")+"</td><td style='text-align:center'>R$ "+Number(v.abastecimento.valorLitro||0).toFixed(2)+"/L</td><td>"+(v.abastecimento.posto||"--")+"</td><td style='text-align:center'>"+(v.abastecimento.kmInicial&&v.abastecimento.kmFinal?(v.abastecimento.kmFinal-v.abastecimento.kmInicial)+" km":"--")+"</td><td style='text-align:right;color:#059669;font-weight:700'>"+fmtCurrency(v.abastecimento.total)+"</td></tr>").join("");
    abrirPDF("Relatorio de Combustivel - "+labelPeriodo, sumBoxes+"<table><thead><tr><th>Viagem</th><th>Motorista</th><th>Veiculo</th><th>Litros</th><th>Tipo</th><th>Preco/L</th><th>Posto</th><th>KM</th><th>Total</th></tr></thead><tbody>"+rows+"</tbody></table>");
  }
  function csv() {
    exportCSV("combustivel-"+labelPeriodo,"Viagem;Data;Motorista;Veiculo;Litros;Tipo;Preco/L;Posto;NF;Total(R$)",
      comAbast.map(v=>"#"+v.id+";"+fmtDate(v.data)+";"+v.motorista?.nome+";"+v.veiculo?.placa+";"+( v.abastecimento.litros||0)+";"+( v.abastecimento.combustivel||"")+";"+Number(v.abastecimento.valorLitro||0).toFixed(2)+";"+( v.abastecimento.posto||"")+";"+( v.abastecimento.nota||"")+";"+Number(v.abastecimento.total||0).toFixed(2)));
  }

  return (
    <div>
      <FiltroBar periodo={periodo} setPeriodo={setPeriodo} mesRef={mesRef} setMesRef={setMesRef} onPDF={pdf} onCSV={csv}/>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16 }}>
        {[{l:"Total Gasto",v:fmtCurrency(totalGasto),c:T.green},{l:"Total Litros",v:totalLitros.toFixed(1)+"L",c:T.yellow},{l:"KM Rodados",v:totalKm+" km",c:T.blue},{l:"Media da Frota",v:totalLitros>0&&totalKm>0?(totalKm/totalLitros).toFixed(1)+" km/L":"--",c:T.purple}]
        .map(s=>(
          <div key={s.l} style={{ background:T.bgCard,borderRadius:12,padding:14,textAlign:"center",border:"1px solid "+T.border }}>
            <div style={{ fontSize:22,fontWeight:800,color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11,color:T.textSub }}>{s.l}</div>
          </div>
        ))}
      </div>
      {comAbast.length===0&&<Card style={{textAlign:"center",padding:40,color:T.textMuted}}>Nenhum abastecimento no periodo</Card>}
      {comAbast.map(v=>(
        <Card key={v.id} style={{ marginBottom:8,padding:"12px 14px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:13,fontWeight:700,color:T.text }}>Viagem #{v.id} - {fmtDate(v.data)}</div>
              <div style={{ fontSize:12,color:T.textSub }}>{v.motorista?.nome} - {v.veiculo?.placa} {v.veiculo?.modelo}</div>
              <div style={{ fontSize:12,color:T.textSub }}>{v.abastecimento.combustivel} - {v.abastecimento.litros}L - R$ {Number(v.abastecimento.valorLitro||0).toFixed(2)}/L</div>
              {v.abastecimento.posto&&<div style={{ fontSize:11,color:T.textMuted }}>Posto: {v.abastecimento.posto}</div>}
              {v.abastecimento.nota&&<div style={{ fontSize:11,color:T.textMuted }}>NF: {v.abastecimento.nota}</div>}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:18,fontWeight:800,color:T.green }}>{fmtCurrency(v.abastecimento.total)}</div>
              {v.abastecimento.kmInicial&&v.abastecimento.kmFinal&&<div style={{ fontSize:11,color:T.textSub }}>{v.abastecimento.kmFinal-v.abastecimento.kmInicial} km</div>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── 5. QUILOMETRAGEM ──────────────────────────────────────────────────────────
function RelKilometragem({ viagens }) {
  const {periodo,setPeriodo,mesRef,setMesRef,filtradas,labelPeriodo}=useFiltro(viagens);
  const comKm=filtradas.filter(v=>v.abastecimento?.kmInicial&&v.abastecimento?.kmFinal);
  const por={};
  comKm.forEach(v=>{
    const n=(v.veiculo?.placa||"?")+" - "+(v.veiculo?.modelo||"");
    if(!por[n]) por[n]={viagens:0,kmTotal:0,kmAtual:0,registros:[]};
    const km=v.abastecimento.kmFinal-v.abastecimento.kmInicial;
    por[n].viagens++; por[n].kmTotal+=km;
    por[n].kmAtual=Math.max(por[n].kmAtual,v.abastecimento.kmFinal);
    por[n].registros.push({data:v.data,motorista:v.motorista?.nome||"",kmIni:v.abastecimento.kmInicial,kmFim:v.abastecimento.kmFinal,km});
  });
  const totalKm=Object.values(por).reduce((a,v)=>a+v.kmTotal,0);

  function pdf() {
    const sections=Object.entries(por).map(([nome,d])=>{
      const rows=d.registros.sort((a,b)=>a.data.localeCompare(b.data)).map(r=>"<tr><td>"+fmtDate(r.data)+"</td><td>"+r.motorista+"</td><td>"+r.kmIni+"</td><td>"+r.kmFim+"</td><td style='text-align:right;font-weight:700'>"+r.km+" km</td></tr>").join("");
      return "<div style='margin-bottom:20px'><div style='font-size:14px;font-weight:700;margin-bottom:10px'>"+nome+"</div><div style='display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px'><div style='background:#f8fafc;border-radius:8px;padding:8px;text-align:center;border:1px solid #e5e7eb'><div style='font-size:18px;font-weight:800;color:#1a56db'>"+d.viagens+"</div><div style='font-size:10px;color:#9ca3af'>Viagens</div></div><div style='background:#f8fafc;border-radius:8px;padding:8px;text-align:center;border:1px solid #e5e7eb'><div style='font-size:18px;font-weight:800;color:#059669'>"+d.kmTotal+" km</div><div style='font-size:10px;color:#9ca3af'>Total Rodado</div></div><div style='background:#f8fafc;border-radius:8px;padding:8px;text-align:center;border:1px solid #e5e7eb'><div style='font-size:18px;font-weight:800;color:#7c3aed'>"+d.kmAtual+"</div><div style='font-size:10px;color:#9ca3af'>KM Atual</div></div></div><table><thead><tr><th>Data</th><th>Motorista</th><th>KM Inicial</th><th>KM Final</th><th style='text-align:right'>KM Rodado</th></tr></thead><tbody>"+rows+"</tbody></table></div>";
    }).join("");
    abrirPDF("Relatorio de Quilometragem - "+labelPeriodo,"<div style='background:#eff6ff;border-radius:10px;padding:12px 16px;margin-bottom:20px;border:1px solid #bfdbfe'><div style='font-size:12px;color:#6b7280'>Total KM Rodado no Periodo</div><div style='font-size:28px;font-weight:900;color:#1a56db'>"+totalKm+" km</div></div>"+sections);
  }
  function csv() {
    exportCSV("quilometragem-"+labelPeriodo,"Placa;Modelo;Data;Motorista;KM Inicial;KM Final;KM Rodado",
      comKm.map(v=>(v.veiculo?.placa||"")+";"+( v.veiculo?.modelo||"")+";"+fmtDate(v.data)+";"+( v.motorista?.nome||"")+";"+v.abastecimento.kmInicial+";"+v.abastecimento.kmFinal+";"+(v.abastecimento.kmFinal-v.abastecimento.kmInicial)));
  }

  return (
    <div>
      <FiltroBar periodo={periodo} setPeriodo={setPeriodo} mesRef={mesRef} setMesRef={setMesRef} onPDF={pdf} onCSV={csv}/>
      <div style={{ background:T.bgCard,borderRadius:12,padding:"14px 16px",marginBottom:16,border:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:13,color:T.textSub }}>Total KM Rodado no Periodo</span>
        <span style={{ fontSize:24,fontWeight:800,color:T.blue }}>{totalKm} km</span>
      </div>
      {Object.keys(por).length===0&&<Card style={{textAlign:"center",padding:40,color:T.textMuted}}>Nenhum registro de KM no periodo.<br/><span style={{fontSize:12}}>Registre KM ao iniciar e finalizar viagens.</span></Card>}
      {Object.entries(por).map(([nome,d])=>(
        <Card key={nome} style={{ marginBottom:12 }}>
          <div style={{ fontSize:15,fontWeight:700,color:T.text,marginBottom:12 }}>Veiculo: {nome}</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,textAlign:"center",marginBottom:12 }}>
            {[{l:"Viagens",v:d.viagens,c:T.blue},{l:"Total Rodado",v:d.kmTotal+" km",c:T.green},{l:"KM Atual",v:d.kmAtual,c:T.purple}].map(s=>(
              <div key={s.l} style={{ background:T.bgCard2,borderRadius:10,padding:"10px 4px",border:"1px solid "+T.border }}>
                <div style={{ fontSize:18,fontWeight:800,color:s.c }}>{s.v}</div>
                <div style={{ fontSize:10,color:T.textMuted }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid "+T.border,paddingTop:10 }}>
            {d.registros.sort((a,b)=>a.data.localeCompare(b.data)).map((r,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<d.registros.length-1?"1px solid #f0f0f0":"none" }}>
                <div>
                  <span style={{ fontSize:12,fontWeight:600,color:T.text }}>{fmtDate(r.data)}</span>
                  <span style={{ fontSize:11,color:T.textSub }}> - {r.motorista}</span>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontSize:11,color:T.textSub }}>{r.kmIni} > {r.kmFim}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:T.blue,marginLeft:8 }}>{r.km} km</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────
const ABAS=[
  {id:"viagem",label:"Por Viagem",icon:"🚐"},
  {id:"motorista",label:"Por Motorista",icon:"🧑‍✈️"},
  {id:"veiculo",label:"Por Veiculo",icon:"🚗"},
  {id:"combustivel",label:"Combustivel",icon:"⛽"},
  {id:"km",label:"Quilometragem",icon:"📍"},
];

export default function Relatorios({ viagens, db }) {
  const [aba,setAba]=useState("viagem");
  return (
    <div style={{ background:T.bg,minHeight:"100vh",fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:"flex",background:"#fff",borderBottom:"1px solid "+T.border,overflowX:"auto",paddingLeft:8 }}>
        {ABAS.map(a=>(
          <button key={a.id} onClick={()=>setAba(a.id)}
            style={{ padding:"11px 14px",background:"none",border:"none",whiteSpace:"nowrap",color:aba===a.id?T.blue:T.textSub,borderBottom:aba===a.id?"2px solid "+T.blue:"2px solid transparent",fontWeight:aba===a.id?700:500,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>
      <div style={{ padding:16,maxWidth:860,margin:"0 auto" }}>
        {aba==="viagem"      && <RelViagem      viagens={viagens}/>}
        {aba==="motorista"   && <RelMotorista   viagens={viagens}/>}
        {aba==="veiculo"     && <RelVeiculo     viagens={viagens}/>}
        {aba==="combustivel" && <RelCombustivel viagens={viagens}/>}
        {aba==="km"          && <RelKilometragem viagens={viagens}/>}
      </div>
    </div>
  );
}
