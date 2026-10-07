export type DirecaoInicial = 'C' | 'V';
export type TipoOpcao = 'CALL' | 'PUT';
export type StatusOperacao = 'aberta' | 'encerrada';

export type TipoEvento = 'abertura' | 'aumento' | 'rolagem' | 'edicao' | 'encerramento' | 'divisao';

export interface EventoOperacao {
  id: string;
  tipo: TipoEvento;
  data: string;
  detalhes: string;
  quantidade?: number;
  preco?: number;
  strike?: number;
  vencimento?: string;
  
  // For rollover
  strikeAnterior?: number;
  strikeNovo?: number;
  quantidadeAnterior?: number;
  quantidadeNova?: number;
  precoRecompra?: number;
  precoVendaNova?: number;
  novoVencimento?: string;
  premioLiquidoDaRolagem?: number;
  novoAtivo?: string;
  ativoAnterior?: string;

  // For division
  proporcao?: number;
  ehNovaOperacao?: boolean;
  quantidadeOriginalAntes?: number;
}

export interface Rolagem {
  data: string;
  strikeAnterior: number;
  strikeNovo: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  precoRecompra: number;
  precoVendaNova: number;
  novoVencimento: string;
  premioLiquidoDaRolagem: number;
  precoMedioNovoCalculado: number;
  novoAtivo?: string;
}

export interface Operacao {
  id: string;
  ativo: string;
  tipoOpcao: TipoOpcao;
  direcaoInicial: DirecaoInicial;
  strikeInicial: number;
  quantidadeInicial: number;
  precoMedioOriginal: number;
  dataAbertura: string;
  vencimentoAtual: string;
  status: StatusOperacao;
  premioLiquidoAcumulado: number;
  quantidadeAtual: number;
  strikeAtual: number;
  precoMedioAtual: number;
  historicoRolagens: Rolagem[];
  dataEncerramento: string | null;
  precoEncerramento: number | null;
  resultadoFinal: number | null;
  historicoEventos?: EventoOperacao[];
  valorVinculadoDivida?: number | null;
  dividaVinculadaId?: string | null;
  valorContadoComoResultadoOpcoes?: number | null;
  grupoEstrategia?: string | null;
}

export type StatusDivida = 'aberta' | 'quitada';
export type TipoHistoricoDivida = 'juro' | 'amortizacao' | 'ajusteManual' | 'incremento';

export interface ItemHistoricoDivida {
  id: string;
  data: string;
  tipo: TipoHistoricoDivida;
  valor: number;
  saldoResultante: number;
  operacaoVinculadaId?: string | null;
  observacao?: string;
  ehCriacaoOrigem?: boolean;
}

export interface Divida {
  id: string;
  nome: string;
  descricao?: string;
  saldoInicial: number;
  saldoAtual: number;
  dataInicio: string;
  taxaJurosMensalPercent: number;
  status: StatusDivida;
  historico: ItemHistoricoDivida[];
}

export interface BackupCompletoData {
  versao?: number;
  dataExportacao?: string;
  operacoes: Operacao[];
  dividas?: Divida[];
}

