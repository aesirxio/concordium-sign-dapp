import { Network, WalletConnection, withJsonRpcClient } from '@concordium/react-components';
import { useEffect, useState } from 'react';
import { AccountInfo } from '@concordium/web-sdk';
import { Alert, Button, Col, Form, Row } from 'react-bootstrap';

interface Props {
  network: Network;
  connection: WalletConnection | undefined;
  account: string | undefined;
}

function ccdScanUrl(network: Network, activeConnectedAccount: string | undefined) {
  return `${network.ccdScanBaseUrl}/?dcount=1&dentity=account&daddress=${activeConnectedAccount}`;
}

export function ConnectedAccount({ connection, account, network }: Props) {
  const [info, setInfo] = useState<AccountInfo>();
  const [infoError, setInfoError] = useState('');
  const [input, setInput] = useState('');
  const [signature, setSignature] = useState('');
  useEffect(() => {
    if (connection && account) {
      setInfo(undefined);
      withJsonRpcClient(connection, (rpc) => rpc.getAccountInfo(account))
        .then((res) => {
          setInfo(res);
          setInfoError('');
        })
        .catch((err) => {
          setInfo(undefined);
          setInfoError(err);
        });
    }
  }, [connection, account]);

  const handleSignMessage = async () => {
    if (connection && account) {
      let result = await connection.signMessage(account, input);
      result[0]['0'] && setSignature(result[0]['0']);
    }
  };
  return (
    <>
      {infoError && <Alert variant="danger">Error querying account info: {infoError}</Alert>}
      {account && (
        <>
          <hr />
          <p>
            Connected to account{' '}
            <a target="_blank" rel="noreferrer" href={ccdScanUrl(network, account)}>
              <code>{account}</code>
            </a>{' '}
            on <b>{network.name}</b>.
          </p>
          {info && (
            <Row className="mb-3">
              <Col sm="12">
                <Details account={info} />
              </Col>
              {signature && (
                <Col sm="12">
                  <Alert variant="info">
                    <ul className="mb-0">
                      <li>Signature: {signature}</li>
                    </ul>
                  </Alert>
                </Col>
              )}
              <Col sm="6">
                {account && (
                  <>
                    <Form.Group className="mb-3" controlId="contract">
                      <Form.Control
                        type="text"
                        placeholder="Message"
                        value={input}
                        onChange={(e) => setInput(e.currentTarget.value)}
                        autoFocus
                      />
                    </Form.Group>
                    <Button
                      className="w-auto mx-auto px-2"
                      variant={'primary'}
                      onClick={handleSignMessage}
                    >
                      Sign Message
                    </Button>
                  </>
                )}
              </Col>
            </Row>
          )}
        </>
      )}
    </>
  );
}

function Details({ account }: { account: AccountInfo }) {
  return (
    <>
      <Alert variant="info">
        <ul className="mb-0">
          <li>Address: {account.accountAddress}</li>
          <li>Nonce: {account.accountNonce.toString()}</li>
          <li>Balance: {account.accountAmount.toString()}</li>
          <li>Index: {account.accountIndex.toString()}</li>
        </ul>
      </Alert>
    </>
  );
}
