import { Application, Request, Response } from 'express';
import config from '../../config';

import logger from '../../logger';
import * as express from 'express';

import websocketHandler from '../../api/websocket-handler';
import opEnergyApiService from './op-energy.service';
import opEnergyWebsocket from './websocket';
import opStatisticService from './op-statistics.service';

class OpEnergyRoutes {
  public setUpHttpApiRoutes(app) {
    logger.info(`setUpHttpApiRoutes`);
    opEnergyApiService.setNewTimeStrikeCallback(opEnergyWebsocket.handleNewTimeStrike);
    opEnergyApiService.setNewTimeSlowFastGuessCallback(opEnergyWebsocket.handleNewTimeSlowFastGuess);
    app
      .get(config.MEMPOOL.API_URL_PREFIX + 'strike/block/mediantime', this.$getTimeStrikesByBlock)
      .get(config.MEMPOOL.API_URL_PREFIX + 'strike/mediantime', this.$getTimeStrikes)
      .post(config.MEMPOOL.API_URL_PREFIX + 'strike/mediantime', this.$postTimeStrike)
      .get(config.MEMPOOL.API_URL_PREFIX + 'slowfastguess/mediantime', this.$getSlowFastGuesses)
      .post(config.MEMPOOL.API_URL_PREFIX + 'slowfastguess/mediantime', this.$postSlowFastGuess)
      .get(config.MEMPOOL.API_URL_PREFIX + 'strikeshistory/mediantime', this.$getTimeStrikesHistory)
      .get(config.MEMPOOL.API_URL_PREFIX + 'slowfastresults/mediantime', this.$getSlowFastResults)
      .post(config.MEMPOOL.API_URL_PREFIX + 'user/displayname', this.$postUserDisplayName)
      .get(config.MEMPOOL.API_URL_PREFIX + 'statistics/:blockheight/:span', this.$getBlockSpanStatistics)
   ;
  }
  private async $getTimeStrikes(req: Request, res: Response) {
    const UUID = await opEnergyApiService.$generateRandomHash();
    try {
      logger.info( `${UUID}: PROFILE: start: $getTimeStrikes`);
      const result = await opEnergyApiService.$getTimeStrikes( UUID);
      res.json( result.map( (blocksid) => {
        return blocksid.value;
      }));
    } catch(e) {
      logger.err( `ERROR: ${UUID}: OpEnergyApiService.$getTimeStrikes: ${e instanceof Error ? e.message: e}`);
      res.status(404).send(`${UUID}: ${e instanceof Error? e.message : e}`);
    }
    logger.info( `${UUID}: PROFILE: end: $getTimeStrikes`);
  }

  private async $postTimeStrike(req: Request, res: Response) {
    const UUID = await opEnergyApiService.$generateRandomHash();
    try {
      logger.info( `${UUID} PROFILE: start: $postTimeStrike`);
      if( typeof req.body.account_token !== "string") {
        throw new Error( 'ERROR: req.body.account_token is not a string');
      }
      if( typeof req.body.nlocktime !== "number") {
        throw new Error( 'ERROR: req.body.nlocktime is not a number');
      }
      if( typeof req.body.block_height !== "number" ) {
        throw new Error( 'ERROR: req.body.block_height is not a number');
      }

      const result = await opEnergyApiService.$addTimeStrike( UUID, opEnergyApiService.verifyAccountToken( req.body.account_token), opEnergyApiService.verifyBlockHeight( req.body.block_height), opEnergyApiService.verifyNLockTime(req.body.nlocktime));
      res.json( result.value);
    } catch(e) {
      logger.err( `ERROR: ${UUID}: OpEnergyApiService.$addTimeStrike: ${e instanceof Error ? e.message: e}`);
      res.status(404).send(`${UUID}: ${e instanceof Error? e.message : e}`);
    }
    logger.info( `${UUID}: PROFILE: end: $postTimeStrike`);
  }

