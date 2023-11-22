import { SignClientTypes } from '@walletconnect/types';
import {
  BrowserWalletConnector,
  ephemeralConnectorType,
  WalletConnectConnector,
} from '@concordium/react-components';

const WALLET_CONNECT_PROJECT_ID = '76324905a70fe5c388bab46d3e0564dc';
const WALLET_CONNECT_OPTS: SignClientTypes.Options = {
  projectId: WALLET_CONNECT_PROJECT_ID,
  metadata: {
    name: 'AesirX',
    description: 'Example dApp for the performing an update on a contract.',
    url: '#',
    icons: ['https://walletconnect.com/walletconnect-logo.png'],
  },
};

export const BROWSER_WALLET = ephemeralConnectorType(BrowserWalletConnector.create);
export const WALLET_CONNECT = ephemeralConnectorType(
  WalletConnectConnector.create.bind(this, WALLET_CONNECT_OPTS)
);
