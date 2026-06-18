const MAX_BODY_BYTES = 25 * 1024 * 1024;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) {
      resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
      return;
    }

    let size = 0;
    const chunks = [];
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("O PDF e muito grande para importar de uma vez. Tente dividir o roteiro em arquivos menores."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("Nao consegui ler os dados enviados pelo navegador."));
      }
    });
    req.on("error", reject);
  });
}

function extractJson(text) {
  if (!text) throw new Error("A IA nao retornou texto para analisar.");
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw firstError;
    return JSON.parse(match[0]);
  }
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeTime(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2})[:hH]?(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function normalizeTripType(value) {
  const text = String(value || "").toLowerCase();
  if (["ida", "i"].includes(text) || /somente\s+ida/.test(text)) return "ida";
  if (["volta", "v"].includes(text) || /somente\s+volta/.test(text)) return "volta";
  return "ida_volta";
}

function normalizeResult(json) {
  const viagens = Array.isArray(json?.viagens) ? json.viagens : [];
  return {
    viagens: viagens.map((viagem, index) => ({
      numeroViagem: String(viagem.numeroViagem || viagem.numero || index + 1),
      data: String(viagem.data || "").slice(0, 10),
      horaSaida: normalizeTime(viagem.horaSaida || viagem.horarioSaida || viagem.saida),
      destino: String(viagem.destino || ""),
      motorista: {
        nome: String(viagem.motorista?.nome || viagem.nomeMotorista || "").trim(),
        cnh: onlyDigits(viagem.motorista?.cnh || viagem.cnhMotorista),
      },
      veiculo: {
        placa: String(viagem.veiculo?.placa || viagem.placa || "").trim().toUpperCase(),
        modelo: String(viagem.veiculo?.modelo || viagem.modeloVeiculo || "").trim(),
        vagas: Number(viagem.veiculo?.vagas || viagem.veiculo?.capacidade || viagem.vagas || 0) || 10,
      },
      passageiros: (Array.isArray(viagem.passageiros) ? viagem.passageiros : []).map(p => ({
        nome: String(p.nome || "").trim(),
        cpf: String(p.cpf || "").trim(),
        telefone: String(p.telefone || "").trim(),
        localEmbarque: String(p.localEmbarque || p.embarque || "").trim(),
        destino: String(p.destino || viagem.destino || "").trim(),
        horarioChegada: normalizeTime(p.horarioChegada || p.chegada || p.horario || ""),
        tipoTrajeto: normalizeTripType(p.tipoTrajeto || p.trajeto || p.tipo || "ida_volta"),
        acompanhantes: (Array.isArray(p.acompanhantes) ? p.acompanhantes : []).map(a => ({
          nome: String(a.nome || a || "").trim(),
          cpf: String(a.cpf || "").trim(),
        })).filter(a => a.nome),
      })).filter(p => p.nome),
    })).filter(v => v.data && v.passageiros.length > 0),
  };
}

const prompt = `Voce e um extrator de dados de roteiros de transporte de saude municipal.
Leia o PDF inteiro, incluindo tabelas, cabecalhos e observacoes, e retorne APENAS JSON valido, sem markdown.

Estrutura obrigatoria:
{
  "viagens": [
    {
      "numeroViagem": "10065",
      "data": "2026-06-17",
      "horaSaida": "04:30",
      "destino": "Florianopolis - SC",
      "motorista": { "nome": "TIAGO BONETTI", "cnh": "04862851730" },
      "veiculo": { "placa": "SXD3A03", "modelo": "MASTER INOVA BUS", "vagas": 15 },
      "passageiros": [
        {
          "nome": "ROSELI JUNHES RAMOS",
          "cpf": "051.388.198-01",
          "telefone": "(48) 9186-1903",
          "localEmbarque": "ALFA",
          "destino": "HOSPITAL FLORIANOPOLIS",
          "horarioChegada": "07:00",
          "tipoTrajeto": "ida_volta",
          "acompanhantes": [{ "nome": "NOME DO ACOMPANHANTE", "cpf": "" }]
        }
      ]
    }
  ]
}

Regras:
- Extraia TODAS as viagens do PDF.
- Datas sempre em YYYY-MM-DD.
- Horarios sempre em HH:MM.
- tipoTrajeto deve ser exatamente: "ida_volta", "ida" ou "volta".
- Use "ida_volta" quando o roteiro indicar I/V, ida e volta, ou quando nao estiver claro.
- Use "ida" quando indicar somente ida/I.
- Use "volta" quando indicar somente volta/V.
- localEmbarque e o ponto onde o paciente embarca.
- destino do passageiro e o local de atendimento/desembarque, clinica, hospital ou cidade indicada para ele.
- Se houver acompanhantes marcados com +NOME, ACOMP, acompanhante ou linhas abaixo do paciente, coloque em acompanhantes.
- Se algum campo nao existir no PDF, use string vazia, mas nao invente pacientes.
- Retorne somente JSON valido.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo nao permitido." });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Configure a variavel ANTHROPIC_API_KEY no Vercel antes de importar roteiros." });
    return;
  }

  try {
    const { pdfBase64, fileName } = await readJsonBody(req);
    if (!pdfBase64) {
      res.status(400).json({ error: "Nenhum PDF foi enviado." });
      return;
    }

    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 6000,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            { type: "text", text: `${prompt}\n\nNome do arquivo: ${fileName || "roteiro.pdf"}` },
          ],
        }],
      }),
    });

    const anthropicData = await anthropicResp.json();
    if (!anthropicResp.ok) {
      const msg = anthropicData?.error?.message || "Erro ao consultar a IA.";
      res.status(anthropicResp.status).json({ error: msg });
      return;
    }

    const text = anthropicData.content?.find(block => block.type === "text")?.text || "";
    const json = normalizeResult(extractJson(text));

    if (!json.viagens.length) {
      res.status(422).json({ error: "Nao encontrei viagens no PDF. Confira se o arquivo e um roteiro legivel." });
      return;
    }

    res.status(200).json(json);
  } catch (error) {
    res.status(500).json({ error: error.message || "Erro inesperado ao importar roteiro." });
  }
}
