// ── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://vekpgebyviazxongeuaa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZla3BnZWJ5dmlhenhvbmdldWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjY1MTgsImV4cCI6MjA4ODIwMjUxOH0.eFkmSZD9jeUt7mHPOi-J8zOdjj6EWGBf3a2p8MVC6uw";

// ── Supabase Auth Client ──────────────────────────────────────────────────────
export const supabase = (() => {
  const URL = "https://vekpgebyviazxongeuaa.supabase.co";
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZla3BnZWJ5dmlhenhvbmdldWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjY1MTgsImV4cCI6MjA4ODIwMjUxOH0.eFkmSZD9jeUt7mHPOi-J8zOdjj6EWGBf3a2p8MVC6uw";
  const BASE_HEADERS = { "apikey": KEY, "Content-Type": "application/json" };
  let _session = null;
  try { const s = localStorage.getItem("ts_session"); if (s) _session = JSON.parse(s); } catch(e) {}

  function getToken() { return _session?.access_token || KEY; }
  function authHeaders() { return { ...BASE_HEADERS, "Authorization": `Bearer ${getToken()}` }; }
  function saveSession(s) { _session = s; try { if(s) localStorage.setItem("ts_session", JSON.stringify(s)); else localStorage.removeItem("ts_session"); } catch(e) {} }

  return {
    auth: {
      getToken,
      async signInWithPassword({ email, password }) {
        const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method:"POST", headers: BASE_HEADERS, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (!res.ok) return { data: null, error: data };
        saveSession(data);
        return { data: { user: data.user, session: data }, error: null };
      },
      async signOut() {
        try { await fetch(`${URL}/auth/v1/logout`, { method:"POST", headers: authHeaders() }); } catch(e) {}
        saveSession(null);
      },
      async getSession() {
        if (!_session) return { data: { session: null } };
        const exp = _session.expires_at;
        if (exp && (exp - Date.now()/1000) < 60) {
          try {
            const res = await fetch(`${URL}/auth/v1/token?grant_type=refresh_token`, { method:"POST", headers: BASE_HEADERS, body: JSON.stringify({ refresh_token: _session.refresh_token }) });
            if (res.ok) { saveSession(await res.json()); }
            else { saveSession(null); return { data: { session: null } }; }
          } catch(e) { saveSession(null); return { data: { session: null } }; }
        }
        return { data: { session: _session, user: _session?.user } };
      }
    },
    from(table) {
      const h = authHeaders();
      const base = `${URL}/rest/v1/${table}`;
      return {
        select(cols = "*") {
          let url = `${base}?select=${cols}`;
          return {
            eq(col, val) { url += `&${col}=eq.${val}`; return this; },
            order(col, opts={}) { url += `&order=${col}.${opts.ascending===false?"desc":"asc"}`; return this; },
            single() {
              return fetch(url, { headers: { ...h, "Accept": "application/vnd.pgrst.object+json" } })
                .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
                .then(data => ({ data, error: null }))
                .catch(error => ({ data: null, error }));
            },
            then(resolve, reject) {
              return fetch(url, { headers: h })
                .then(r => r.json().then(d => ({ data: d, error: r.ok ? null : d })))
                .then(resolve, reject);
            }
          };
        }
      };
    }
  };
})();

