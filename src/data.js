export const TODAY = "2026-03-02";

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
  concluida:   { label:"Concluída",    color:"#34d399", bg:"#052e1c" },
  cancelada:   { label:"Cancelada",    color:"#f87171", bg:"#2d0000" },
};
export const COMBUSTIVEIS = ["Gasolina","Etanol","Diesel","GNV","Elétrico"];
export const fmtDate = d => { if(!d) return ""; const [y,m,day]=d.split("-"); return `${day}/${m}/${y}`; };
export const fmtCurrency = v => "R$ "+Number(v||0).toFixed(2).replace(".",",").replace(/\B(?=(\d{3})+(?!\d))/g,".");

export const INIT_PACIENTES = [
  { id:1, nome:"Maria Aparecida Silva",  cpf:"123.456.789-00", telefone:"(67) 99123-4567", dataNasc:"1958-04-12" },
  { id:2, nome:"João Pedro Oliveira",    cpf:"234.567.890-11", telefone:"(67) 99234-5678", dataNasc:"1965-07-22" },
  { id:3, nome:"Ana Claudia Ferreira",   cpf:"345.678.901-22", telefone:"(67) 99345-6789", dataNasc:"1972-01-05" },
  { id:4, nome:"Carlos Eduardo Santos",  cpf:"456.789.012-33", telefone:"(67) 99456-7890", dataNasc:"1980-11-30" },
  { id:5, nome:"Luiza Helena Costa",     cpf:"567.890.123-44", telefone:"(67) 99567-8901", dataNasc:"1950-03-18" },
  { id:6, nome:"Antonio Jose Pereira",   cpf:"678.901.234-55", telefone:"(67) 99678-9012", dataNasc:"1945-09-01" },
  { id:7, nome:"Rosaria Batista Lima",   cpf:"789.012.345-66", telefone:"(67) 99789-0123", dataNasc:"1963-06-14" },
  { id:8, nome:"Francisco Alves Souza", cpf:"890.123.456-77", telefone:"(67) 99890-1234", dataNasc:"1975-12-08" },
];
export const INIT_DESTINOS = [
  { id:1, nome:"Hospital Regional de Campo Grande", cidade:"Campo Grande", especialidade:"Geral",        endereco:"Av. Ceara, 3253",          telefone:"(67) 3312-1000" },
  { id:2, nome:"HEMOSUL - Hemocentro",              cidade:"Campo Grande", especialidade:"Hematologia",  endereco:"Av. Fernando Correa, 1304", telefone:"(67) 3313-3700" },
  { id:3, nome:"FUNSAU - Clinica Nefrologia",       cidade:"Campo Grande", especialidade:"Nefrologia",   endereco:"Rua Ceara, 1702",           telefone:"(67) 3314-0800" },
  { id:4, nome:"Hospital do Cancer Alfredo Abrao",  cidade:"Campo Grande", especialidade:"Oncologia",    endereco:"Rua A. M. Coelho, 245",     telefone:"(67) 3329-9600" },
  { id:5, nome:"Santa Casa de Campo Grande",        cidade:"Campo Grande", especialidade:"Cardiologia",  endereco:"Rua General Mello, 1580",   telefone:"(67) 3322-4000" },
  { id:6, nome:"APAE Campo Grande",                 cidade:"Campo Grande", especialidade:"Reabilitacao", endereco:"Rua Taquarussu, 261",       telefone:"(67) 3387-7700" },
  { id:7, nome:"UDI Hospital",                      cidade:"Campo Grande", especialidade:"Ortopedia",    endereco:"Av. Mato Grosso, 1572",     telefone:"(67) 3041-7000" },
  { id:8, nome:"Clinica de Olhos Visao+",           cidade:"Campo Grande", especialidade:"Oftalmologia", endereco:"Rua 26 de Agosto, 503",     telefone:"(67) 3383-0000" },
];
export const INIT_MOTORISTAS = [
  { id:1, nome:"Roberto Mendes",      cnh:"12345678900", telefone:"(67) 99111-2222", categoriaCnh:"D" },
  { id:2, nome:"Paulo Henrique Dias", cnh:"98765432100", telefone:"(67) 99333-4444", categoriaCnh:"B" },
  { id:3, nome:"Sonia Maria Ramos",   cnh:"11122233344", telefone:"(67) 99555-6666", categoriaCnh:"D" },
];
export const INIT_VEICULOS = [
  { id:1, placa:"ABC-1234", modelo:"Fiat Doblo",         capacidade:5,  tipo:"Carro",       ano:2022, cor:"Branco", kmAtual:45200, combustivel:"Etanol",  consumoMedio:12 },
  { id:2, placa:"DEF-5678", modelo:"VW Spin",            capacidade:7,  tipo:"Van Pequena", ano:2021, cor:"Prata",  kmAtual:78300, combustivel:"Gasolina", consumoMedio:10 },
  { id:3, placa:"GHI-9012", modelo:"Mercedes Sprinter",  capacidade:15, tipo:"Van Grande",  ano:2023, cor:"Branco", kmAtual:32100, combustivel:"Diesel",   consumoMedio:9  },
  { id:4, placa:"JKL-3456", modelo:"Micro-onibus Volare",capacidade:21, tipo:"Micro-onibus",ano:2020, cor:"Branco", kmAtual:96500, combustivel:"Diesel",   consumoMedio:7  },
];
export const INIT_ADMINS = [
  { id:1, nome:"Secretaria Ana Paula", email:"ana@saude.gov.br", cargo:"Coordenadora" },
];
export const INIT_VIAGENS = [
  { id:1, data:"2026-03-02", horarioSaida:"05:30", veiculo:INIT_VEICULOS[1], motorista:INIT_MOTORISTAS[0],
    passageiros:[
      { id:1, paciente:INIT_PACIENTES[0], destino:INIT_DESTINOS[3], horarioChegada:"08:00", status:"embarcado",  assinatura:null },
      { id:2, paciente:INIT_PACIENTES[1], destino:INIT_DESTINOS[0], horarioChegada:"08:30", status:"indefinido", assinatura:null },
      { id:3, paciente:INIT_PACIENTES[2], destino:INIT_DESTINOS[1], horarioChegada:"07:45", status:"entregue",   assinatura:"data:image/png;base64,assinado" },
      { id:4, paciente:INIT_PACIENTES[3], destino:INIT_DESTINOS[4], horarioChegada:"09:00", status:"pronto",     assinatura:"data:image/png;base64,assinado" },
    ], status:"em_andamento", abastecimento:null },
  { id:2, data:"2026-03-04", horarioSaida:"06:00", veiculo:INIT_VEICULOS[0], motorista:INIT_MOTORISTAS[0],
    passageiros:[
      { id:5, paciente:INIT_PACIENTES[4], destino:INIT_DESTINOS[2], horarioChegada:"09:00", status:"indefinido", assinatura:null },
      { id:6, paciente:INIT_PACIENTES[5], destino:INIT_DESTINOS[5], horarioChegada:"09:30", status:"indefinido", assinatura:null },
    ], status:"agendada", abastecimento:null },
  { id:3, data:"2026-03-06", horarioSaida:"05:00", veiculo:INIT_VEICULOS[2], motorista:INIT_MOTORISTAS[0],
    passageiros:[
      { id:7, paciente:INIT_PACIENTES[6], destino:INIT_DESTINOS[6], horarioChegada:"07:30", status:"indefinido", assinatura:null },
    ], status:"agendada", abastecimento:null },
  { id:4, data:"2026-03-01", horarioSaida:"05:00", veiculo:INIT_VEICULOS[2], motorista:INIT_MOTORISTAS[0],
    passageiros:[
      { id:8, paciente:INIT_PACIENTES[6], destino:INIT_DESTINOS[6], horarioChegada:"07:30", status:"recolhido", assinatura:"data:image/png;base64,assinado" },
      { id:9, paciente:INIT_PACIENTES[7], destino:INIT_DESTINOS[7], horarioChegada:"08:00", status:"recolhido", assinatura:"data:image/png;base64,assinado" },
    ], status:"concluida", abastecimento:{ litros:45, valorLitro:5.89, kmInicial:31800, kmFinal:32100, combustivel:"Diesel", posto:"Posto BR Jardim", nota:"NF-1234" } },
  { id:5, data:"2026-02-28", horarioSaida:"05:30", veiculo:INIT_VEICULOS[1], motorista:INIT_MOTORISTAS[1],
    passageiros:[
      { id:10, paciente:INIT_PACIENTES[0], destino:INIT_DESTINOS[1], horarioChegada:"08:00", status:"recolhido", assinatura:"data:image/png;base64,assinado" },
      { id:11, paciente:INIT_PACIENTES[4], destino:INIT_DESTINOS[2], horarioChegada:"09:00", status:"ausente",   assinatura:null },
    ], status:"concluida", abastecimento:{ litros:30, valorLitro:5.79, kmInicial:78000, kmFinal:78300, combustivel:"Gasolina", posto:"Posto Shell Jardim", nota:"NF-1198" } },
];
export const INIT_ABASTECIMENTOS = [
  { id:1, data:"2026-03-01", viagemId:4, veiculoId:3, motorista:"Roberto Mendes", litros:45, valorLitro:5.89, total:265.05, kmInicial:31800, kmFinal:32100, combustivel:"Diesel", posto:"Posto BR Jardim", nota:"NF-1234" },
  { id:2, data:"2026-02-28", viagemId:5, veiculoId:2, motorista:"Paulo Henrique Dias", litros:30, valorLitro:5.79, total:173.70, kmInicial:78000, kmFinal:78300, combustivel:"Gasolina", posto:"Posto Shell Jardim", nota:"NF-1198" },
];
