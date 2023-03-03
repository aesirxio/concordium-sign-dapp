import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Container, Row, Spinner } from 'react-bootstrap';
import { useWalletConnectorSelector, withJsonRpcClient } from '@concordium/react-components';
import { WalletConnectionProps, WithWalletConnector } from '@concordium/react-components';
import { ConnectedAccount } from './components/ConnectedAccount';
import { NetworkSelector } from './NetworkSelector';
import { BROWSER_WALLET, MAINNET, TESTNET } from './config';
import { errorString } from './util';
import { useConnection } from '@concordium/react-components';
import { useConnect } from '@concordium/react-components';
import './scss/app.scss';
export default function App() {
  const [network, setNetwork] = useState(TESTNET);
  return (
    <Container>
      <div className="minh-100vh d-flex flex-wrap align-items-center">
        <div className="w-100">
          <h1 className="mb-3 text-center">AesirX Concordium Sign dApp</h1>
          <div className="text-center">
            <NetworkSelector selected={network} options={[TESTNET, MAINNET]} select={setNetwork} />
          </div>
          <WithWalletConnector network={network}>
            {(props) => <Main {...props} />}
          </WithWalletConnector>
        </div>
      </div>
    </Container>
  );
}

function Main(props: WalletConnectionProps) {
  const {
    activeConnectorType,
    activeConnector,
    activeConnectorError,
    network,
    connectedAccounts,
    genesisHashes,
  } = props;
  const { connection, setConnection, account, genesisHash } = useConnection(
    connectedAccounts,
    genesisHashes
  );
  const { connect, isConnecting, connectError } = useConnect(activeConnector, setConnection);

  const [rpcGenesisHash, setRpcGenesisHash] = useState<string>();
  const [rpcError, setRpcError] = useState('');

  const { isConnected, isDisabled, select } = useWalletConnectorSelector(
    BROWSER_WALLET,
    connection,
    props
  );

  useEffect(() => {
    if (connection) {
      setRpcGenesisHash(undefined);
      withJsonRpcClient(connection, async (rpc) => {
        const status = await rpc.getConsensusStatus();
        return status.genesisBlock;
      })
        .then((hash) => {
          setRpcGenesisHash(hash);
          setRpcError('');
        })
        .catch((err) => {
          setRpcGenesisHash(undefined);
          setRpcError(errorString(err));
        });
    }
    if (activeConnector && !account) {
      connect();
    }
  }, [connection, genesisHash, network, account, activeConnector, connect]);

  const verb = isConnected ? 'Disconnect' : 'Connect';

  return (
    <>
      <Row className="mt-3 mb-3">
        <Button
          className="w-auto mx-auto px-2"
          disabled={isDisabled}
          variant={isConnected ? 'danger' : 'primary'}
          onClick={select}
        >
          {`${verb} `}
          {isConnecting && 'Connecting...'}
          {!isConnecting && 'Browser Wallet'}
        </Button>
      </Row>
      {activeConnectorError && (
        <Alert variant="danger">Connector error: {activeConnectorError}.</Alert>
      )}
      {!activeConnectorError && activeConnectorType && !activeConnector && <Spinner />}
      {connectError && <Alert variant="danger">Connection error: {connectError}.</Alert>}

      <ConnectedAccount connection={connection} account={account} network={network} />
      <Row className="mt-3 mb-3">
        <Col>
          {account && (
            <NetworkInconsistencyReporter
              rpcGenesisHash={rpcGenesisHash}
              networkGenesisHash={network.genesisHash}
              activeConnectionGenesisHash={genesisHash}
            />
          )}
          {rpcError && <Alert variant="warning">RPC error: {rpcError}</Alert>}
        </Col>
      </Row>
    </>
  );
}

interface NetworkInconsistencyReporterProps {
  rpcGenesisHash: string | undefined;
  activeConnectionGenesisHash: string | undefined;
  networkGenesisHash: string;
}

function NetworkInconsistencyReporter({
  rpcGenesisHash,
  networkGenesisHash,
  activeConnectionGenesisHash,
}: NetworkInconsistencyReporterProps) {
  const rpcMismatch = rpcGenesisHash && rpcGenesisHash !== networkGenesisHash;
  const activeConnectionMismatch =
    activeConnectionGenesisHash && activeConnectionGenesisHash !== networkGenesisHash;
  return (
    <>
      {(rpcMismatch || activeConnectionMismatch) && (
        <Alert variant="danger">
          Inconsistent network parameters detected!
          <ul>
            <li>
              Reported by wallet:{' '}
              {(activeConnectionGenesisHash && <code>{activeConnectionGenesisHash}</code>) || (
                <i>N/A</i>
              )}
              .
            </li>
            <li>
              Fetched from via RPC:{' '}
              {(rpcGenesisHash && <code>{rpcGenesisHash}</code>) || <i>N/A</i>}
            </li>
            <li>
              Expected for selected network: <code>{networkGenesisHash}</code>
            </li>
          </ul>
        </Alert>
      )}
    </>
  );
}
