"use client";

import { useEffect, useMemo, useState } from "react";
import { useEVMWallet } from "../providers/evm-wallet";
import { bigIntToString, formatNumber } from "@/utils";
import Big from "big.js";
import { useDebounceFn, useRequest } from "ahooks";
import InputNumber from "@/components/input-number";
import { useHistoryStore } from "@/stores/history";

import { Hyperliquid, HyperliquidFromTokens, HyperliquidQuoteParams, HyperliuquidToToken, HyperliuquidMinAmount } from "stableflow-ai-sdk";

// This example only demonstrates tokens on EVM chains
const fromTokens = HyperliquidFromTokens.filter((token) => token.chainType === "evm");
const toToken = HyperliuquidToToken;

export default function Home() {

  const { wallet, currentChainId, onSwitchChain } = useEVMWallet();
  const addHistory = useHistoryStore((state) => state.add);

  const [fromToken, setFromToken] = useState<any>();
  const [amount, setAmount] = useState<string>("");

  const { data: fromTokenBalance, loading: fromTokenBalanceLoading } = useRequest(async () => {
    if (!fromToken || !wallet?.account) {
      return "0";
    }
    const balance = await wallet?.wallet?.getBalance(fromToken, wallet.account);

    return Big(balance || 0).div(10 ** fromToken.decimals).toFixed(fromToken.decimals, 0);
  }, {
    refreshDeps: [fromToken, wallet?.account],
  });

  const handleFromTokenChange = (value: string) => {
    const token = fromTokens.find((token) => token.contractAddress === value);
    if (!token) {
      setFromToken(null);
      return;
    }
    setFromToken(token);
    onSwitchChain?.({ chainId: token.chainId as number });
  };

  const [quote, setQuote] = useState<any>(null);
  const getQuoteParams = (dry?: boolean): HyperliquidQuoteParams => {
    return {
      dry,
      slippageTolerance: 0.05, // 0.05%
      refundTo: wallet.account || "",
      recipient: wallet.account || "",
      wallet: wallet.wallet as any,
      fromToken,
      prices,
      amountWei: Big(amount).times(10 ** toToken.decimals).toFixed(0, 0),
    };
  };
  const { runAsync: handleQuote, loading: quoting } = useRequest(async (dry?: boolean) => {
    if (dry) {
      setQuote(null);
    }

    if (!wallet?.account || !fromToken || !amount || Big(amount).lte(0)) {
      setQuote(null);
      return;
    }

    const params = getQuoteParams(dry);

    try {
      const quoteRes = await Hyperliquid.quote(params);
      if (!quoteRes.quote) {
        setQuote(null);
        return;
      }
      setQuote(quoteRes.quote);
      console.log("quoteRes: %o", quoteRes);
      return quoteRes.quote;
    } catch (error) {
      console.error("quote error: %o", error);
      setQuote(null);
    }
  }, { manual: true });
  const { run: handleQuoteDebounce } = useDebounceFn(handleQuote, { wait: 1000 });

  const { runAsync: handleContinue, loading: transfering } = useRequest(async () => {
    if (!wallet?.account) {
      wallet?.connect?.();
      return;
    }
    if (currentChainId !== fromToken?.chainId) {
      onSwitchChain?.({ chainId: fromToken.chainId as number });
      return;
    }
    if (quote.needApprove) {
      await wallet.wallet?.approve({
        contractAddress: fromToken.contractAddress,
        spender: quote.approveSpender,
        amountWei: quote.quote.amountIn,
      });
      handleQuote(true);
      return;
    }

    try {
      // generate deposit address
      const quoteRes = await handleQuote(false);

      // quoteRes.quote.depositAddress = "0x30D026Ff6956dE7Ce62E0C4c4af46dcBa3aCdd40";

      const transferParams = {
        // bridge wallet
        wallet: wallet.wallet as any,
        // deposit wallet (evm wallet)
        evmWallet: wallet.wallet as any,
        // deposit wallet address
        evmWalletAddress: wallet.account,
        // quote result with deposit address
        quote: quoteRes,
      };

      // transfer assets to Arb
      const txhash = await Hyperliquid.transfer(transferParams);
      // const txhash = "0x6895b727dd19c3d3913b4045bca8421a022a84af497f220f2ad390cc356e5235";

      // switch chain to Arb
      await onSwitchChain?.({ chainId: toToken.chainId as number });

      // transfer assets to Hyperliquid
      const res = await Hyperliquid.deposit({
        txhash,
        ...transferParams,
      });

      if (res.code !== 200) {
        throw new Error(JSON.stringify(res.data) || "Deposit failed");
      }

      const depositId = res.data?.depositId;
      if (depositId != null) {
        addHistory(depositId + "", bigIntToString(quoteRes));
      }

      alert("Deposit submitted successfully. Please check the history for progress.");
    } catch (error) {
      console.error("continue error: %o", error);
    }
  }, { manual: true });

  const [buttonText, buttonDisabled, buttonLoading] = useMemo<[string, boolean, boolean]>(() => {
    const _button: [string, boolean, boolean] = ["Continue", true, false];
    if (transfering || quoting) {
      _button[2] = true;
      return _button;
    }
    if (!wallet?.account) {
      _button[1] = false;
      _button[0] = "Connect wallet";
      return _button;
    }
    if (fromToken && currentChainId !== fromToken?.chainId) {
      _button[1] = false;
      _button[0] = "Switch network";
      return _button;
    }
    if (!fromToken) {
      _button[0] = "Select token";
      return _button;
    }
    if (!amount || Big(amount).lte(0)) {
      _button[0] = "Enter amount";
      return _button;
    }
    const minAmount = Big(HyperliuquidMinAmount).div(10 ** toToken.decimals);
    if (Big(amount).lt(minAmount)) {
      _button[0] = `Amount must be greater than ${minAmount} ${toToken.symbol}`;
      return _button;
    }
    if (!quote) {
      return _button;
    }
    if (quote.needApprove) {
      _button[0] = "Approve";
      _button[1] = false;
      return _button;
    }
    _button[1] = false;
    return _button;
  }, [transfering, fromToken, amount, wallet, quoting, quote, currentChainId, HyperliuquidMinAmount]);

  useEffect(() => {
    if (transfering || currentChainId !== fromToken?.chainId) {
      return;
    }
    handleQuoteDebounce(true);
  }, [amount, fromToken, wallet, transfering, currentChainId]);

  return (
    <div className="w-full md:w-[600px] mx-auto p-4 space-y-4">
      <h1 className="text-center text-2xl font-bold">Hyperliquid Demo</h1>
      <div className="">
        <h2 className="">From</h2>
        <div className="">
          <select
            value={fromToken?.contractAddress}
            onChange={(e) => {
              handleFromTokenChange(e.target.value);
            }}
            className="w-full p-2 border border-gray-300 rounded-md cursor-pointer"
          >
            <option value="">Select token</option>
            {fromTokens.map((token) => (
              <option key={token.contractAddress} value={token.contractAddress}>
                {token.chainName} - {token.symbol}
              </option>
            ))}
          </select>
          {
            fromToken && (
              <div className="flex justify-end items-center gap-1">
                <div className="">Balance:</div>
                <div className="">
                  {fromTokenBalanceLoading ? "Loading..." : formatNumber(fromTokenBalance, 6, true)}
                </div>
              </div>
            )
          }
        </div>
      </div>
      <div className="">
        <h2>Deposit {toToken.symbol} Amount</h2>
        <div className="">
          <InputNumber
            value={amount}
            onNumberChange={(value) => setAmount(value)}
            decimals={fromToken?.decimals}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      {
        quote && (
          <>
            <div className="w-full space-y-1 text-gray-700 text-sm">
              <div className="flex justify-between items-center">
                <label className="">Estimate time:</label>
                <div className="">
                  {quoting ? "Loading..." : `~${quote.estimateTime}s`}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="">Estimate Gas:</label>
                <div className="">
                  {quoting ? "Loading..." : formatNumber(quote.estimateSourceGasUsd, 4, true, { prefix: "$" })}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="">Net fee:</label>
                <div className="">
                  {quoting ? "Loading..." : formatNumber(quote.fees?.destinationGasFeeUsd, 4, true, { prefix: "$" })}
                </div>
              </div>
            </div>
            <div className="text-sm">
              <strong>{amount} USDC</strong> will be deposited into Hyperliquid, and you need to pay <strong>{quoting ? "Loading..." : quote.quote.amountInFormatted} USDT</strong>.
            </div>
          </>
        )
      }
      <button
        type="button"
        className="w-full mt-2 bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={buttonDisabled}
        onClick={handleContinue}
      >
        {buttonLoading ? "Loading..." : buttonText}
      </button>
    </div>
  );
}

const prices = {
  "TRX": "0.293733",
  "ETH": "2954.29",
  "POL": "0.11727",
  "NEAR": "1.45",
  "SOL": "123.51",
  "BNB": "901.08",
  "AVAX": "11.83",
  "XDAI": "0.999483",
  "APT": "1.56",
  "BERA": "0.595966",
  "OKB": "104.55",
  "XPL": "0.1403",
};
