import {Buffer} from 'buffer';
import {
    connect,
    ConnectedWalletAccount, Contract,
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
    gameContractName: 'cryptoneonhex_d954mas.testnet',
};


let keyStore = new keyStores.BrowserLocalStorageKeyStore();
// @ts-ignore
let walletConnection: WalletConnection;
let account: ConnectedWalletAccount;
let transactionMediator;
let gameContract: Contract;

declare const window: any;
declare const JsToDef: any;


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
                initContract();
                JsToDef.send("NearInitRoketoApiControlSuccess");
            })
            .catch(function (error) {
                JsToDef.send("NearInitError", {error: error});
                console.error("near connect error:" + error);
            });
    } else {
        JsToDef.send("NearInitError", {error: "NearAlreadyInited"});
        console.error("near already existed")
    }

}

let initContract = function () {
    if (isLoggedIn() && !gameContract) {
        gameContract = new Contract(
            account, // the account object that is connecting
            NEAR_CONSTANTS.gameContractName,
            {
                viewMethods: ["get_game"], // view methods do not change state but usually return a value
                changeMethods: ["create_game"], // change methods modify state
            }
        );
    }
}

let isLoggedIn = function () {
    if (account) {
        return !!account.accountId;
    }
    return false
}

let getAccountId = function () {
    if (account) {
        return account.accountId ? account.accountId.toString() : null ;
    }
    return null;
}

let login = function () {
    if (isLoggedIn()) {
        JsToDef.send("NearLoginAlready");
    } else {
        walletConnection.requestSignIn(NEAR_CONSTANTS.roketoContractName, 'CryptoNeon Hex').then(function () {
                JsToDef.send("NearLoginSuccess");
                initContract();
            }
        ).catch(function () {
            JsToDef.send("NearLoginFail");
        });
    }
}

let contractGetGame = function (idx: Number) {
    console.log("contractGetGame");
    console.log(idx);
    // @ts-ignore
    gameContract.get_game(
        {
            index: idx,
        },
    ).then(function (game: any) {
        console.log(game)
        JsToDef.send("NearContractGetGame", {game: game});
    }).catch(function (error: any) {
        JsToDef.send("NearContractError", {error: error});
    });
}

let contractCreateGame = function (firstPlayer: String, secondPlayer:String, fieldSize:Number) {
    console.log("contractCreateGame");
    // @ts-ignore
    gameContract.create_game(
        {
            first_player: firstPlayer,
            second_player: secondPlayer,
            field_size: fieldSize,
        },
    ).then(function (game: any) {
        console.log(game)
        JsToDef.send("NearContractCreateGame", {game: game});
    }).catch(function (error: any) {
        JsToDef.send("NearContractError", {error: error});
    });
}

window.game_sdk = {
    initNear: initNear,
    isLoggedIn: isLoggedIn,
    login: login,
    contractGetGame: contractGetGame,
    contractCreateGame: contractCreateGame,
    getAccountId: getAccountId,
}