  private async $getSlowFastGuesses(req: Request, res: Response) {
    const UUID = await opEnergyApiService.$generateRandomHash();
    try {
      logger.info( `${UUID}: PROFILE: start: $getSlowFastGuesses`);
      if( typeof req.query.nlocktime !== "string" || req.query.nlocktime.length < 1) {
        throw new Error( 'ERROR: req.query.nlocktime is missing');
      }
      if( typeof req.query.block_height !== "string" || req.query.block_height.length < 1) {
        throw new Error( 'ERROR: req.query.block_height is missing');
      }

      const result = await opEnergyApiService.$getSlowFastGuesses( UUID, opEnergyApiService.verifyBlockHeight( Number(req.query.block_height)), opEnergyApiService.verifyNLockTime( Number( req.query.nlocktime)));
      res.json( result);
    } catch(e) {
      logger.err( `ERROR: ${UUID}: OpEnergyApiService.$getSlowFastGuesses: ${e instanceof Error ? e.message: e}`);
      res.status(404).send(`${UUID}: ${e instanceof Error? e.message : e}`);
    }
    logger.info( `${UUID}: PROFILE: end: $getSlowFastGuesses`);
  }

  private async $postSlowFastGuess(req: Request, res: Response) {
    const UUID = await opEnergyApiService.$generateRandomHash();
    try {
      logger.info( `${UUID}: PROFILE: start: $postSlowFastGuess`);

      if( typeof req.body.account_token !== "string") {
        throw new Error( 'ERROR: req.body.account_token is not a string');
      }
      if( typeof req.body.guess !== "string") {
        throw new Error( 'ERROR: req.body.guess is not a string');
      }
      if( typeof req.body.nlocktime !== "number") {
        throw new Error( 'ERROR: req.body.nlocktime is not a number');
      }
      if( typeof req.body.block_height !== "number" ) {
        throw new Error( 'ERROR: req.body.block_height is not a number');
      }

      const result = await opEnergyApiService.$addSlowFastGuess( UUID, opEnergyApiService.verifyAccountToken( req.body.account_token), opEnergyApiService.verifyBlockHeight( req.body.block_height), opEnergyApiService.verifyNLockTime(req.body.nlocktime), opEnergyApiService.verifySlowFastGuessValue( req.body.guess));
      res.json( result);
    } catch(e) {
      logger.err( `ERROR: ${UUID}: OpEnergyApiService.$postSlowFastGuess: ${e instanceof Error ? e.message: e}`);
      res.status(404).send(`${UUID}: ${e instanceof Error? e.message : e}`);
    }
    logger.info( `${UUID}: PROFILE: end: $postSlowFastGuess`);
  }

  private async $postUserDisplayName(req: Request, res: Response) {
    const UUID = await opEnergyApiService.$generateRandomHash();
    try {
      logger.info( `${UUID}: PROFILE: start: $postUserDisplayName`);

      if( typeof req.body.account_token !== "string"  || req.body.account_token.length < 1) {
        throw new Error( 'ERROR: req.body.account_token is not a string');
      }
      if( typeof req.body.display_name !== "string" || req.body.display_name.length < 3) {
        throw new Error( 'ERROR: req.body.display_name is too short');
      }
      const result = await opEnergyApiService.$updateUserDisplayName( UUID, opEnergyApiService.verifyAccountToken( req.body.account_token), opEnergyApiService.verifyAlphaNum(req.body.display_name.slice(0,30)));
      res.json( result);
    } catch(e) {
      logger.err( `ERROR: ${UUID}: OpEnergyApiService.$postUserDisplayName: ${e instanceof Error ? e.message: e}`);
      res.status(404).send(`${UUID}: ${e instanceof Error? e.message : e}`);
    }
    logger.info( `${UUID}: PROFILE: end: $postUserDisplayName`);
  }
  private async $getTimeStrikesByBlock(req: Request, res: Response) {
    const UUID = await opEnergyApiService.$generateRandomHash();
    try {
      logger.info( `${UUID}: PROFILE: start: $getTimeStrikesByBlock`);
      if( typeof req.query.block_height !== "string" || req.query.block_height.length < 1) {
        throw new Error( 'ERROR: req.query.block_height is missing');
      }
      const result = await opEnergyApiService.$getTimeStrikesByBlock( UUID, opEnergyApiService.verifyBlockHeight( Number(req.query.block_height)));
      res.json( result.map( (blocksid) => {
        return blocksid.value;
      }));
    } catch(e) {
      logger.err( `ERROR: ${UUID}: OpEnergyApiService.$getTimeStrikesByBlock: ${e instanceof Error ? e.message: e}`);
      res.status(404).send(`${UUID}: ${e instanceof Error? e.message : e}`);
    }
    logger.info( `${UUID}: PROFILE: end: $getTimeStrikesByBlock`);
  }

