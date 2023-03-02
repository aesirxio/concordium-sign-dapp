import { SignClientTypes } from '@walletconnect/types';
import {
  BrowserWalletConnector,
  Network,
  ephemeralConnectorType,
  WalletConnectConnector,
} from '@concordium/react-components';
import { env } from './env';

const TESTNET_GENESIS_BLOCK_HASH = env.REACT_APP_TESTNET_GENESIS_BLOCK_HASH;
const MAINNET_GENESIS_BLOCK_HASH = env.REACT_APP_MAINNET_GENESIS_BLOCK_HASH;

export const TESTNET: Network = {
  name: 'testnet',
  genesisHash: TESTNET_GENESIS_BLOCK_HASH,
  jsonRpcUrl: env.REACT_APP_TESTNET_JSON_RPC_URL,
  ccdScanBaseUrl: env.REACT_APP_TESTNET_CCD_SCAN_BASE_URL,
};
export const MAINNET: Network = {
  name: 'mainnet',
  genesisHash: MAINNET_GENESIS_BLOCK_HASH,
  jsonRpcUrl: env.REACT_APP_MAINNET_JSON_RPC_URL,
  ccdScanBaseUrl: env.REACT_APP_MAINNET_CCD_SCAN_BASE_URL,
};

const WALLET_CONNECT_PROJECT_ID = env.REACT_APP_WALLET_CONNECT_PROJECT_ID;
const WALLET_CONNECT_OPTS: SignClientTypes.Options = {
  projectId: WALLET_CONNECT_PROJECT_ID,
  metadata: {
    name: 'AesirX Contract Update',
    description: 'AesirX dApp update on a contract.',
    url: '#',
    icons: ['https://walletconnect.com/walletconnect-logo.png'],
  },
};

export const BROWSER_WALLET = ephemeralConnectorType(BrowserWalletConnector.create);
export const WALLET_CONNECT = ephemeralConnectorType(
  WalletConnectConnector.create.bind(this, WALLET_CONNECT_OPTS)
);
