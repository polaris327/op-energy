import config from './config';
import bitcoinApi from './api/bitcoin/bitcoin-api-factory';
import logger from './logger';
import { IBitcoinApi } from './api/bitcoin/bitcoin-api.interface';
import bitcoinClient from './api/bitcoin/bitcoin-client';
import blocks from './api/blocks';

import { DB } from './database';

interface IChainStat {
  blockHeight: number;
  chainRevenue: number;
  chainFee: number;
  chainSubsidy: number;
  chainWork: string;
}

const defaultChainStat: IChainStat = {
  'blockHeight': 0,
  'chainRevenue': 0.0,
  'chainFee': 0.0,
  'chainSubsidy': 0.0,
  'chainWork': "0",
};

class Chainstats {

  constructor() {
  }

  private async $insertChainStat( chainstat: IChainStat) {
    try {
      const connection = await DB.pool.getConnection();
      const query = 'INSERT INTO chainstats (block_height, chain_revenue, chain_fee, chain_subsidy, chainwork) VALUES(?, ?, ?, ?, ?)';
      const [result] = await connection.query<any>(query, [chainstat.blockHeight, chainstat.chainRevenue, chainstat.chainFee, chainstat.chainSubsidy, chainstat.chainWork]);
      connection.release();
    } catch(e) {
      logger.err( '$insertChainStat error ${( e instanceof Error ? e.message : e)}');
    }
  }
  private async $getLastChainStat(): Promise< IChainStat | undefined> {
    try {
      const connection = await DB.pool.getConnection();
      const query = 'SELECT block_height,chain_revenue,chain_fee, chain_subsidy, chainwork from chainstats order by block_height desc limit 1';
      const [rows] = await connection.query<any>(query, []);
      connection.release();
      if( rows[0] != undefined) {
        return {
          'blockHeight': rows[0].block_height,
          'chainRevenue': rows[0].chain_revenue,
          'chainFee': rows[0].chain_fee,
          'chainSubsidy': rows[0].chain_subsidy,
          'chainWork': rows[0].chainwork,
        };
      }
    } catch(e) {
      logger.err( '$getKastChainStat() error: ${(e instanceof Error? e.message : e)}' );
    }
  }

  public async $updateChainstats() {
    logger.debug('Updating chainstats');
    const mlastChainStat = await this.$getLastChainStat();
    var lastChainStat: IChainStat = defaultChainStat;
    if (mlastChainStat !== undefined) {
      lastChainStat = mlastChainStat;
    }
    const currentBlockHeight = blocks.getCurrentBlockHeight();
    if (lastChainStat.blockHeight < currentBlockHeight) {
      const nextChainStatEnd = Math.min( lastChainStat.blockHeight + config.MEMPOOL.CHAINSTAT_BATCH_SIZE, currentBlockHeight);
      for( var blockHeight = lastChainStat.blockHeight + 1; blockHeight <= nextChainStatEnd; blockHeight++) {
        const blockHash = await bitcoinApi.$getBlockHash( blockHeight);
        const block = await bitcoinApi.$getBlock( blockHash);
        const blockStats = await bitcoinApi.$getBlockStats( blockHash);
        const blockFee = blockStats.totalfee;
        if( Number.MAX_VALUE - lastChainStat.chainFee < blockFee) {
          throw new Error("Number.MAX_VALUE - lastChainStat.chainFee < blockFee"); // integer overflow check
        }
        const newChainFee = lastChainStat.chainFee + blockFee;
        if( Number.MAX_VALUE - lastChainStat.chainSubsidy < blockStats.subsidy) {
          throw new Error( "Number.MAX_VALUE - lastChainStat.chainSubsidy < blockStats.subsidy" ); // integer overflow check
        }
        const newChainSubsidy = lastChainStat.chainSubsidy + blockStats.subsidy;
        if( Number.MAX_VALUE - lastChainStat.chainRevenue < blockStats.subsidy) {
          throw new Error( "Number.MAX_VALUE - lastChainStat.chainRevenue < blockStats.subsidy" ); // integer overflow check
        }
        const newChainRevenue = lastChainStat.chainRevenue + blockStats.subsidy + blockFee;
        var nextChainStat:IChainStat = { 'blockHeight': blockHeight, 'chainRevenue': newChainRevenue, 'chainSubsidy': newChainSubsidy, 'chainFee': newChainFee, 'chainWork': block.chainwork};
        await this.$insertChainStat( nextChainStat );
        lastChainStat = nextChainStat;
      }
    }
  }
  
}

export default new Chainstats();
