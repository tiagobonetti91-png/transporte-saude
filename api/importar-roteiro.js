import pdfParse from "pdf-parse";

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

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeDate(value) {
  const text = String(value || "");
  let match = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  match = text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b/);
  if (!match) return "";
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function normalizeTime(value) {
  const text = String(value || "").trim();
  const match = text.match(/\b([01]?\d|2[0-3])\s*[:hH]\s*([0-5]\d)\b/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function normalizeTripType(value) {
  const text = String(value || "").toLowerCase();
  if (/\b(somente\s+ida|ida|\bi\b)\b/.test(text) && !/volta|\bv\b/.test(text)) return "ida";
  if (/\b(somente\s+volta|volta|\bv\b)\b/.test(text) && !/ida|\bi\b/.test(text)) return "volta";
  return "ida_volta";
}

function findAfterLabel(text, labels) {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:=-]\\s*([^\\n|;]+)`, "i");
    const match = text.match(re);
    if (match) return cleanText(match[1]);
  }
  return "";
}

function findPlate(text) {
  const match = text.toUpperCase().match(/\b[A-Z]{3}[- ]?\d[A-Z0-9]\d{2}\b|\b[A-Z]{3}[- ]?\d{4}\b/);
  return match ? match[0].replace(/\s/g, "") : "";
}

function findCpf(text) {
  const match = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
  return match ? match[0] : "";
}

function findPhone(text) {
  const match = text.match(/(?:\(?\d{2}\)?\s*)?9?\d{4}[- ]?\d{4}/);
  return match ? match[0] : "";
}

function titleCaseName(value) {
  return cleanText(value)
    .replace(/^(paciente|nome|passageiro)\s*[:=-]\s*/i, "")
    .replace(/\b(CPF|RG|SUS|CARTAO|CARTÃO|FONE|TEL|TELEFONE)\b.*$/i, "")
    .replace(/[|;]+/g, " ")
    .trim();
}

function looksLikePatientLine(line) {
  const lower = line.toLowerCase();
  if (/motorista|veiculo|veículo|placa|roteiro|viagem|secretaria|municipal/.test(lower)) return false;
  if (findCpf(line) || normalizeTime(line)) return /[A-Za-zÀ-ÿ]{3,}\s+[A-Za-zÀ-ÿ]{3,}/.test(line);
  return false;
}

function parsePassenger(line, fallbackDestino) {
  const cpf = findCpf(line);
  const telefone = findPhone(line.replace(cpf, ""));
  const horarioChegada = normalizeTime(line);
  const tipoTrajeto = normalizeTripType(line);

  const destino = findAfterLabel(line, ["destino", "desembarque", "local atendimento", "clinica", "cl[ií]nica", "hospital"])
    || fallbackDestino;
  const localEmbarque = findAfterLabel(line, ["embarque", "local embarque", "ponto", "origem"]);

  let nome = line
    .replace(cpf, " ")
    .replace(telefone, " ")
    .replace(/\b([01]?\d|2[0-3])\s*[:hH]\s*([0-5]\d)\b/g, " ")
    .replace(/\b(I\/V|IDA\s+E\s+VOLTA|SOMENTE\s+IDA|SOMENTE\s+VOLTA|IDA|VOLTA)\b/ig, " ")
    .replace(/\b(destino|desembarque|local atendimento|clinica|clínica|hospital|embarque|local embarque|ponto|origem)\s*[:=-].*$/i, " ");

  const beforeCpf = cpf ? line.split(cpf)[0] : nome;
  if (beforeCpf && beforeCpf.length >= 5) nome = beforeCpf;

  const acompanhantes = [];
  const acompMatches = line.match(/(?:\+|acomp(?:anhante)?\.?\s*[:=-]?\s*)([A-ZÀ-Ú][A-ZÀ-Ú' ]{4,})/gi) || [];
  for (const item of acompMatches) {
    const acompNome = item.replace(/^\+|acomp(?:anhante)?\.?\s*[:=-]?\s*/i, "").trim();
    if (acompNome) acompanhantes.push({ nome: cleanText(acompNome), cpf: "" });
  }

  return {
    nome: titleCaseName(nome),
    cpf,
    telefone,
    localEmbarque,
    destino: cleanText(destino),
    horarioChegada,
    tipoTrajeto,
    acompanhantes,
  };
}

function splitTrips(text) {
  const matches = [...text.matchAll(/(?:^|\n)\s*(?:viagem|roteiro)\s*(?:n[ºo.]*)?\s*[:#-]?\s*(\d+)?/gi)];
  if (matches.length <= 1) return [text];

  return matches.map((match, index) => {
    const start = match.index || 0;
    const end = matches[index + 1]?.index || text.length;
    return text.slice(start, end);
  });
}

function parseTrip(block, index) {
  const lines = block.split(/\n+/).map(cleanText).filter(Boolean);
  const flat = lines.join("\n");
  const firstLine = lines[0] || "";

  const numeroMatch = firstLine.match(/(?:viagem|roteiro)\s*(?:n[ºo.]*)?\s*[:#-]?\s*(\d+)/i) || flat.match(/(?:viagem|roteiro)\s*(?:n[ºo.]*)?\s*[:#-]?\s*(\d+)/i);
  const destinoGeral = findAfterLabel(flat, ["destino", "cidade", "municipio", "munic[ií]pio"]);
  const motoristaNome = findAfterLabel(flat, ["motorista", "condutor"]);
  const cnh = onlyDigits(findAfterLabel(flat, ["cnh"]));
  const placa = findPlate(flat);
  const modelo = findAfterLabel(flat, ["veiculo", "veículo", "modelo"]).replace(placa, "").trim();
  const vagasMatch = flat.match(/\b(?:vagas|capacidade|lugares)\s*[:=-]?\s*(\d{1,2})\b/i);

  const passageiros = [];
  for (const line of lines) {
    if (!looksLikePatientLine(line)) continue;
    const passageiro = parsePassenger(line, destinoGeral);
    if (passageiro.nome && !passageiros.some(p => p.nome.toLowerCase() === passageiro.nome.toLowerCase() && p.cpf === passageiro.cpf)) {
      passageiros.push(passageiro);
    }
  }

  return {
    numeroViagem: numeroMatch?.[1] || String(index + 1),
    data: normalizeDate(flat),
    horaSaida: normalizeTime(findAfterLabel(flat, ["saida", "saída", "horario saida", "horário saída"]) || flat),
    destino: destinoGeral,
    motorista: { nome: motoristaNome, cnh },
    veiculo: { placa, modelo, vagas: Number(vagasMatch?.[1] || 10) },
    passageiros,
  };
}

function parseRoteiroText(text) {
  const normalized = String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length < 40) {
    throw new Error("Nao consegui extrair texto do PDF. Ele pode ser uma imagem escaneada; nesse caso e preciso OCR ou digitar/exportar o roteiro em PDF com texto selecionavel.");
  }

  const viagens = splitTrips(normalized)
    .map(parseTrip)
    .filter(v => v.data || v.motorista.nome || v.veiculo.placa || v.passageiros.length);

  if (!viagens.length || viagens.every(v => v.passageiros.length === 0)) {
    throw new Error("Li o PDF, mas nao consegui identificar os passageiros automaticamente. Envie um exemplo do roteiro para eu ajustar as regras do importador ao modelo do seu PDF.");
  }

  return { viagens };
}

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

  try {
    const { pdfBase64 } = await readJsonBody(req);
    if (!pdfBase64) {
      res.status(400).json({ error: "Nenhum PDF foi enviado." });
      return;
    }

    const buffer = Buffer.from(pdfBase64, "base64");
    const pdf = await pdfParse(buffer);
    const json = parseRoteiroText(pdf.text);

    res.status(200).json(json);
  } catch (error) {
    res.status(500).json({ error: error.message || "Erro inesperado ao importar roteiro." });
  }
}
