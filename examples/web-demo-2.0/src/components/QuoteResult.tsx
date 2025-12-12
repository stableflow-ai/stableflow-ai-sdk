import React from 'react';
import type { QuoteResult as QuoteResultType } from '../types';

interface QuoteResultProps {
  quotes: QuoteResultType[];
  onSelectQuote: (quote: QuoteResultType) => void;
  selectedQuote?: QuoteResultType | null;
}

export const QuoteResult: React.FC<QuoteResultProps> = ({
  quotes,
  onSelectQuote,
  selectedQuote,
}) => {
  const validQuotes = quotes.filter((q) => q.quote && !q.error);

  if (validQuotes.length === 0) {
    return (
      <div className="quote-result error">
        <p>No valid quotes available. Please try again.</p>
        {quotes.map((q) => (
          <div key={q.serviceType} className="quote-error">
            <strong>{q.serviceType}:</strong> {q.error || 'Unknown error'}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="quote-result">
      <h3>Available Routes</h3>
      <div className="quote-list">
        {validQuotes.map((quote) => {
          const isSelected = selectedQuote?.serviceType === quote.serviceType;
          const quoteData = quote.quote?.quote || quote.quote?.data;
          const outputAmount = quoteData?.amountOutFormatted || quote.quote?.outputAmount || 'N/A';
          const fees = quote.quote?.fees || {};
          const totalFees = quote.quote?.totalFeesUsd || '0';
          const estimateTime = quote.quote?.estimateTime || quoteData?.timeEstimate || 'N/A';

          return (
            <div
              key={quote.serviceType}
              className={`quote-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectQuote(quote)}
            >
              <div className="quote-header">
                <h4>{quote.serviceType.toUpperCase()}</h4>
                {isSelected && <span className="selected-badge">Selected</span>}
              </div>
              <div className="quote-details">
                <div className="quote-row">
                  <span>Output Amount:</span>
                  <strong>{outputAmount} USDT</strong>
                </div>
                <div className="quote-row">
                  <span>Total Fees:</span>
                  <strong>${totalFees}</strong>
                </div>
                <div className="quote-row">
                  <span>Est. Time:</span>
                  <strong>{estimateTime}s</strong>
                </div>
                {quote.quote?.depositAddress && (
                  <div className="quote-row">
                    <span>Deposit Address:</span>
                    <code className="deposit-address">
                      {quote.quote.depositAddress.slice(0, 10)}...
                      {quote.quote.depositAddress.slice(-10)}
                    </code>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

