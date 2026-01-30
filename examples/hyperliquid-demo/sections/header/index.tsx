"use client";

import { useEVMWallet } from "@/providers/evm-wallet";
import { formatAddress } from "@/utils";
import { usePathname, useRouter } from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { wallet, currentChain } = useEVMWallet();

  return (
    <header className="flex justify-between items-center p-4">
      <img
        src="/logo.svg"
        alt="StableFlow.ai"
        className="w-10 h-10 object-contain object-center cursor-pointer"
        onClick={() => router.push("/")}
      />
      <div className="flex justify-end items-center gap-2">
        {
          ![/^\/history/].some((reg) => reg.test(pathname)) && (
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
              onClick={() => router.push("/history")}
            >
              History
            </button>
          )
        }
        {
          wallet?.account ? (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-gray-100">
              <div className="">{formatAddress(wallet.account)}</div>
              <img
                src={currentChain?.logo}
                alt={currentChain?.name}
                className="w-4 h-4 object-contain object-center"
              />
              <button
                type="button"
                className="text-red-500 cursor-pointer"
                onClick={() => wallet?.disconnect?.()}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
              onClick={() => wallet?.connect?.()}
            >
              Connect Wallet
            </button>
          )
        }
      </div>
    </header>
  );
};

export default Header;
