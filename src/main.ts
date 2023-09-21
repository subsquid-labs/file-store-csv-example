import * as erc20abi from './abi/erc20'
import {Database, LocalDest} from '@subsquid/file-store'
import {Column, Table, Types, dialects} from '@subsquid/file-store-csv'

import {processor, USDC_CONTRACT} from './processor'

const dbOptions = {
	tables: {
		TransfersTable: new Table(
			'transfers.tsv',
			{
				from: Column(Types.String()),
				to: Column(Types.String()),
				value: Column(Types.Numeric())
			},
			{
				dialect: dialects.excelTab,
				header: true
			}
		)
	},
	dest: new LocalDest('./data'),
	chunkSizeMb: 10,
	// Explicitly keeping the default value of syncIntervalBlocks (infinity).
	// Make sure to use a finite value here if your output data rate is low!
	// More details here:
	// https://docs.subsquid.io/store/file-store/overview/#filesystem-syncs-and-dataset-partitioning
	syncIntervalBlocks: undefined
}

processor.run(new Database(dbOptions), async (ctx) => {
	for (let block of ctx.blocks) {
		for (let log of block.logs) {
			if (log.address===USDC_CONTRACT && log.topics[0]===erc20abi.events.Transfer.topic) {
				let { from, to, value } = erc20abi.events.Transfer.decode(log)
				ctx.store.TransfersTable.write({ from, to, value })
			}
		}
	}
})
