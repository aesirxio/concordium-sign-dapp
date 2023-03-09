import { Network, WalletConnection, withJsonRpcClient } from '@concordium/react-components';
import { useEffect, useState } from 'react';
import { AccountInfo, AccountTransactionType } from '@concordium/web-sdk';

import { Alert, Button, Col, Form, Row } from 'react-bootstrap';
import { Buffer } from 'buffer';
import { TESTNET } from '../config';
import axios from 'axios';
import { detectConcordiumProvider } from '@concordium/browser-wallet-api-helpers';

export enum RewardType {
  BakingReward = 'BakingReward',
  BlockReward = 'BlockReward',
  FinalizationReward = 'FinalizationReward',
  StakingReward = 'StakingReward',
}

export enum SpecialTransactionType {
  Malformed = 'Malformed',
}

enum TransactionStatus {
  /** On-chain but with an error */
  Failed = 'failed',
  /** On-chain and successful */
  Finalized = 'finalized',
  /** Sent to node, pending finalization or failure */
  Pending = 'pending',
}

interface BrowserWalletTransaction {
  fromAddress: string | undefined;
  toAddress: string | undefined;
  transactionHash: string;
  blockHash: string;
  amount: bigint;
  cost?: bigint;
  type: AccountTransactionType | RewardType | SpecialTransactionType;
  status: TransactionStatus;
  time: bigint;
  id: number;
  events: string[];
  rejectReason?: string;
}

interface BrowserWalletAccountTransaction extends BrowserWalletTransaction {
  type: AccountTransactionType;
}

interface Props {
  network: Network;
  connection: WalletConnection | undefined;
  account: string | undefined;
}

interface Signature {
  base64: string | undefined;
  raw: string | undefined;
}

function ccdScanUrl(network: Network, activeConnectedAccount: string | undefined) {
  return `${network.ccdScanBaseUrl}/?dcount=1&dentity=account&daddress=${activeConnectedAccount}`;
}

export function ConnectedAccount({ connection, account, network }: Props) {
  const [info, setInfo] = useState<AccountInfo>();
  const [infoError, setInfoError] = useState('');
  const [input, setInput] = useState('');
  const [signature, setSignature] = useState<Signature>();
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

      const signedNonce = Buffer.from(JSON.stringify(result), 'utf-8').toString('base64');

      if (signedNonce) {
        setSignature({ ...signature, ...{ base64: signedNonce, raw: result[0]['0'] } });
      }
    }
  };

  const handleRequestCCD = async () => {
    if (info) {
      await axios.put(
        `https://wallet-proxy.testnet.concordium.com/v0/testnetGTUDrop/${info.accountAddress}`
      );
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
            <>
              <Row className="mb-3">
                <Col sm="12">
                  <Details account={info} />
                </Col>
                {signature && (
                  <Col sm="12">
                    <Alert variant="info">
                      <ul className="mb-0">
                        <li className="text-break">Raw: {signature.raw}</li>
                      </ul>

                      <ul className="mb-0">
                        <li className="text-break">Base64: {signature.base64}</li>
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

              {network === TESTNET && (
                <Row>
                  <Col sm="6">
                    <Button
                      className="w-auto mx-auto px-2"
                      variant={'primary'}
                      onClick={handleRequestCCD}
                    >
                      Request 2000 CCD
                    </Button>
                  </Col>
                </Row>
              )}
            </>
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

async function getCcdDrop(accountAddress: string): Promise<BrowserWalletAccountTransaction> {
  const response = await axios.put(
    `https://wallet-proxy.testnet.concordium.com/v0/testnetGTUDrop/${accountAddress}`
  );

  return createPendingTransaction(
    AccountTransactionType.Transfer,
    response.data.submissionId,
    BigInt(2000000000),
    undefined,
    undefined,
    accountAddress
  );
}

export const createPendingTransaction = (
  type: AccountTransactionType,
  transactionHash: string,
  amount: bigint,
  cost?: bigint,
  fromAddress?: string,
  toAddress?: string
): BrowserWalletAccountTransaction => ({
  amount,
  blockHash: '',
  events: [],
  type,
  status: TransactionStatus.Pending,
  time: BigInt(Math.round(Date.now() / 1000)),
  id: 0,
  cost,
  transactionHash,
  fromAddress,
  toAddress,
});
