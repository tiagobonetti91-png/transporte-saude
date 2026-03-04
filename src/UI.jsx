import { useState } from 'react';
import { STATUS_CONFIG } from './data.js';

export const S = {
  input:    { background:"#070f1f", border:"1px solid #1e3a5f", borderRadius:10, padding:"10px 14px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" },
  label:    { fontSize:11, color:"#64748b", letterSpacing:1, textTransform:"uppercase", display:"block", marginBottom:6 },
  card:     { background:"#0c1a2e", borderRadius:16, padding:18, border:"1px solid #10243b", marginBottom:14 },
  modal:    { position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:200, overflowY:"auto", padding:"20px 0" },
  modalBox: { background:"#0a1628", borderRadius:20, padding:24, width:"100%", maxWidth:560, margin:"0 16px", border:"1px solid #1e3a5f" },
};

export function Field({ label, children }) {
  return <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}><label style={S.label}>{label}</label>{children}</div>;
}
export function Inp({ label, ...p }) { return <Field label={label}><input style={S.input} {...p}/></Field>; }
export function Sel({ label, value, onChange, options }) {
  return <Field label={label}><select value={value} onChange={e=>onChange(e.target.value)} style={S.input}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>;
}
export function Btn({ children, onClick, color="#3b82f6", disabled, small, danger, full, sx={} }) {
  const bg = danger?"linear-gradient(135deg,#7f1d1d,#991b1b)":disabled?"#1e293b":`linear-gradient(135deg,${color},${color}cc)`;
  return <button onClick={onClick} disabled={disabled} style={{ background:bg, color:disabled?"#475569":"#fff", border:"none", borderRadius:small?8:12, padding:small?"6px 12px":"11px 20px", fontSize:small?12:14, fontWeight:700, cursor:disabled?"default":"pointer", fontFamily:"inherit", width:full?"100%":undefined, whiteSpace:"nowrap", ...sx }}>{children}</button>;
}
export function StatusBadge({ status, onClick }) {
  const cfg=STATUS_CONFIG[status];
  return <button onClick={onClick} style={{ background:cfg.bg, color:cfg.color, border:`1.5px solid ${cfg.color}`, borderRadius:20, padding:"4px 14px", fontSize:12, fontWeight:700, cursor:onClick?"pointer":"default", fontFamily:"inherit" }}>{cfg.label}</button>;
}
export function ModalHdr({ title, onClose }) {
  return <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}><div style={{ fontSize:17, fontWeight:700, color:"#fff" }}>{title}</div><button onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button></div>;
}
export function SecTitle({ children }) {
  return <div style={{ fontSize:11, color:"#475569", letterSpacing:2, textTransform:"uppercase", marginBottom:12, marginTop:4 }}>{children}</div>;
}
export function AutoC({ label, placeholder, results, onQuery, value, onSelect, renderItem }) {
  return (
    <div style={{ position:"relative", marginBottom:14 }}>
      <label style={S.label}>{label}</label>
      <input value={value} onChange={e=>onQuery(e.target.value)} placeholder={placeholder} style={S.input}/>
      {results.length>0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#0f2040", border:"1px solid #1e3a5f", borderRadius:10, zIndex:50, overflow:"hidden", marginTop:4, boxShadow:"0 8px 32px #000a" }}>
          {results.map((r,i)=>(
            <div key={i} onMouseDown={()=>onSelect(r)} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #10243b", fontSize:13, color:"#e2e8f0" }}
              onMouseEnter={e=>e.currentTarget.style.background="#1e3a5f"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
              {renderItem(r)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export function CrudList({ title, icon, items, renderRow, onNew, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{icon} {title} <span style={{ fontSize:12, color:"#475569" }}>({items.length})</span></div>
        <Btn onClick={onNew} color="#10b981" small>+ Novo</Btn>
      </div>
      {items.length===0
        ? <div style={{ ...S.card, textAlign:"center", color:"#475569", padding:32 }}>Nenhum registro</div>
        : items.map(item=>(
          <div key={item.id} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
            <div style={{ flex:1 }}>{renderRow(item)}</div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <Btn small onClick={()=>onEdit(item)} color="#3b82f6">✏️</Btn>
              <Btn small danger onClick={()=>onDelete(item.id)}>🗑️</Btn>
            </div>
          </div>
        ))
      }
    </div>
  );
}
export function ViagemStatusBadge({ status }) {
  const VS = { agendada:{label:"Agendada",color:"#38bdf8",bg:"#0c2d48"}, em_andamento:{label:"Em Andamento",color:"#fbbf24",bg:"#2d1a00"}, concluida:{label:"Concluída",color:"#34d399",bg:"#052e1c"}, cancelada:{label:"Cancelada",color:"#f87171",bg:"#2d0000"} };
  const s=VS[status]||VS.agendada;
  return <span style={{ background:s.bg, color:s.color, border:`1.5px solid ${s.color}`, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700 }}>{s.label}</span>;
}