async function sb(path, options = {}) {
  const token = supabase.auth.getToken();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer !== undefined ? options.prefer : "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`Supabase: ${err}`); }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const apiPacientes = {
  async listar() { return sb("pacientes?select=*&order=nome"); },
  async criar(d) { return sb("pacientes", { method:"POST", body: JSON.stringify({ nome:d.nome, cpf:d.cpf, telefone:d.telefone, data_nasc:d.dataNasc||null }) }); },
  async atualizar(id, d) { return sb(`pacientes?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ nome:d.nome, cpf:d.cpf, telefone:d.telefone, data_nasc:d.dataNasc||null }) }); },
  async deletar(id) { return sb(`pacientes?id=eq.${id}`, { method:"DELETE", prefer:"" }); },
};
export const apiDestinos = {
  async listar() { return sb("destinos?select=*&order=nome"); },
  async criar(d) { return sb("destinos", { method:"POST", body: JSON.stringify({ nome:d.nome, cidade:d.cidade, especialidade:d.especialidade, endereco:d.endereco, telefone:d.telefone }) }); },
  async atualizar(id, d) { return sb(`destinos?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ nome:d.nome, cidade:d.cidade, especialidade:d.especialidade, endereco:d.endereco, telefone:d.telefone }) }); },
  async deletar(id) { return sb(`destinos?id=eq.${id}`, { method:"DELETE", prefer:"" }); },
};
export const apiMotoristas = {
  async listar() { return sb("motoristas?select=*&order=nome"); },
  async criar(d) { return sb("motoristas", { method:"POST", body: JSON.stringify({ nome:d.nome, cnh:d.cnh, telefone:d.telefone, categoria_cnh:d.categoriaCnh }) }); },
  async atualizar(id, d) { return sb(`motoristas?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ nome:d.nome, cnh:d.cnh, telefone:d.telefone, categoria_cnh:d.categoriaCnh }) }); },
  async deletar(id) { return sb(`motoristas?id=eq.${id}`, { method:"DELETE", prefer:"" }); },
};
export const apiVeiculos = {
  async listar() { return sb("veiculos?select=*&order=placa"); },
  async criar(d) { return sb("veiculos", { method:"POST", body: JSON.stringify({ placa:d.placa, modelo:d.modelo, capacidade:d.capacidade, tipo:d.tipo, ano:d.ano, cor:d.cor, km_atual:d.kmAtual||0, combustivel:d.combustivel, consumo_medio:d.consumoMedio }) }); },
  async atualizar(id, d) { return sb(`veiculos?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ placa:d.placa, modelo:d.modelo, capacidade:d.capacidade, tipo:d.tipo, ano:d.ano, cor:d.cor, km_atual:d.kmAtual||0, combustivel:d.combustivel, consumo_medio:d.consumoMedio }) }); },
  async deletar(id) { return sb(`veiculos?id=eq.${id}`, { method:"DELETE", prefer:"" }); },
};
export const apiAdmins = {
  async listar() { return sb("admins?select=*&order=nome"); },
  async criar(d) { return sb("admins", { method:"POST", body: JSON.stringify({ nome:d.nome, email:d.email, cargo:d.cargo }) }); },
  async atualizar(id, d) { return sb(`admins?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ nome:d.nome, email:d.email, cargo:d.cargo }) }); },
  async deletar(id) { return sb(`admins?id=eq.${id}`, { method:"DELETE", prefer:"" }); },
};
export const apiViagens = {
  async listar() {
    const [viagens, passageiros, motoristas, veiculos, pacientes, destinos] = await Promise.all([
      sb("viagens?select=*&order=data.desc,horario_saida"),
      sb("passageiros_viagem?select=*"),
      sb("motoristas?select=*"),
      sb("veiculos?select=*"),
      sb("pacientes?select=*"),
      sb("destinos?select=*"),
    ]);
    return (viagens||[]).map(v => ({
      id: v.id, data: v.data, horarioSaida: v.horario_saida, status: v.status, abastecimento: v.abastecimento,
      veiculo: mapVeiculo((veiculos||[]).find(x => x.id === v.veiculo_id)),
      motorista: mapMotorista((motoristas||[]).find(x => x.id === v.motorista_id)),
      passageiros: (passageiros||[]).filter(p => p.viagem_id === v.id).map(p => ({
        id: p.id, status: p.status, horarioChegada: p.horario_chegada, localEmbarque: p.local_embarque,
        tipoTrajeto: p.tipo_trajeto||"ida_volta", acompanhantes: p.acompanhantes||[], assinatura: p.assinatura,
        paciente: mapPaciente((pacientes||[]).find(x => x.id === p.paciente_id)),
        destino: mapDestino((destinos||[]).find(x => x.id === p.destino_id)),
      })),
    }));
  },
  async criar(form) {
    const [viagem] = await sb("viagens", { method:"POST", body: JSON.stringify({ data:form.data, horario_saida:form.horarioSaida, veiculo_id:form.veiculo.id, motorista_id:form.motorista.id, status:form.status, abastecimento:form.abastecimento||null }) });
    if (form.passageiros.length > 0) {
      await sb("passageiros_viagem", { method:"POST", body: JSON.stringify(form.passageiros.map(p => ({ viagem_id:viagem.id, paciente_id:p.paciente.id, destino_id:p.destino.id, horario_chegada:p.horarioChegada, local_embarque:p.localEmbarque||null, tipo_trajeto:p.tipoTrajeto||"ida_volta", acompanhantes:p.acompanhantes||[], status:p.status||"indefinido", assinatura:p.assinatura||null }))) });
    }
    return viagem;
  },
  async atualizar(id, form) {
    await sb(`viagens?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ data:form.data, horario_saida:form.horarioSaida, veiculo_id:form.veiculo.id, motorista_id:form.motorista.id, status:form.status, abastecimento:form.abastecimento||null }) });
    await sb(`passageiros_viagem?viagem_id=eq.${id}`, { method:"DELETE", prefer:"" });
    if (form.passageiros.length > 0) {
      await sb("passageiros_viagem", { method:"POST", body: JSON.stringify(form.passageiros.map(p => ({ viagem_id:id, paciente_id:p.paciente.id, destino_id:p.destino.id, horario_chegada:p.horarioChegada, local_embarque:p.localEmbarque||null, tipo_trajeto:p.tipoTrajeto||"ida_volta", acompanhantes:p.acompanhantes||[], status:p.status||"indefinido", assinatura:p.assinatura||null }))) });
    }
  },
  async atualizarStatusPassageiro(paxId, status) { await sb(`passageiros_viagem?id=eq.${paxId}`, { method:"PATCH", body: JSON.stringify({ status }) }); },
  async atualizarAssinatura(paxId, assinatura) { await sb(`passageiros_viagem?id=eq.${paxId}`, { method:"PATCH", body: JSON.stringify({ assinatura }) }); },
  async atualizarAbastecimento(viagemId, abastecimento) { await sb(`viagens?id=eq.${viagemId}`, { method:"PATCH", body: JSON.stringify({ abastecimento }) }); },
  async deletar(id) { await sb(`viagens?id=eq.${id}`, { method:"DELETE", prefer:"" }); },
  async moverPassageiro(paxId, novaViagemId) {
    await sb(`passageiros_viagem?id=eq.${paxId}`, { method:"PATCH", body: JSON.stringify({ viagem_id: novaViagemId, status:"indefinido" }) });
  },
};

