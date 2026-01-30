"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useHistoryStore } from "@/stores/history";
import { formatNumber } from "@/utils";
import { Hyperliquid, HyperliquidDepositStatusResponseData } from "stableflow-ai-sdk";

const HistoryPage = () => {
  const router = useRouter();
  const { items } = useHistoryStore();
  const [statusByDepositId, setStatusByDepositId] = useState<
    Record<string, HyperliquidDepositStatusResponseData | null>
  >({});
  const [loadingDepositId, setLoadingDepositId] = useState<string | null>(null);

  const fetchStatus = async (depositId: string) => {
    setLoadingDepositId(depositId);
    setStatusByDepositId((prev) => ({ ...prev, [depositId]: null }));
    try {
      const res = await Hyperliquid.getStatus({ depositId });
      if (res.code === 200 && res.data) {
        setStatusByDepositId((prev) => ({
          ...prev,
          [depositId]: {
            status: res.data!.status,
            txHash: res.data!.txHash,
          },
        }));
      } else {
        setStatusByDepositId((prev) => ({ ...prev, [depositId]: null }));
      }
    } catch {
      setStatusByDepositId((prev) => ({ ...prev, [depositId]: null }));
    } finally {
      setLoadingDepositId(null);
    }
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });

  const getQuoteDisplay = (quote: unknown) => {
    if (!quote || typeof quote !== "object") return null;
    const q = quote as Record<string, unknown>;
    const inner = q.quote as Record<string, unknown> | undefined;
    const quoteParam = q.quoteParam as Record<string, unknown> | undefined;
    const fromToken = quoteParam?.fromToken as Record<string, unknown> | undefined;
    const toToken = quoteParam?.toToken as Record<string, unknown> | undefined;
    const fees = q.fees as Record<string, unknown> | undefined;

    const amountIn = inner?.amountInFormatted ?? q.amountInFormatted;
    const amountOut =
      inner?.amountOutFormatted ?? q.amountOutFormatted ?? q.outputAmount;
    const estimateTime =
      q.estimateTime ?? inner?.timeEstimate ?? q.timeEstimate;
    const gasUsd = q.estimateSourceGasUsd;
    const feeUsd = fees?.destinationGasFeeUsd ?? q.totalFeesUsd;

    const fromLabel =
      fromToken?.symbol && fromToken?.chainName
        ? `${String(fromToken.symbol)} (${String(fromToken.chainName)})`
        : null;
    const toLabel =
      toToken?.symbol && toToken?.chainName
        ? `${String(toToken.symbol)} (${String(toToken.chainName)})`
        : null;

    return {
      amountIn,
      amountOut,
      estimateTime,
      gasUsd,
      feeUsd,
      fromLabel,
      toLabel,
    };
  };

  return (
    <div className="w-full md:w-[600px] mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Deposit History</h1>
        <button
          type="button"
          className="text-gray-600 hover:text-gray-800 cursor-pointer"
          onClick={() => router.push("/")}
        >
          Back
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-500 text-center py-12 rounded-lg border border-gray-200 bg-gray-50">
          No deposit history yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const display = getQuoteDisplay(item.quote);
            return (
              <li
                key={item.id}
                className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm flex justify-between items-start gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-500">Deposit ID</span>
                    <span className="font-mono text-gray-800 truncate">
                      {item.id}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    {formatDate(item.createdAt)}
                  </div>
                  {display && (
                    <div className="pt-2 grid gap-1 text-gray-700">
                      {(display.fromLabel || display.toLabel) && (
                        <div className="flex justify-between gap-2 items-center">
                          <span>Route</span>
                          <span className="text-right">
                            {display.fromLabel ?? "—"} → {display.toLabel ?? "—"} → Hyperliquid
                          </span>
                        </div>
                      )}
                      {(display.amountIn != null || display.amountOut != null) && (
                        <div className="flex justify-between gap-2">
                          <span>Amount</span>
                          <span>
                            {display.amountIn != null
                              ? typeof display.amountIn === "string"
                                ? display.amountIn
                                : String(display.amountIn)
                              : ""}
                            {display.amountIn != null &&
                              display.amountOut != null &&
                              " → "}
                            {display.amountOut != null
                              ? typeof display.amountOut === "string"
                                ? display.amountOut
                                : String(display.amountOut)
                              : ""}
                          </span>
                        </div>
                      )}
                      {display.estimateTime != null && (
                        <div className="flex justify-between gap-2">
                          <span>Est. time</span>
                          <span>~{String(display.estimateTime)}s</span>
                        </div>
                      )}
                      {display.gasUsd != null && (
                        <div className="flex justify-between gap-2">
                          <span>Est. gas</span>
                          <span>
                            {formatNumber(
                              Number(display.gasUsd),
                              4,
                              true,
                              { prefix: "$" }
                            )}
                          </span>
                        </div>
                      )}
                      {display.feeUsd != null && (
                        <div className="flex justify-between gap-2">
                          <span>Net fee</span>
                          <span>
                            {formatNumber(
                              Number(display.feeUsd),
                              4,
                              true,
                              { prefix: "$" }
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {statusByDepositId[item.id] && (
                    <div className="pt-2 mt-2 border-t border-gray-100 grid gap-1 text-sm text-gray-700">
                      <div className="flex justify-between gap-2">
                        <span>Status</span>
                        <span className="font-medium">
                          {statusByDepositId[item.id]!.status}
                        </span>
                      </div>
                      {statusByDepositId[item.id]!.txHash && (
                        <div className="flex justify-between gap-2 items-center">
                          <span>Tx Hash</span>
                          <span className="font-mono truncate max-w-[200px]" title={statusByDepositId[item.id]!.txHash}>
                            {statusByDepositId[item.id]!.txHash}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 text-blue-500 hover:text-blue-700 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => fetchStatus(item.id)}
                  disabled={loadingDepositId === item.id}
                  aria-label="Get status"
                >
                  {loadingDepositId === item.id ? "Loading..." : "Get status"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default HistoryPage;
