import React, { Suspense, lazy } from "react";

const WalletProviderFailed = (props: any) => {
  const { chain } = props;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        padding: 10,
        backgroundColor: 'red',
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        zIndex: 1000,
        boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.5)',
      }}
    >
      {chain} wallet provided failed
    </div>
  );
};

// Dynamic import wallet providers with error handling
const RainbowProvider = lazy(() =>
  import("./Rainbow").catch(() => ({
    default: ({ children }: { children: React.ReactNode }) => <><WalletProviderFailed chain="Rainbow" /> {children}</>
  }))
);
const SolanaProvider = lazy(() =>
  import("./Solana").catch(() => ({
    default: ({ children }: { children: React.ReactNode }) => <><WalletProviderFailed chain="Rainbow" /> {children}</>
  }))
);
const NEARProvider = lazy(() =>
  import("./Near").catch(() => ({
    default: ({ children }: { children: React.ReactNode }) => <><WalletProviderFailed chain="Rainbow" /> {children}</>
  }))
);
const TronProvider = lazy(() =>
  import("./Tron").catch(() => ({
    default: ({ children }: { children: React.ReactNode }) => <><WalletProviderFailed chain="Rainbow" /> {children}</>
  }))
);
const AptosProvider = lazy(() =>
  import("./Aptos").catch(() => ({
    default: ({ children }: { children: React.ReactNode }) => <><WalletProviderFailed chain="Rainbow" /> {children}</>
  }))
);

// Loading component with individual Suspense boundaries
const WalletProviderLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>
    <RainbowProvider>
      <Suspense fallback={null}>
        <SolanaProvider>
          <Suspense fallback={null}>
            <NEARProvider>
              <Suspense fallback={null}>
                <TronProvider>
                  <Suspense fallback={null}>
                    <AptosProvider>
                      {children}
                    </AptosProvider>
                  </Suspense>
                </TronProvider>
              </Suspense>
            </NEARProvider>
          </Suspense>
        </SolanaProvider>
      </Suspense>
    </RainbowProvider>
  </Suspense>
);

export default function WalletsProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProviderLoader>
      {children}
    </WalletProviderLoader>
  );
}
