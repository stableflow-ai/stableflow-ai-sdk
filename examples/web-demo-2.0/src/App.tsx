import { useState } from 'react';
import { useTransactionStore } from './stores/transactionStore';
import { ChainSelector } from './components/ChainSelector';
import { QuoteResult } from './components/QuoteResult';
import { WalletConnector } from './components/WalletConnector';
import { TransactionHistory } from './components/TransactionHistory';
import { getChainByKey } from './utils/chains';
import type { QuoteResult as QuoteResultType, Transaction } from './types';
import { useWallet } from './hooks/useWallet';
import Big from 'big.js';

import './App.css';

import { SFA, OpenAPI, GetAllQuoteParams } from 'stableflow-ai-sdk';
// Configure SDK
OpenAPI.BASE = import.meta.env.VITE_STABLEFLOW_API_URL || 'https://api.stableflow.ai';
const JWT_TOKEN = import.meta.env.VITE_STABLEFLOW_JWT_TOKEN;
if (JWT_TOKEN) {
  OpenAPI.TOKEN = JWT_TOKEN;
}

const prices = {

};

function App() {
  const [fromChain, setFromChain] = useState<string>();
  const [toChain, setToChain] = useState<string>();
  const [amount, setAmount] = useState<string>('');
  const [toAddress, setToAddress] = useState<string>('');
  const [fromWalletAddress, setFromWalletAddress] = useState<any>(null);
  const [toWalletAddress, setToWalletAddress] = useState<any>(null);
  const [quotes, setQuotes] = useState<QuoteResultType[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addTransaction } = useTransactionStore();

  const fromChainConfig = fromChain ? getChainByKey(fromChain) : null;
  const toChainConfig = toChain ? getChainByKey(toChain) : null;

  const { wallet: fromWallet, switchNetwork } = useWallet(fromChainConfig);

  const handleGetQuote = async () => {
    if (!fromChainConfig || !toChainConfig || !amount || !fromWalletAddress) {
      setError('Please fill in all required fields and connect from chain wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setQuotes([]);
    setSelectedQuote(null);

    try {
      // For now, we'll use the SFA.getQuote method
      // In a real implementation, you would use getAllQuote with wallet instances
      const quoteRequest: GetAllQuoteParams = {
        dry: false,
        minInputAmount: "0.1",
        prices,
        fromToken: fromChainConfig,
        toToken: toChainConfig,
        wallet: fromWallet.wallet,
        recipient: toAddress || toWalletAddress,
        refundTo: fromWalletAddress,
        amountWei: Big(amount).times(10 ** fromChainConfig.decimals).toString(),
        slippageTolerance: 0.5, // 0.5%
      };

      const response = await SFA.getAllQuote(quoteRequest);

      console.log("%cGot quote: %o", "background:#007E6E;color:#fff;", response);

      if (response && Array.isArray(response)) {
        const validQuotes = response.filter((q) => q.quote && !q.error);

        if (validQuotes.length === 0) {
          const errors = response
            .filter((q) => q.error)
            .map((q) => `${q.serviceType}: ${q.error}`)
            .join(', ');
          setError(`No valid quotes available. ${errors || 'Please try again.'}`);
        } else {
          setQuotes(validQuotes);
          const firstValid = validQuotes.find((q) => q.quote && !q.error);
          if (firstValid) {
            setSelectedQuote(firstValid);
          }
        }
      } else {
        setError('Invalid response format from quote service');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get quote');
      console.error('Quote error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!selectedQuote || !fromChainConfig || !toChainConfig || !fromWalletAddress) {
      setError('Please select a quote and ensure wallet is connected');
      return;
    }

    setLoading(true);
    setError(null);

    const quote = selectedQuote.quote;

    try {
      if (quote.needApprove) {
        await fromWallet.wallet.approve({
          contractAddress: quote.quoteParam.fromToken.contractAddress,
          spender: quote.approveSpender,
          amountWei: quote.quoteParam.amountWei,
        });
        const allowanceResult = await fromWallet.wallet.allowance({
          contractAddress: quote.quoteParam.fromToken.contractAddress,
          spender: quote.approveSpender,
          amountWei: quote.quoteParam.amountWei,
          address: fromWalletAddress,
        });
        console.log("allowanceResult: %o", allowanceResult);
      }

      const txHash = await SFA.send(selectedQuote.serviceType, {
        wallet: fromWallet.wallet,
        quote: quote,
      });

      // Create transaction record
      const tx: Transaction = {
        id: txHash,
        fromToken: fromChainConfig,
        toToken: toChainConfig,
        fromChain: fromChainConfig.chainName,
        toChain: toChainConfig.chainName,
        txHash,
        toChainTxHash: "",
        amount: amount,
        fromAddress: fromWalletAddress,
        toAddress: toAddress || toWalletAddress || fromWalletAddress,
        status: 'pending',
        timestamp: Date.now(),
        serviceType: selectedQuote.serviceType,
        depositAddress: quote.quote?.depositAddress,
      };

      addTransaction(tx);

      // In a real implementation, you would:
      // 1. Get the wallet instance for the from chain
      // 2. Call SFA.send() with the appropriate service type and parameters
      // 3. Update the transaction with the txHash

      setError(null);

      // Reset form
      setAmount('');
      setQuotes([]);
      setSelectedQuote(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit transaction');
      console.error('Transaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>StableFlow Bridge Demo 2.0</h1>
        <p>Cross-chain USDT bridge</p>
      </header>

      <main className="app-main">
        <div className="bridge-form">
          <div className="form-section">
            <h2>From</h2>
            <ChainSelector
              label="From Chain"
              value={fromChain}
              onChange={(_fromContractAddress) => {
                switchNetwork(getChainByKey(_fromContractAddress)!);
                setFromChain(_fromContractAddress)
              }}
              excludeContractAddress={toChain}
            />
            {fromChainConfig && (
              <WalletConnector
                chain={fromChainConfig}
                onAddressChange={setFromWalletAddress}
              />
            )}
          </div>

          <div className="form-section">
            <h2>To</h2>
            <ChainSelector
              label="To Chain"
              value={toChain}
              onChange={setToChain}
              excludeContractAddress={fromChain}
            />
            <div className="to-address-input">
              <label>Recipient Address (optional)</label>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="Enter address or connect wallet"
                className="input-address"
              />
            </div>
            {toChainConfig && (
              <WalletConnector
                chain={toChainConfig}
                onAddressChange={setToWalletAddress}
              />
            )}
          </div>

          <div className="form-section">
            <label>Amount (USDT)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="input-amount"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              onClick={handleGetQuote}
              disabled={loading || !fromChain || !toChain || !amount || !fromWalletAddress}
              className="btn-primary"
            >
              {loading ? 'Getting Quote...' : 'Get Quote'}
            </button>
            {selectedQuote && (
              <>
                <QuoteResult
                  quotes={quotes}
                  onSelectQuote={setSelectedQuote}
                  selectedQuote={selectedQuote}
                />
                <button
                  onClick={handleSubmitTransaction}
                  disabled={loading}
                  className="btn-submit"
                >
                  {loading ? 'Submitting...' : 'Submit Transaction'}
                </button>
              </>
            )}
          </div>
        </div>

        <TransactionHistory />
      </main >
    </div >
  );
}

export default App;

