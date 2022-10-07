import {Promise} from "bluebird";
import bitcoinApi from "../../api/bitcoin/bitcoin-api-factory";
import logger from "../../logger";
import {BlockHeight} from "./interfaces/op-energy.interface";

export class OpStatisticService {
  constructor() {}

  async calculateStatistics(blockHeight: BlockHeight, blockSpan: number) {
    const nbdrStatisticsList: number[] = [];
    try {
      await Promise.map(
        Array.from(Array(100).keys()),
        async (i) => {
          const startBlockHeight = blockHeight.value - i * blockSpan;
          const endBlockHeight = startBlockHeight - blockSpan + 1;
          try {
            const startblockHash = await bitcoinApi.$getBlockHash(
              startBlockHeight - blockSpan - i
            );
            const startBlock = await bitcoinApi.$getBlock(startblockHash);
            const endblockHash = await bitcoinApi.$getBlockHash(
              endBlockHeight - 1 - blockSpan - i
            );
            const endBlock = await bitcoinApi.$getBlock(endblockHash);
            const nbdr =
              (blockSpan * 600 * 100) /
              (startBlock.timestamp - endBlock.timestamp);

            nbdrStatisticsList.push(nbdr);
          } catch (error) {
            logger.err(`Error while calculating nbdr ${error}`);
            throw new Error("Error while calculating nbdr");
          }
        },
        {
          concurrency: 20,
        }
      );
      const length = nbdrStatisticsList.length;
      const mean = nbdrStatisticsList.reduce((a, b) => a + b) / length;
      return {
        nbdr: {
          avg: mean,
          stddev: Math.sqrt(
            nbdrStatisticsList
              .map((x) => Math.pow(x - mean, 2))
              .reduce((a, b) => a + b) /
              length -
              1
          ),
        },
      };
    } catch (error) {
      logger.err(`Error while calculating nbdr ${error}`);
      return {
        error: "Something went wrong",
        status: 500,
      };
    }
  }
}

export default new OpStatisticService();