  private async $getSlowFastResults(req: Request, res: Response) {
    const UUID = await opEnergyApiService.$generateRandomHash();
    try {
      logger.info( `${UUID}: PROFILE: start: $getSlowFastResults`);
      if( typeof req.query.account_token !== "string") {
        throw new Error( 'ERROR: req.query.account_token is not a string');
      }
      if( typeof req.query.nlocktime !== "string" || req.query.nlocktime.length < 1) {
        throw new Error( 'ERROR: req.query.nlocktime is missing');
      }
      if( typeof req.query.block_height !== "string" || req.query.block_height.length < 1) {
        throw new Error( 'ERROR: req.query.block_height is missing');
      }

      const result = await opEnergyApiService.$getSlowFastResult( UUID, opEnergyApiService.verifyAccountToken( req.query.account_token), opEnergyApiService.verifyBlockHeight( Number(req.query.block_height)), opEnergyApiService.verifyNLockTime( Number( req.query.nlocktime)));
      res.json( result);
    } catch(e) {
      logger.err( `ERROR: ${UUID}: OpEnergyApiService.$getSlowFastResults: ${e instanceof Error ? e.message: e}`);
      res.status(404).send(`${UUID}: ${e instanceof Error? e.message : e}`);
    }
    logger.info( `${UUID}: PROFILE: end: $getSlowFastResults`);
  }

  private async $getTimeStrikesHistory(req: Request, res: Response) {
    const UUID = await opEnergyApiService.$generateRandomHash();
    try {
      logger.info( `${UUID}: PROFILE: start: $getTimeStrikesHistory`);
      const result = await opEnergyApiService.$getTimeStrikesHistory( UUID);
      res.json( result);
    } catch(e) {
      logger.err( `ERROR: ${UUID}: OpEnergyApiService.$getTimeStrikesHistory: ${e instanceof Error ? e.message: e}`);
      res.status(404).send(`${UUID}: ${e instanceof Error? e.message : e}`);
    }
    logger.info( `${UUID}: PROFILE: end: $getTimeStrikesHistory`);
  }

  private async $getBlockSpanStatistics(req: Request, res: Response) {
    const UUID = await opEnergyApiService.$generateRandomHash();
    try {
      logger.info( `${UUID}: PROFILE: start: $getBlockSpanStatistics`);
      const { blockheight, span } = req.params;
      const statistics = await opStatisticService.calculateStatistics(opEnergyApiService.verifyBlockHeight(parseInt(blockheight)), parseInt(span));
      res.json(statistics);
    } catch(e) {
      logger.err( `ERROR: ${UUID}: OpEnergyApiService.$getBlockSpanStatistics: ${e instanceof Error ? e.message: e}`);
      res.status(404).send(`${UUID}: ${e instanceof Error? e.message : e}`);
    }
    logger.info( `${UUID}: PROFILE: end: $getBlockSpanStatistics`);
  }
};

export default new OpEnergyRoutes();
