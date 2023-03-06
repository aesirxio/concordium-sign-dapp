# `AesirX Concordium-sign-dapp`

## Install

Run

```shell
yarn install
```

to install dependencies.

### Configure

1. Rename the `.env.dist` file to `.env`.
1. Replace variables in the `.env` file with your variables.
   1. `REACT_APP_TESTNET_GENESIS_BLOCK_HASH` replace this with your `Testnet Genesis Block Hash`
   2. `REACT_APP_TESTNET_JSON_RPC_URL` replace this with your `Testnet JSON-RPC URL`
   3. `REACT_APP_TESTNET_CCD_SCAN_BASE_URL` replace this with your `Testnet CCD Scan Base URL`
   4. `REACT_APP_MAINNET_GENESIS_BLOCK_HASH` replace this with your `Mainnet Genesis Block Hash`
   5. `REACT_APP_MAINNET_JSON_RPC_URL` replace this with your `Mainnet JSON-RPC URL`
   6. `REACT_APP_MAINNET_CCD_SCAN_BASE_URL` replace this with your `Mainnet CCD Scan Base URL`
   7. `REACT_APP_WALLET_CONNECT_PROJECT_ID` replace this with your `WalletConnect Project ID`

## Run

### `yarn dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `yarn build`

Get a full build and install it in your favorite web server.
