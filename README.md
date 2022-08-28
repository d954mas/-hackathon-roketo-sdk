# Feed-a-cat Roketo SDK sample

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and using [@roketo/sdk@0.2.8 package](https://www.npmjs.com/package/@roketo/sdk/v/0.2.8) for demonstration purposes. Please note that Roketo SDK doesn't require React and can be integrated even in Node.js backend code.

## How to feed the cat

The cat operates in `testnet` NEAR network and wants to be fed with custom `fish.lebedev.testnet` NEP-141 compatible Fungible Token.

In order to get these tokens, do the following:

1. Install `near-cli` using [this guide](https://docs.near.org/tools/near-cli);
2. Add storage deposit for your account in FISH FT contract by executing the following command, while replacing `YOUR_ACCOUNT_HERE` placeholder with your account id (one-time operation):

```shell
near call fish.lebedev.testnet storage_deposit '{"account_id":"YOUR_ACCOUNT_HERE","registration_only":true}' --accountId YOUR_ACCOUNT_HERE --deposit 0.00125
```

3. Mint as many FISH tokens as you want  by executing the following command, while replacing `YOUR_ACCOUNT_HERE` and `AMOUNT` placeholder with your account id and the number of tokens you want to mint (note that the `amount` is specified as a string):

```shell
near call fish.lebedev.testnet mint '{"account_id":"YOUR_ACCOUNT_HERE","amount":"AMOUNT"}' --accountId YOUR_ACCOUNT_HERE --deposit 0.00125
```

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

## Roketo SDK documentation

This sample uses [Roketo SDK documentation](https://docs.roke.to/docs/tutorial-basics/sdk) for version 0.2.8 of SDK at the moment. With any updates to SDK the documentation and this sample will be updated as well.
