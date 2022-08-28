import { Buffer } from 'buffer';
import {
  connect,
  keyStores,
  transactions,
  WalletConnection,
} from 'near-api-js';
import type { Action as NearAction } from 'near-api-js/lib/transaction';
import { initApiControl } from '@roketo/sdk';
import type { TransactionMediator } from '@roketo/sdk/dist/types';

declare const window: any;

// Anonymous function
let testLib = function () {
  console.log("testLib")
};

window.game_sdk = {
	buffer : Buffer,
	testLib:testLib,
}