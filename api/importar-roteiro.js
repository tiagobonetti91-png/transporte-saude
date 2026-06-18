import pdfParse from "pdf-parse";

const MAX_BODY_BYTES = 25 * 1024 * 1024;
const DATE_RE = "\\d{2}\\/\\d{2}\\/20\\d{2}";
const TIME_RE = "(?:[01]?\\d|2[0-3])[:hH][0-5]\\d";

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
  const text = String(value || "").toUpperCase().replace(/\s+/g, "");
  if (text === "I") return "ida";
  if (text === "V") return "volta";
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

function removeAccents(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findPlate(text) {
  const match = text.toUpperCase().match(/\b[A-Z]{3}[- ]?\d[A-Z0-9]\d{2}\b|\b[A-Z]{3}[- ]?\d{4}\b/);
  return match ? match[0].replace(/\s/g, "") : "";
}

function findPhone(text) {
  const match = text.match(/\(?\d{2}\)?\s*9?\d{4,5}[- ]?\d{4}/);
  return match ? match[0] : "";
}

function splitTrips(text) {
  const patterns = [
    /Secretaria Municipal[\s\S]*?(?:Número|Numero|NÃºmero) da Viagem[\s\S]{0,80}?(\d{4,6})/gi,
    /Roteiro da Viagem[\s\S]{0,350}?(\d{4,6})/gi,
    /(?:^|\n)\s*(\d{4,6})\s*(?=\n)/g,
  ];

  let matches = [];
  for (const re of patterns) {
    matches = [...text.matchAll(re)];
    if (matches.length > 1) break;
  }

  if (matches.length <= 1) return [text];

  return matches.map((match, index) => {
    const start = match.index || 0;
    const end = matches[index + 1]?.index || text.length;
    return text.slice(start, end);
  });
}

function getHeaderValue(block, regex, fallback = "") {
  const match = block.match(regex);
  return match ? cleanText(match[1]) : fallback;
}

function parseDestinoPart(part) {
  const raw = cleanText(part);
  if (!raw) return { localEmbarque: "", destino: "" };

  const knownStarts = [
    "ANITAPOLIS", "ANITÁPOLIS", "ALFA", "ANGELO CARARA", "ESP PORTAL", "ESP RIO DOS PINHEIROS",
    "ESP RIO DOS", "EMILIA GUIMARAES", "ANTONIO DAVID", "EM CASA", "HRSJ", "RIO ALFA", "ANA SCHMIDT", "ANA SCHIMTZ"
  ];

  const normalized = removeAccents(raw).toUpperCase();
  for (const start of knownStarts.sort((a, b) => b.length - a.length)) {
    const normStart = removeAccents(start).toUpperCase();
    if (normalized === normStart) return { localEmbarque: raw, destino: "" };
    if (normalized.startsWith(normStart + " ")) {
      return {
        localEmbarque: cleanText(raw.slice(0, start.length)),
        destino: cleanText(raw.slice(start.length)),
      };
    }
  }

  const parts = raw.split(" ");
  if (parts.length <= 1) return { localEmbarque: raw, destino: "" };
  return { localEmbarque: parts[0], destino: parts.slice(1).join(" ") };
}

function parsePassengerLine(line, fallbackDestino) {
  const re = new RegExp(`^\\+?(.+?)\\s+(\\d{11}|\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2})\\s*(\\(?\\d{2}\\)?\\s*9?\\d{4,5}[- ]?\\d{4})?\\s+(I\\s*\\/\\s*V|I|V)\\s+(.+?)\\s+(${DATE_RE})\\s+(${TIME_RE})\\b`, "i");
  const match = cleanText(line).match(re);
  if (!match) return null;

  const destinoInfo = parseDestinoPart(match[5]);
  return {
    nome: cleanText(match[1]),
    cpf: match[2],
    telefone: cleanText(match[3] || ""),
    localEmbarque: destinoInfo.localEmbarque,
    destino: destinoInfo.destino || fallbackDestino,
    horarioChegada: normalizeTime(match[7]),
    tipoTrajeto: normalizeTripType(match[4]),
    acompanhantes: [],
  };
}

function parseCompanionLine(line) {
  const text = cleanText(line).replace(/^\+\s*/, "");
  const withCpf = text.match(/^(.+?)\s+(\d{11}|\d{3}\.?\d{3}\.?\d{3}-?\d{2})\s*(\(?\d{2}\)?\s*9?\d{4,5}[- ]?\d{4})?/i);
  if (withCpf) {
    return {
      nome: cleanText(withCpf[1]),
      cpf: withCpf[2],
      telefone: cleanText(withCpf[3] || ""),
    };
  }

  const match = text.match(/^(.+?)(?:\s+(?:I\s*\/\s*V|I|V)\b|\s+E\s+ACOMPANHANTE|\s+É\s+ACOMPANHANTE|$)/i);
  const nome = cleanText(match?.[1] || "ACOMPANHANTE");
  return { nome, cpf: "", telefone: "" };
}

function joinWrappedLines(lines) {
  const joined = [];
  for (const line of lines) {
    const current = cleanText(line);
    if (!current) continue;

    const isContinuation = !current.startsWith("+") && !current.match(/^\+?[A-ZÀ-Ú][A-ZÀ-Ú' ]+\s+\d{11}\b/) &&
      !/^OBS\b/i.test(current) &&
      !/^(Relatorio|Relatório|rangsaude|terça|segunda|quarta|quinta|sexta|sábado|domingo)/i.test(current) &&
      joined.length > 0;

    if (isContinuation) joined[joined.length - 1] = `${joined[joined.length - 1]} ${current}`;
    else joined.push(current);
  }
  return joined;
}

function extractPassengerRecords(text) {
  const source = cleanText(text)
    .replace(/\s+OBS\s*:/gi, " OBS: ")
    .replace(/\s+Relat[oó]rio gerado[\s\S]*$/i, "");

  const rowRe = new RegExp(`\\+?[A-ZÀ-Ú][A-ZÀ-Ú' ]{2,}?\\s+\\d{11}\\s*(?:\\(?\\d{2}\\)?\\s*9?\\d{4,5}[- ]?\\d{4})?\\s+(?:I\\s*\\/\\s*V|I|V)\\s+.*?\\s+${DATE_RE}\\s+${TIME_RE}`, "gi");
  return source.match(rowRe) || [];
}

function parsePassengersFromText(tableText, fallbackDestino) {
  const passageiros = [];
  const records = extractPassengerRecords(tableText);

  for (const record of records) {
    if (record.trim().startsWith("+")) {
      if (passageiros.length) passageiros[passageiros.length - 1].acompanhantes.push(parseCompanionLine(record));
      continue;
    }

    const passageiro = parsePassengerLine(record, fallbackDestino);
    if (passageiro) passageiros.push(passageiro);
  }

  return passageiros;
}
function parseTrip(block, index) {
  const numeroMatch = block.match(/(?:^|\n)\s*(\d{4,6})\s*(?=\n)/);
  const destinoGeral = getHeaderValue(block, /Destino:\s*(.+?)\s+Objetivo/i);
  const veiculoFull = getHeaderValue(block, /Ve[ií]culo:\s*(.+?)\s+Data Sa[ií]da:/i);
  const placa = findPlate(veiculoFull);
  const modelo = cleanText(veiculoFull.replace(placa, "").replace(/^[-\s]+/, ""));
  const data = normalizeDate(getHeaderValue(block, /Data Sa[ií]da:\s*([^\n]+?)(?:\s+Data|\n)/i, block));
  const horaSaida = normalizeTime(getHeaderValue(block, /Hora Sa[ií]da:\s*([^\n]+?)(?:\s+Hora|\n)/i, block));
  const motoristaNome = getHeaderValue(block, /Motorist\w*\s+(.+?)\s+Hora Sa[ií]da:/i);
  const cnh = getHeaderValue(block, /Cnh:\s*(\d+)/i);
  const vagasMatch = block.match(/Vagas:\s*(\d+)/i);

  const tableStart = block.search(/PASSAGEIRO\s+Assinatura/i);
  const tableText = tableStart >= 0 ? block.slice(tableStart).replace(/^.*PASSAGEIRO.*DATA\/HORA/i, "") : block;
  const rawLines = tableText.split(/\n+/).map(cleanText).filter(Boolean);
  const lines = joinWrappedLines(rawLines);
  let passageiros = [];

  for (const line of lines) {
    if (/^OBS\b/i.test(line)) continue;
    if (/^(Relatorio|Relatório|rangsaude|terça|segunda|quarta|quinta|sexta|sábado|domingo)/i.test(line)) continue;

    if (line.startsWith("+")) {
      if (passageiros.length) passageiros[passageiros.length - 1].acompanhantes.push(parseCompanionLine(line));
      continue;
    }

    const passageiro = parsePassengerLine(line, destinoGeral);
    if (passageiro) passageiros.push(passageiro);
  }

  if (!passageiros.length) passageiros = parsePassengersFromText(tableText, destinoGeral);
  return {
    numeroViagem: numeroMatch?.[1] || String(index + 1),
    data,
    horaSaida,
    destino: destinoGeral,
    motorista: { nome: motoristaNome, cnh },
    veiculo: { placa, modelo, vagas: Number(vagasMatch?.[1] || 10) },
    passageiros,
  };
}

function makeTextSample(text) {
  return cleanText(text)
    .slice(0, 900)
    .replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, "***CPF***")
    .replace(/\(?\d{2}\)?\s*9?\d{4,5}[- ]?\d{4}/g, "***TEL***");
}
function parseRoteiroText(text) {
  const normalized = String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length < 40) {
    throw new Error("Nao consegui extrair texto do PDF. Ele pode ser uma imagem escaneada; nesse caso e preciso OCR ou exportar o roteiro em PDF com texto selecionavel.");
  }

  const viagens = splitTrips(normalized)
    .map(parseTrip)
    .filter(v => v.data && v.passageiros.length);

  if (!viagens.length) {
    throw new Error(`Li o PDF, mas nao consegui identificar os passageiros automaticamente. Amostra do texto lido: ${makeTextSample(normalized)}`);
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
    const json = parseRoteiroText(pdf.text || "");

    res.status(200).json(json);
  } catch (error) {
    res.status(500).json({ error: error.message || "Erro inesperado ao importar roteiro." });
  }
}