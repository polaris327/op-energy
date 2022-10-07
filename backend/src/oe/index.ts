import * as WebSocket from 'ws';
import { Express, Request, Response, NextFunction, Application } from 'express';
import chainStats from './chainstats';
import opEnergyRoutes from './api/routes';
import logger from '../logger';
import { BlockExtended, TransactionExtended, WebsocketResponse } from '../mempool.interfaces';
import blocks from '../api/blocks';

import opEnergyApiService from './api/op-energy.service';
import opEnergyWebsocket from './api/websocket';

class OpEnergyIndex {

  public async setUpHttpApiRoutes( app: Application) {
    opEnergyRoutes.setUpHttpApiRoutes( app);
    await opEnergyApiService.$persistOutcome( "init" );
  }

  public setUpWebsocketHandling( wss: WebSocket.Server) {
    opEnergyWebsocket.setUpWebsocketHandling( wss);
    blocks.setNewBlockCallback( this.handleNewBlock);
  }

  public async runMainUpdateLoop() {
    try {
      await chainStats.$updateChainstats();
    } catch (e) {
      logger.debug( '$updateChainstats error: ${( e instanceof Error ? e.message : e)}');
    }
  }

  async handleNewBlock( block: BlockExtended, txIds: string[], transactions: TransactionExtended[]) {
      await opEnergyApiService.$persistOutcome( "handleNewBlock callback");
  }

}

export default new OpEnergyIndex();
