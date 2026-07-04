export type DirecaoInicial = 'C' | 'V';
export type TipoOpcao = 'CALL' | 'PUT';
export type StatusOperacao = 'aberta' | 'encerrada';

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
}
