import { useState } from 'react';
import * as XLSX from 'xlsx';

const T = {
  bgCard: '#ffffff', bgCard2: '#f8fafc', border: '#e5e7eb',
  text: '#111827', textSub: '#6b7280', textMuted: '#9ca3af',
  blue: '#1a56db', green: '#059669', purple: '#7c3aed', red: '#dc2626',
};

function Btn({ children, onClick, color = '#1a56db', disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '9px 18px', background: disabled ? '#d1d5db' : color, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.7 : 1, ...style }}>
      {children}
    </button>
  );
}

function norm(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function first(row, names) {
  const keys = Object.keys(row || {});
  for (const name of names) {
    const wanted = norm(name);
    const key = keys.find(k => norm(k) === wanted || norm(k).includes(wanted));
    if (key && row[key] !== undefined && row[key] !== null) return String(row[key]).trim();
  }
  return '';
}

function sheetRows(workbook, preferredNames) {
  const sheetName = workbook.SheetNames.find(n => preferredNames.some(p => norm(n).includes(norm(p)))) || workbook.SheetNames[0];
  if (!sheetName) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export default function ImportarCadastros({ onClose, db, apiPacientes, apiDestinos, mapPaciente, mapDestino, recarregar }) {
  const [etapa, setEtapa] = useState('upload');
  const [erroMsg, setErroMsg] = useState('');
  const [dados, setDados] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setErroMsg('');
    setResultado(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });

      const pacientesRows = sheetRows(workbook, ['pacientes', 'paciente']);
      const destinosRows = workbook.SheetNames.length > 1
        ? sheetRows({ ...workbook, SheetNames: workbook.SheetNames.slice(1) }, ['locais', 'destinos', 'clinicas'])
        : sheetRows(workbook, ['locais', 'destinos', 'clinicas']);

      const pacientes = dedupeBy(pacientesRows.map(r => ({
        nome: first(r, ['nome', 'paciente', 'nome paciente']).toUpperCase(),
        cpf: onlyDigits(first(r, ['cpf', 'cpf paciente'])),
        telefone: first(r, ['telefone', 'fone', 'celular']),
        dataNasc: first(r, ['data de nascimento', 'data nasc', 'nascimento']),
      })).filter(p => p.nome), p => p.cpf || norm(p.nome));

      const destinos = dedupeBy(destinosRows.map(r => ({
        nome: first(r, ['nome', 'destino', 'local', 'clinica', 'hospital']).toUpperCase(),
        cidade: first(r, ['cidade', 'municipio']),
        especialidade: first(r, ['especialidade']),
        endereco: first(r, ['endereco', 'endereço']),
        telefone: first(r, ['telefone', 'fone']),
      })).filter(d => d.nome), d => norm(d.nome));

      if (!pacientes.length && !destinos.length) throw new Error('Nao encontrei pacientes nem destinos na planilha. Confira os nomes das colunas.');

      const existentesCpf = new Set(db.pacientes.map(p => onlyDigits(p.cpf)).filter(Boolean));
      const existentesPacNome = new Set(db.pacientes.map(p => norm(p.nome)));
      const existentesDestNome = new Set(db.destinos.map(d => norm(d.nome)));

      const novosPacientes = pacientes.filter(p => p.cpf ? !existentesCpf.has(p.cpf) : !existentesPacNome.has(norm(p.nome)));
      const novosDestinos = destinos.filter(d => !existentesDestNome.has(norm(d.nome)));

      setDados({ pacientes, destinos, novosPacientes, novosDestinos });
      setEtapa('revisao');
    } catch (e) {
      setErroMsg('Erro: ' + e.message);
      setEtapa('upload');
    }
  }

  async function cadastrar() {
    if (!dados) return;
    setSalvando(true);
    setErroMsg('');
    let pacsCriados = 0;
    let destsCriados = 0;
    try {
      for (const p of dados.novosPacientes) {
        await apiPacientes.criar(p);
        pacsCriados++;
      }
      for (const d of dados.novosDestinos) {
        await apiDestinos.criar(d);
        destsCriados++;
      }
      await recarregar();
      setResultado({ pacsCriados, destsCriados });
      setEtapa('concluido');
    } catch (e) {
      setErroMsg('Erro ao cadastrar: ' + e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 500, padding: 20, overflowY: 'auto' }}>
      <div style={{ background: T.bgCard, borderRadius: 20, width: '100%', maxWidth: 760, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginTop: 20 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid ' + T.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Importar Cadastros</div>
            <div style={{ fontSize: 12, color: T.textSub }}>Cadastre pacientes e destinos a partir de uma planilha</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: T.textSub, cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ padding: 24 }}>
          {etapa === 'upload' && (
            <div>
              <div onClick={() => document.getElementById('cadastros-input').click()}
                style={{ border: '2px dashed ' + T.border, borderRadius: 14, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: T.bgCard2 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>XLS</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>Selecione a planilha de cadastros</div>
                <div style={{ fontSize: 13, color: T.textSub, marginBottom: 16 }}>Abas esperadas: Pacientes e Locais_Destinos</div>
                <Btn>Selecionar Planilha</Btn>
                <input id="cadastros-input" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])}/>
              </div>
              {erroMsg && <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: T.red }}>{erroMsg}</div>}
            </div>
          )}

          {etapa === 'revisao' && dados && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  ['Pacientes na planilha', dados.pacientes.length, T.blue],
                  ['Pacientes novos', dados.novosPacientes.length, T.green],
                  ['Destinos na planilha', dados.destinos.length, T.purple],
                  ['Destinos novos', dados.novosDestinos.length, T.green],
                ].map(([l, v, c]) => <div key={l} style={{ background: T.bgCard2, borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid ' + T.border }}><div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 10, color: T.textMuted }}>{l}</div></div>)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 360, overflowY: 'auto', marginBottom: 16 }}>
                <Preview title="Pacientes novos" items={dados.novosPacientes} render={p => `${p.nome} - ${p.cpf || 'sem CPF'}`}/>
                <Preview title="Destinos novos" items={dados.novosDestinos} render={d => `${d.nome}${d.cidade ? ' - ' + d.cidade : ''}`}/>
              </div>

              {erroMsg && <div style={{ marginBottom: 12, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: T.red }}>{erroMsg}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setEtapa('upload')} style={{ padding: '9px 18px', background: T.bgCard2, color: T.textSub, border: '1px solid ' + T.border, borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Trocar arquivo</button>
                <Btn onClick={cadastrar} disabled={salvando || (!dados.novosPacientes.length && !dados.novosDestinos.length)} color={T.green}>{salvando ? 'Cadastrando...' : 'Cadastrar novos'}</Btn>
              </div>
            </div>
          )}

          {etapa === 'concluido' && resultado && (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 8 }}>Importacao concluida</div>
              <div style={{ fontSize: 13, color: T.textSub, marginBottom: 20 }}>{resultado.pacsCriados} paciente(s) e {resultado.destsCriados} destino(s) cadastrados.</div>
              <Btn onClick={onClose}>Fechar</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Preview({ title, items, render }) {
  return (
    <div style={{ background: T.bgCard2, borderRadius: 12, border: '1px solid ' + T.border, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>{title} ({items.length})</div>
      {items.length === 0 ? <div style={{ fontSize: 12, color: T.textMuted }}>Nenhum novo cadastro</div> : items.slice(0, 12).map((item, i) => <div key={i} style={{ fontSize: 12, color: T.textSub, padding: '4px 0', borderBottom: i < Math.min(items.length, 12) - 1 ? '1px solid #e5e7eb' : 'none' }}>{render(item)}</div>)}
      {items.length > 12 && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8 }}>+{items.length - 12} outros</div>}
    </div>
  );
}