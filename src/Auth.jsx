import { useState } from 'react';
import { S, Btn } from './UI.jsx';
import { supabase, fmtDate, TODAY } from './data.js';

function formatCPF(v) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2');
}

export default function LoginScreen({ onLogin }) {
  const [perfil, setPerfil] = useState("motorista");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function entrar() {
    setErro(""); setLoading(true);
    try {
      let loginEmail = email;
      if (perfil === "motorista") {
        const cpfLimpo = cpf.replace(/\D/g,"");
        if (cpfLimpo.length !== 11) { setErro("CPF inválido — deve ter 11 dígitos."); setLoading(false); return; }
        loginEmail = `${cpfLimpo}@transportesaude.app`;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: senha });
      if (error) { setErro("E-mail/CPF ou senha incorretos."); setLoading(false); return; }
      // Buscar perfil
      const { data: perfData, error: perfError } = await supabase.from("perfis").select("*").eq("id", data.user.id).single();
      if (perfError || !perfData) { setErro("Usuário sem perfil cadastrado."); await supabase.auth.signOut(); setLoading(false); return; }
      if (!perfData.ativo) { setErro("Usuário inativo. Contate a secretaria."); await supabase.auth.signOut(); setLoading(false); return; }
      onLogin(data.user, perfData);
    } catch(e) {
      setErro("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:"#050c18", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:20 }}>
      <div style={{ background:"#0a1628", borderRadius:24, padding:36, width:"100%", maxWidth:400, border:"1px solid #1e3a5f" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:72,height:72,borderRadius:20,background:"linear-gradient(135deg,#3b82f6,#10b981)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 14px" }}><img src="/logo.png" style={{width:52,height:52,borderRadius:12,objectFit:"cover"}}/></div>
          <div style={{ fontSize:10,color:"#64748b",letterSpacing:3,textTransform:"uppercase",marginBottom:4 }}>Secretaria Municipal de Saúde</div>
          <div style={{ fontSize:22,fontWeight:800,color:"#fff",marginBottom:2 }}>TransporteSaúde</div>
          <div style={{ fontSize:12,color:"#475569" }}>Sistema de Controle de Passageiros</div>
        </div>

        {/* Seletor de perfil */}
        <div style={{ display:"flex",background:"#070f1f",borderRadius:12,padding:4,marginBottom:24,border:"1px solid #1e3a5f" }}>
          {[["motorista","🚐 Motorista"],["admin","🏥 Secretaria"]].map(([p,l])=>(
            <button key={p} onClick={()=>{setPerfil(p);setErro("");}} style={{ flex:1,padding:10,background:perfil===p?"#1e3a5f":"none",border:"none",borderRadius:10,color:perfil===p?"#fff":"#64748b",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all .2s" }}>{l}</button>
          ))}
        </div>

        {/* Campos */}
        {perfil==="admin" ? (
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>E-mail</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" type="email" style={S.input} onKeyDown={e=>e.key==="Enter"&&entrar()}/>
          </div>
        ) : (
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>CPF</label>
            <input value={cpf} onChange={e=>setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" style={S.input} onKeyDown={e=>e.key==="Enter"&&entrar()} inputMode="numeric"/>
          </div>
        )}

        <div style={{ marginBottom:20, position:"relative" }}>
          <label style={S.label}>Senha</label>
          <input value={senha} onChange={e=>setSenha(e.target.value)} type={mostrarSenha?"text":"password"} placeholder="••••••••" style={{ ...S.input, paddingRight:44 }} onKeyDown={e=>e.key==="Enter"&&entrar()}/>
          <button onClick={()=>setMostrarSenha(v=>!v)} style={{ position:"absolute",right:12,top:28,background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:16,padding:4 }}>{mostrarSenha?"🙈":"👁️"}</button>
        </div>

        {/* Erro */}
        {erro && (
          <div style={{ background:"#2d0000",border:"1px solid #f8717144",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#f87171" }}>
            ⚠️ {erro}
          </div>
        )}

        <Btn full onClick={entrar} disabled={loading} color="#3b82f6" sx={{ fontSize:15,padding:"14px" }}>
          {loading ? "Entrando..." : "Entrar →"}
        </Btn>

        <div style={{ marginTop:16,fontSize:11,color:"#1e3a5f",textAlign:"center" }}>
          Esqueceu a senha? Contate a secretaria de saúde.
        </div>
      </div>

      {/* Botão paciente */}
      <button onClick={()=>window.dispatchEvent(new CustomEvent("openPaciente"))} style={{ marginTop:20,background:"none",border:"1px solid #1e3a5f",color:"#64748b",borderRadius:12,padding:"10px 24px",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>
        👤 Sou Paciente — Consultar Minhas Viagens
      </button>

      <div style={{ marginTop:16,fontSize:11,color:"#1e3a5f" }}>TransporteSaúde v2.0 · {fmtDate(TODAY)}</div>
    </div>
  );
}
