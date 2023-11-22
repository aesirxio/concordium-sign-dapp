import {
  Network,
  TESTNET,
  WalletConnection,
  binaryMessageFromHex,
  stringMessage,
  typeSchemaFromBase64,
} from '@concordium/react-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccountAddress,
  AccountTransactionSignature,
  AccountTransactionType,
  ConcordiumGRPCClient,
} from '@concordium/web-sdk';

import { Alert, Button, Col, Form, Row } from 'react-bootstrap';
import { Buffer } from 'buffer';
import axios from 'axios';
import { errorString } from '../util';
import { ResultAsync, err, ok } from 'neverthrow';

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
  rpc: ConcordiumGRPCClient | undefined;
}

function ccdScanUrl(network: Network, activeConnectedAccount: string | undefined) {
  return `${network.ccdScanBaseUrl}/?dcount=1&dentity=account&daddress=${activeConnectedAccount}`;
}

export function ConnectedAccount({ network, connection, account, rpc }: Props) {
  const [info, setInfo] = useState<any>();
  const [infoError, setInfoError] = useState('');
  useEffect(() => {
    if (rpc && account) {
      setInfo(undefined);
      rpc
        .getAccountInfo(AccountAddress.fromBase58(account))
        .then((res: any) => {
          setInfo(res);
          setInfoError('');
        })
        .catch((err: any) => {
          setInfo(undefined);
          setInfoError(errorString(err));
        });
    }
  }, [rpc, account]);

  const [signature, setSignature] = useState<AccountTransactionSignature>('');
  const [error, setError] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);

  const [messageInput, setMessageInput] = useState('');
  const [schemaInput, setSchemaInput] = useState('');

  const schemaResult = useMemo(() => {
    if (!schemaInput) {
      return undefined;
    }
    try {
      return ok(typeSchemaFromBase64(schemaInput));
    } catch (e) {
      return err(errorString(e));
    }
  }, [schemaInput]);
  const messageResult = useMemo(() => {
    if (!messageInput) {
      return undefined;
    }
    if (!schemaResult) {
      // Empty schema implies string message.
      return ok(stringMessage(messageInput));
    }
    try {
      // Map schema result to message with input.
      // Return undefined if schema result is an error to avoid double reporting it.
      return schemaResult.match(
        (s) => ok(binaryMessageFromHex(messageInput, s)),
        () => undefined
      );
    } catch (e) {
      return err(errorString(e));
    }
  }, [messageInput, schemaResult]);
  const handleMessageInput = useCallback((e: any) => setMessageInput(e.target.value), []);
  const handleSubmit = useCallback(() => {
    console.log('connection', connection);
    console.log('account', account);
    console.log('messageResult', messageResult);
    if (connection && account && messageResult) {
      messageResult
        .asyncAndThen((msg) => {
          setError('');
          setIsWaiting(true);
          return ResultAsync.fromPromise(connection.signMessage(account, msg), errorString);
        })
        .match(setSignature, setError)
        .finally(() => setIsWaiting(false));
    }
  }, [connection, account, messageResult]);

  const handleRequestCCD = async () => {
    if (info) {
      await axios.put(
        `https://wallet-proxy.testnet.concordium.com/v0/testnetGTUDrop/${info.accountAddress?.address}`
      );
    }
  };
  return (
    <>
      {infoError && (
        <Alert variant="danger">
          Error querying account info: {infoError && decodeURI(infoError)}
        </Alert>
      )}
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
                        <li className="text-break">Raw: {signature && signature[0][0]}</li>
                      </ul>

                      <ul className="mb-0">
                        <li className="text-break">
                          Base64:{' '}
                          {signature &&
                            Buffer.from(JSON.stringify(signature), 'utf-8').toString('base64')}
                        </li>
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
                          value={messageInput}
                          onChange={handleMessageInput}
                          autoFocus
                        />
                      </Form.Group>
                      <Button
                        className="w-auto mx-auto px-2"
                        variant={'primary'}
                        onClick={handleSubmit}
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

function Details({ account }: { account: any }) {
  return (
    <>
      <Alert variant="info">
        <ul className="mb-0">
          <li>Address: {account.accountAddress?.address}</li>
          <li>Nonce: {account.accountNonce?.value.toString()}</li>
          <li>Balance: {account.accountAmount?.microCcdAmount.toString()}</li>
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
