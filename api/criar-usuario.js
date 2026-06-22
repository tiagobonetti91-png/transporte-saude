const SUPABASE_URL = process.env.SUPABASE_URL || "https://vekpgebyviazxongeuaa.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) {
      resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
      return;
    }

    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("Nao consegui ler os dados enviados."));
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.msg || data?.message || text || "Erro no Supabase.";
    throw new Error(message);
  }
  return data;
}

async function insertRest(table, body) {
  return supabaseFetch(`/rest/v1/${table}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
}

async function selectRest(table, query) {
  return supabaseFetch(`/rest/v1/${table}?${query}`);
}

async function findAuthUserByEmail(email) {
  const data = await supabaseFetch(`/auth/v1/admin/users?page=1&per_page=1000`);
  const users = Array.isArray(data?.users) ? data.users : [];
  return users.find(user => String(user.email || "").toLowerCase() === email) || null;
}

async function createOrFindAuthUser({ email, password, nome, perfil }) {
  try {
    return await supabaseFetch("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome, perfil },
      }),
    });
  } catch (error) {
    if (!String(error.message || "").toLowerCase().includes("already")) throw error;
    const user = await findAuthUserByEmail(email);
    if (!user?.id) throw error;
    return user;
  }
}

async function insertPerfil(body) {
  const tentativas = [
    body,
    Object.fromEntries(Object.entries(body).filter(([key]) => key !== "email")),
    Object.fromEntries(Object.entries(body).filter(([key]) => !["email", "nome"].includes(key))),
  ];
  let ultimoErro = null;
  for (const tentativa of tentativas) {
    try {
      return await insertRest("perfis", tentativa);
    } catch (error) {
      ultimoErro = error;
    }
  }
  throw ultimoErro;
}

async function ensurePerfil(body) {
  const existente = await selectRest("perfis", `id=eq.${body.id}&select=id`);
  if (existente?.length) return existente[0];
  return insertPerfil(body);
}

async function validarAdmin(authHeader) {
  if (!authHeader) throw new Error("Sessao expirada. Entre novamente no sistema.");

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: authHeader,
    },
  });
  const user = await userResponse.json();
  if (!userResponse.ok || !user?.id) throw new Error("Sessao invalida. Entre novamente no sistema.");

  const perfis = await supabaseFetch(`/rest/v1/perfis?id=eq.${user.id}&select=perfil,ativo`);
  const perfil = perfis?.[0];
  if (!perfil?.ativo || perfil.perfil === "motorista") {
    throw new Error("Apenas usuarios da secretaria podem criar novos usuarios.");
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    if (!SERVICE_ROLE_KEY) {
      throw new Error("Configure SUPABASE_SERVICE_ROLE_KEY nas variaveis de ambiente do Vercel.");
    }

    await validarAdmin(req.headers.authorization);

    const body = await readJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const nome = String(body.nome || "").trim();
    const perfil = String(body.perfil || "admin").trim();
    const cnh = String(body.cnh || "").trim();
    const telefone = String(body.telefone || "").trim();
    const categoriaCnh = String(body.categoriaCnh || "B").trim();
    const cargo = String(body.cargo || "").trim();

    if (!email || !email.includes("@")) throw new Error("Informe um e-mail valido para o usuario.");
    if (password.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres.");

    const user = await createOrFindAuthUser({ email, password, nome, perfil });

    if (perfil === "motorista") {
      const cnhQuery = cnh ? `cnh=eq.${encodeURIComponent(cnh)}&select=*` : "";
      const existentes = cnhQuery ? await selectRest("motoristas", cnhQuery) : [];
      const motoristas = existentes?.length ? existentes : await insertRest("motoristas", {
        nome,
        cnh,
        telefone,
        categoria_cnh: categoriaCnh || "B",
      });
      const motorista = motoristas?.[0];
      await ensurePerfil({
        id: user.id,
        perfil: "motorista",
        nome,
        email,
        motorista_id: motorista?.id,
        ativo: true,
      });
      send(res, 200, { user, registro: motorista });
      return;
    }

    const existentes = await selectRest("admins", `email=eq.${encodeURIComponent(email)}&select=*`);
    const admins = existentes?.length ? existentes : await insertRest("admins", { nome, email, cargo });
    const admin = admins?.[0];
    await ensurePerfil({
      id: user.id,
      perfil: "admin",
      nome,
      email,
      ativo: true,
    });

    send(res, 200, { user, registro: admin });
  } catch (error) {
    send(res, 400, { error: error.message || "Erro ao criar usuario." });
  }
}
