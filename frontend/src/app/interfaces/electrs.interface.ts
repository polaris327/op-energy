export interface Transaction {
  txid: string;
  version: number;
  locktime: number;
  size: number;
  weight: number;
  fee: number;
  vin: Vin[];
  vout: Vout[];
  status: Status;

  // Custom properties
  firstSeen?: number;
  feePerVsize?: number;
  effectiveFeePerVsize?: number;
  ancestors?: Ancestor[];
  bestDescendant?: BestDescendant | null;
  cpfpChecked?: boolean;
  deleteAfter?: number;
  _unblinded?: any;
  _deduced?: boolean;
}

interface Ancestor {
  txid: string;
  weight: number;
  fee: number;
}

interface BestDescendant {
  txid: string;
  weight: number;
  fee: number;
}

export interface Recent {
  txid: string;
  fee: number;
  vsize: number;
  value: number;
}

export interface Vin {
  txid: string;
  vout: number;
  is_coinbase: boolean;
  scriptsig: string;
  scriptsig_asm: string;
  inner_redeemscript_asm?: string;
  inner_witnessscript_asm?: string;
  sequence: any;
  witness?: string[];
  prevout: Vout;
  // Elements
  is_pegin?: boolean;
  issuance?: Issuance;
}

interface Issuance {
  asset_id: string;
  is_reissuance: string;
  asset_blinding_nonce: string;
  asset_entropy: string;
  contract_hash: string;
  assetamount?: number;
  assetamountcommitment?: string;
  tokenamount?: number;
  tokenamountcommitment?: string;
}

export interface Vout {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address: string;
  value: number;
  // Elements
  valuecommitment?: number;
  asset?: string;
  pegout?: Pegout;
}

interface Pegout {
  genesis_hash: string;
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_address: string;
}

export interface Status {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number;
}

export interface Block {
  id: string;
  height: number;
  version: number;
  timestamp: number;
  bits: number;
  nonce: number;
  difficulty: number;
  merkle_root: string;
  tx_count: number;
  size: number;
  weight: number;
  previousblockhash: string;
  chainwork: string;
  mediantime: number;

  // Custom properties
  medianFee?: number;
  feeRange?: number[];
  reward?: number;
  coinbaseTx?: Transaction;
  matchRate: number;
  stage: number;
}

export interface Address {
  electrum?: boolean;
  address: string;
  chain_stats: ChainStats;
  mempool_stats: MempoolStats;
}

export interface ChainStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

export interface MempoolStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

export interface Outspend {
  spent: boolean;
  txid: string;
  vin: number;
  status: Status;
}

export interface Asset {
  asset_id: string;
  issuance_txin: IssuanceTxin;
  issuance_prevout: IssuancePrevout;
  reissuance_token: string;
  contract_hash: string;
  status: Status;
  chain_stats: AssetStats;
  mempool_stats: AssetStats;
}

export interface AssetExtended extends Asset {
  name: string;
  ticker: string;
  precision: number;
  entity: Entity;
  version: number;
  issuer_pubkey: string;
}

export interface Entity {
  domain: string;
}

interface IssuanceTxin {
  txid: string;
  vin: number;
}

interface IssuancePrevout {
  txid: string;
  vout: number;
}

interface AssetStats {
  tx_count: number;
  issuance_count: number;
  issued_amount: number;
  burned_amount: number;
  has_blinded_issuances: boolean;
  reissuance_tokens: number;
  burned_reissuance_tokens: number;
  peg_in_count: number;
  peg_in_amount: number;
  peg_out_count: number;
  peg_out_amount: number;
  burn_count: number;
}
