import React, { useState } from 'react';
import { useTransactionStore } from '../stores/transactionStore';

import { Service, SFA } from 'stableflow-ai-sdk';

export const TransactionHistory: React.FC = () => {
  const { transactions, updateTransaction } = useTransactionStore();

  const [loading, setLoading] = useState<any>({});

  const quoteTransferResult = async (transaction: any) => {
    setLoading((prev: any) => ({
      ...prev,
      [transaction.id]: true,
    }));

    console.log("transaction: %o", transaction);

    try {
      const response = await SFA.getStatus(transaction.serviceType, {
        hash: transaction.id,
        depositAddress: transaction.depositAddress,
      });
      console.log("response: %o", response);

      updateTransaction(transaction.id, {
        status: response.status,
        toChainTxHash: response.toChainTxHash,
      });
    } catch (error) {
    }

    setLoading((prev: any) => ({
      ...prev,
      [transaction.id]: false,
    }));
  };

  if (transactions.length === 0) {
    return (
      <div className="transaction-history">
        <h2>Transaction History</h2>
        <p className="empty-state">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="transaction-header">
        <h2>Transaction History</h2>
        {/* <button onClick={clearTransactions} className="btn-clear">
          Clear All
        </button> */}
      </div>
      <div className="transaction-list">
        {transactions.map((tx) => (
          <div key={tx.id} className="transaction-item">
            <div className="transaction-info">
              <div className="transaction-row">
                <span className="label">Service:</span>
                <span>{tx.serviceType}</span>
              </div>
              <div className="transaction-row">
                <span className="label">From:</span>
                <span>{tx.fromChain}</span>
              </div>
              <div className="transaction-row">
                <span className="label">To:</span>
                <span>{tx.toChain}</span>
              </div>
              <div className="transaction-row">
                <span className="label">Amount:</span>
                <span>{tx.amount} {tx.fromToken?.symbol}</span>
              </div>
              <div className="transaction-row">
                <span className="label">Status:</span>
                <span className={`status status-${tx.status}`}>{tx.status}</span>
              </div>
              {tx.txHash && (
                <div className="transaction-row">
                  <span className="label">Tx Hash:</span>
                  <code className="tx-hash">{tx.txHash}</code>
                </div>
              )}
              {tx.toChainTxHash && (
                <div className="transaction-row">
                  <span className="label">Received Tx Hash:</span>
                  <code className="tx-hash">{tx.toChainTxHash}</code>
                </div>
              )}
              <div className="transaction-row">
                <span className="label">Time:</span>
                <span>{new Date(tx.timestamp).toLocaleString()}</span>
              </div>
            </div>
            {
              tx.status === "pending" && (
                <button
                  onClick={() => quoteTransferResult(tx)}
                  className="btn-remove"
                  disabled={loading[tx.id]}
                >
                  {loading[tx.id] ? "Loading..." : "Fetch Result"}
                </button>
              )
            }
          </div>
        ))}
      </div>
    </div>
  );
};

