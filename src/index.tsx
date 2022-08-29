import {Buffer} from 'buffer';
import {
    connect,
    keyStores,
    transactions,
    WalletConnection,
} from 'near-api-js';
import type {Action as NearAction} from 'near-api-js/lib/transaction';
import {initApiControl} from '@roketo/sdk';
import type {TransactionMediator} from '@roketo/sdk/dist/types';

global.Buffer = Buffer;
const NEAR_CONSTANTS = {
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    networkId: 'testnet',
    roketoContractName: 'streaming-r-v2.dcversus.testnet',
    financeContractName: 'finance-r-v2.dcversus.testnet',
    wNearContractName: 'wnear.testnet',
};


let keyStore = new keyStores.BrowserLocalStorageKeyStore();
let walletConnection;
let account;
let transactionMediator;

declare const window: any;
declare const JsToDef: any;

// Anonymous function
let testLib = function () {
    console.log("testLib")
};


let initNear = function () {
    if (!window.game_sdk.near) {
        connect({
            nodeUrl: NEAR_CONSTANTS.nodeUrl,
            walletUrl: NEAR_CONSTANTS.walletUrl,
            networkId: NEAR_CONSTANTS.networkId,
            keyStore,
            headers: {},
        })
            .then(function (near) {
                window.game_sdk.near = near;
                JsToDef.send("NearInitSuccess");
                walletConnection = new WalletConnection(near, NEAR_CONSTANTS.roketoContractName);
                account = walletConnection.account();
                transactionMediator = {
                    functionCall: transactions.functionCall,
                    // @ts-expect-error signAndSendTransaction is protected
                    signAndSendTransaction: account.signAndSendTransaction,
                };
                JsToDef.send("NearInitWalletSuccess");
                return initApiControl({
                    account,
                    transactionMediator,
                    roketoContractName: NEAR_CONSTANTS.roketoContractName,
                });
            })
            .then(function (roketoApiControl) {
                window.game_sdk.roketoApiControl = roketoApiControl;
                JsToDef.send("NearInitRoketoApiControlSuccess");
            })
            .catch(function (error) {
                JsToDef.send("NearError", {error: error});
                console.error("near connect error:" + error);
            });
    } else {
        JsToDef.send("NearError", {error: "NearAlreadyInited"});
        console.error("near already existed")
    }

}

window.game_sdk = {
    initNear: initNear,
    testLib: testLib,
}