// ── API de Transferências ─────────────────────────────────────────────────────
export const apiTransferencias = {
  async listar() { return sb("transferencias?select=*&order=created_at.desc"); },
  async listarPendentes(motoristaDestinoId) {
    return sb(`transferencias?motorista_destino_id=eq.${motoristaDestinoId}&status=eq.pendente&select=*&order=created_at.desc`);
  },
  async criar(d) {
    return sb("transferencias", { method:"POST", body: JSON.stringify({
      passageiro_id: d.passageiroId,
      viagem_origem_id: d.viagemOrigemId,
      viagem_destino_id: d.viagemDestinoId,
      motorista_origem_id: d.motoristaOrigemId,
      motorista_destino_id: d.motoristaDestinoId,
      status: "pendente",
    })});
  },
  async aceitar(id) { return sb(`transferencias?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ status:"aceita" }) }); },
  async recusar(id) { return sb(`transferencias?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ status:"recusada" }) }); },
};

export function mapPaciente(p) { if(!p) return null; return { id:p.id, nome:p.nome, cpf:p.cpf, telefone:p.telefone, dataNasc:p.data_nasc }; }
export function mapDestino(d) { if(!d) return null; return { id:d.id, nome:d.nome, cidade:d.cidade, especialidade:d.especialidade, endereco:d.endereco, telefone:d.telefone }; }
export function mapMotorista(m) { if(!m) return null; return { id:m.id, nome:m.nome, cnh:m.cnh, telefone:m.telefone, categoriaCnh:m.categoria_cnh }; }
export function mapVeiculo(v) { if(!v) return null; return { id:v.id, placa:v.placa, modelo:v.modelo, capacidade:v.capacidade, tipo:v.tipo, ano:v.ano, cor:v.cor, kmAtual:v.km_atual, combustivel:v.combustivel, consumoMedio:v.consumo_medio }; }

export const TODAY = new Date().toISOString().split("T")[0];
export const STATUS_CONFIG = {
  indefinido:{ label:"Indefinido", color:"#94a3b8", bg:"#1e293b", next:"embarcado"  },
  embarcado: { label:"Embarcado",  color:"#38bdf8", bg:"#0c2d48", next:"entregue"   },
  entregue:  { label:"Entregue",   color:"#a78bfa", bg:"#1e1040", next:"pronto"     },
  pronto:    { label:"Pronto",     color:"#34d399", bg:"#052e1c", next:"recolhido"  },
  recolhido: { label:"Recolhido",  color:"#fb923c", bg:"#2d1200", next:"indefinido" },
  ausente:   { label:"Ausente",    color:"#f87171", bg:"#2d0000", next:"indefinido" },
};
export const VIAGEM_STATUS = {
  agendada:    { label:"Agendada",     color:"#38bdf8", bg:"#0c2d48" },
  em_andamento:{ label:"Em Andamento", color:"#fbbf24", bg:"#2d1a00" },
  concluida:   { label:"Concluida",    color:"#34d399", bg:"#052e1c" },
  cancelada:   { label:"Cancelada",    color:"#f87171", bg:"#2d0000" },
};
export const COMBUSTIVEIS = ["Gasolina","Etanol","Diesel","GNV","Eletrico"];
export const fmtDate = d => { if(!d) return ""; const [y,m,day]=d.split("-"); return `${day}/${m}/${y}`; };
export const fmtCurrency = v => "R$ "+Number(v||0).toFixed(2).replace(".",",").replace(/\B(?=(\d{3})+(?!\d))/g,".");
