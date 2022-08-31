import {Buffer} from 'buffer';
import {
    connect,
    ConnectedWalletAccount, Contract,
    keyStores,
    transactions,
    WalletConnection,
} from 'near-api-js';
import type {Action as NearAction} from 'near-api-js/lib/transaction';
import {
    addFunds, calculateEndTimestamp,
    createStream,
    getOutgoingStreams,
    getStreamLeftPercent,
    initApiControl,
    isActiveStream
} from '@roketo/sdk';
import type {FTContract, TransactionMediator} from '@roketo/sdk/dist/types';

global.Buffer = Buffer;
const NEAR_CONSTANTS = {
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    networkId: 'testnet',
    roketoContractName: 'streaming-r-v2.dcversus.testnet',
    financeContractName: 'finance-r-v2.dcversus.testnet',
    wNearContractName: 'wrap.testnet',
    gameContractName: 'cryptoneonhex_d954mas.testnet',
    tokenAccountId: 'wrap.testnet',
};


let keyStore = new keyStores.BrowserLocalStorageKeyStore();
// @ts-ignore
let walletConnection: WalletConnection;
let account: ConnectedWalletAccount;
let transactionMediator: TransactionMediator;
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
                viewMethods: ["get_game", "get_games_active_list", "get_games_list"], // view methods do not change state but usually return a value
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
        return account.accountId ? account.accountId.toString() : "";
    }
    return "";
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

let contractCreateGame = function (firstPlayer: String, secondPlayer: String, fieldSize: Number) {
    console.log("contractCreateGame");
    // @ts-ignore
    gameContract.create_game(
        {
            first_player: firstPlayer,
            second_player: secondPlayer,
            field_size: fieldSize,
        },
        "300000000000000", // attached GAS (optional)
        "1000000000000000000000000" // attached deposit in yoctoNEAR (optional)
    ).then(function (game: any) {
        console.log(game)
        JsToDef.send("NearContractCreateGame", {game: game});
    }).catch(function (error: any) {
        JsToDef.send("NearContractError", {error: error});
    });
}

let contractGetGamesList = function (player: String) {
    // @ts-ignore
    gameContract.get_games_list(
        {
            player: player,
        }
    ).then(function (list: any) {
        console.log(list)
        JsToDef.send("NearContractGetGamesList", {list: list});
    }).catch(function (error: any) {
        JsToDef.send("NearContractError", {error: error});
    });
}

let contractGetGamesActiveList = function (player: String) {
    // @ts-ignore
    gameContract.get_games_active_list(
        {
            player: player,
        }
    ).then(function (list: any) {
        console.log(list)
        JsToDef.send("NearContractGetGamesActiveList", {list: list});
    }).catch(function (error: any) {
        JsToDef.send("NearContractError", {error: error});
    });
}

//return true if user have stream. Pay for be premium
let streamIsPremium = function () {
    getOutgoingStreams(
        {
            from: 0,
            limit: 1,
            contract: window.game_sdk.roketoApiControl.contract,
            accountId: account.accountId,
        }
    ).then(function (streams) {
        if (streams.length === 0) {
            JsToDef.send("NearStreamIsPremium", {premium: false});
        } else {
            let stream = streams[0];

            //     && stream.status == StreamStatus::Active
            //                 && stream.receiver_id == env::current_account_id()
            //                 && stream.available_to_withdraw() != stream.balance
            let premium = isActiveStream(stream) && getStreamLeftPercent(stream) < 0// активный и есть деньги?
            JsToDef.send("NearStreamIsPremium", {premium: premium});
        }
    }).catch(function (error) {
        JsToDef.send("NearStreamIsPremiumError", {error: error});
    })
}

//return create stream or add money to current stream
let streamBuyPremium = function () {
    //ЧТо за tokenContract
    //Что за tokenAccountId
    //Что за callbackUrl
    const tokenContract = new Contract(account, NEAR_CONSTANTS.tokenAccountId, {
        viewMethods: ['ft_balance_of', 'ft_metadata', 'storage_balance_of'],
        changeMethods: ['ft_transfer_call', 'storage_deposit', 'near_deposit'],
    }) as FTContract

    //if have stream add money for 24h
    getOutgoingStreams(
        {
            from: 0,
            limit: 1,
            contract: window.game_sdk.roketoApiControl.contract,
            accountId: account.accountId,
        }
    ).then(function (streams) {
        if (streams.length === 0) {
            //if no stream create it
            //buy premium for day
            JsToDef.send("NearStreamBuyPremiumCreateStream");
            return createStream({
                comment: 'buy premium',
                deposit: '240000000000000000000000',
                receiverId: NEAR_CONSTANTS.gameContractName,
                tokenAccountId: NEAR_CONSTANTS.tokenAccountId,
                commissionOnCreate: '100000000000000000000000',
                tokensPerSec: '2777777777777777777',
                delayed: false,
                isExpirable: false,
                isLocked: true,
                color: null,
                accountId: account.accountId,
                tokenContract: tokenContract,
                transactionMediator: transactionMediator,
                roketoContractName: NEAR_CONSTANTS.roketoContractName,
                wNearId: NEAR_CONSTANTS.wNearContractName,
                financeContractName: NEAR_CONSTANTS.financeContractName,
            });
        } else {
            JsToDef.send("NearStreamBuyPremiumAddFunds");
            return addFunds({
                amount: "240000000000000000000000",
                streamId: streams[0].id,
                callbackUrl: "",
                tokenAccountId: NEAR_CONSTANTS.tokenAccountId,
                transactionMediator: transactionMediator,
                roketoContractName: NEAR_CONSTANTS.roketoContractName,
                wNearId: NEAR_CONSTANTS.wNearContractName,
            })
        }
    }).then(function () {
        JsToDef.send("NearStreamBuyPremiumSuccess");
    }).catch(function (error) {
        JsToDef.send("NearStreamBuyPremiumError", {error: error});
    })

}

let streamCalculateEndTimestamp = function () {
    getOutgoingStreams(
        {
            from: 0,
            limit: 1,
            contract: window.game_sdk.roketoApiControl.contract,
            accountId: account.accountId,
        }
    ).then(function (streams) {
        if (streams.length === 0) {
            JsToDef.send("NearStreamCalculateEndTimestamp",{timestamp:0});
        } else {
            let timestamp = calculateEndTimestamp(streams[0])
            JsToDef.send("NearStreamCalculateEndTimestamp",{timestamp:timestamp});
        }
    }).catch(function (error) {
        JsToDef.send("NearStreamCalculateEndTimestampError",{error:error});
    })
}


window.game_sdk = {
    initNear: initNear,
    isLoggedIn: isLoggedIn,
    login: login,
    contractGetGame: contractGetGame,
    contractCreateGame: contractCreateGame,
    getAccountId: getAccountId,
    contractGetGamesList: contractGetGamesList,
    contractGetGamesActiveList: contractGetGamesActiveList,
    streamBuyPremium: streamBuyPremium,
    streamIsPremium: streamIsPremium,
    streamCalculateEndTimestamp: streamCalculateEndTimestamp
}