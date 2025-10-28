/**
 * StableFlow Cross-Chain Bridge Web Demo
 * 
 * Features:
 * - Wallet connection (MetaMask, Phantom, etc.)
 * - Real-time quote generation
 * - Transaction execution
 * - Status tracking
 */

import { SFA, OpenAPI, QuoteRequest, TokenResponse, QuoteResponse } from 'stableflow-ai-sdk';
import { ethers } from 'ethers';

// Configure SDK
OpenAPI.BASE = 'https://api.stableflow.ai';

// JWT Token - Get from https://app.stableflow.ai/
const JWT_TOKEN = import.meta.env.VITE_STABLEFLOW_JWT_TOKEN;

if (JWT_TOKEN) {
    OpenAPI.TOKEN = JWT_TOKEN;
}

// Supported networks with USDT info (hardcoded from API)
// Last updated: 2025-10-28
const SUPPORTED_NETWORKS = [
    { 
        id: 'eth', 
        name: 'Ethereum',
        chainId: 1,
        usdtAssetId: 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near',
        usdtContract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        decimals: 6
    },
    { 
        id: 'arb', 
        name: 'Arbitrum',
        chainId: 42161,
        usdtAssetId: 'nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near',
        usdtContract: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        decimals: 6
    },
    { 
        id: 'pol', 
        name: 'Polygon',
        chainId: 137,
        usdtAssetId: 'nep245:v2_1.omni.hot.tg:137_3hpYoaLtt8MP1Z2GH1U473DMRKgr',
        usdtContract: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        decimals: 6
    },
    { 
        id: 'bsc', 
        name: 'BNB Chain',
        chainId: 56,
        usdtAssetId: 'nep245:v2_1.omni.hot.tg:56_2CMMyVTGZkeyNZTSvS5sarzfir6g',
        usdtContract: '0x55d398326f99059ff775485246999027b3197955',
        decimals: 18
    },
    { 
        id: 'op', 
        name: 'Optimism',
        chainId: 10,
        usdtAssetId: 'nep245:v2_1.omni.hot.tg:10_359RPSJVdTxwTJT9TyGssr2rFoWo',
        usdtContract: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
        decimals: 6
    },
    { 
        id: 'avax', 
        name: 'Avalanche',
        chainId: 43114,
        usdtAssetId: 'nep245:v2_1.omni.hot.tg:43114_372BeH7ENZieCaabwkbWkBiTTgXp',
        usdtContract: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
        decimals: 6
    },
];

// State management
interface AppState {
    walletConnected: boolean;
    walletAddress: string | null;
    provider: ethers.BrowserProvider | null;
    signer: ethers.Signer | null;
    currentQuote: QuoteResponse | null;
    transactions: Transaction[];
}

interface Transaction {
    id: string;
    from: string;
    to: string;
    token: string;
    amount: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: number;
    txHash?: string;
}

const state: AppState = {
    walletConnected: false,
    walletAddress: null,
    provider: null,
    signer: null,
    currentQuote: null,
    transactions: loadTransactions(),
};

// DOM Elements
const elements = {
    connectWallet: document.getElementById('connectWallet') as HTMLButtonElement,
    disconnectWallet: document.getElementById('disconnectWallet') as HTMLButtonElement,
    walletInfo: document.getElementById('walletInfo') as HTMLDivElement,
    walletAddress: document.getElementById('walletAddress') as HTMLSpanElement,
    fromNetwork: document.getElementById('fromNetwork') as HTMLSelectElement,
    toNetwork: document.getElementById('toNetwork') as HTMLSelectElement,
    amount: document.getElementById('amount') as HTMLInputElement,
    estimatedOutput: document.getElementById('estimatedOutput') as HTMLDivElement,
    quoteDetails: document.getElementById('quoteDetails') as HTMLDivElement,
    quoteFee: document.getElementById('quoteFee') as HTMLSpanElement,
    quoteTime: document.getElementById('quoteTime') as HTMLSpanElement,
    quoteMinOut: document.getElementById('quoteMinOut') as HTMLSpanElement,
    getQuote: document.getElementById('getQuote') as HTMLButtonElement,
    swapDirection: document.getElementById('swapDirection') as HTMLButtonElement,
    statusMessage: document.getElementById('statusMessage') as HTMLDivElement,
    errorMessage: document.getElementById('errorMessage') as HTMLDivElement,
    loadingOverlay: document.getElementById('loadingOverlay') as HTMLDivElement,
    loadingMessage: document.getElementById('loadingMessage') as HTMLParagraphElement,
    transactionList: document.getElementById('transactionList') as HTMLDivElement,
};

// Initialize app
async function init() {
    showLoading('Initializing...');
    
    try {
        // Populate network dropdowns with hardcoded data
        populateNetworkSelects();
        
        // Setup event listeners
        setupEventListeners();
        
        // Check if wallet is already connected
        await checkWalletConnection();
        
        hideLoading();
        console.log('✓ App initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize app. Please refresh the page.');
        hideLoading();
    }
}

// Populate network select dropdowns (using hardcoded data)
function populateNetworkSelects() {
    console.log('Populating network selects with hardcoded data...');
    console.log('fromNetwork element:', elements.fromNetwork);
    console.log('toNetwork element:', elements.toNetwork);
    
    if (!elements.fromNetwork || !elements.toNetwork) {
        console.error('Network select elements not found!');
        return;
    }
    
    SUPPORTED_NETWORKS.forEach(network => {
        const option1 = document.createElement('option');
        option1.value = network.id;
        option1.textContent = network.name;
        elements.fromNetwork.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = network.id;
        option2.textContent = network.name;
        elements.toNetwork.appendChild(option2);
    });
    
    console.log(`✓ Added ${SUPPORTED_NETWORKS.length} networks to dropdowns`);
    console.log('fromNetwork options:', elements.fromNetwork.options.length);
    console.log('toNetwork options:', elements.toNetwork.options.length);
}

// Get network info by ID
function getNetworkInfo(networkId: string) {
    return SUPPORTED_NETWORKS.find(n => n.id === networkId);
}

// Setup event listeners
function setupEventListeners() {
    elements.connectWallet.addEventListener('click', connectWallet);
    elements.disconnectWallet.addEventListener('click', disconnectWallet);
    
    elements.fromNetwork.addEventListener('change', updateQuoteButton);
    elements.toNetwork.addEventListener('change', updateQuoteButton);
    elements.amount.addEventListener('input', updateQuoteButton);
    
    elements.swapDirection.addEventListener('click', swapNetworks);
    elements.getQuote.addEventListener('click', handleGetQuote);
}

// Connect wallet
async function connectWallet() {
    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            showError('Please install MetaMask to use this app');
            return;
        }
        
        showLoading('Connecting wallet...');
        
        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        state.provider = new ethers.BrowserProvider(window.ethereum);
        state.signer = await state.provider.getSigner();
        state.walletAddress = accounts[0];
        state.walletConnected = true;
        
        updateWalletUI();
        hideLoading();
        
        showStatus('Wallet connected successfully!');
        
    } catch (error: any) {
        console.error('Wallet connection error:', error);
        showError(error.message || 'Failed to connect wallet');
        hideLoading();
    }
}

// Disconnect wallet
function disconnectWallet() {
    state.walletConnected = false;
    state.walletAddress = null;
    state.provider = null;
    state.signer = null;
    
    updateWalletUI();
    showStatus('Wallet disconnected');
}

// Check if wallet is already connected
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_accounts' 
            });
            
            if (accounts.length > 0) {
                state.provider = new ethers.BrowserProvider(window.ethereum);
                state.signer = await state.provider.getSigner();
                state.walletAddress = accounts[0];
                state.walletConnected = true;
                updateWalletUI();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
}

// Update wallet UI
function updateWalletUI() {
    if (state.walletConnected && state.walletAddress) {
        elements.connectWallet.classList.add('hidden');
        elements.walletInfo.classList.remove('hidden');
        elements.walletAddress.textContent = formatAddress(state.walletAddress);
        elements.getQuote.textContent = 'Get Quote';
        updateQuoteButton();
    } else {
        elements.connectWallet.classList.remove('hidden');
        elements.walletInfo.classList.add('hidden');
        elements.getQuote.textContent = 'Connect Wallet to Continue';
        elements.getQuote.disabled = true;
    }
}

// Update quote button state
function updateQuoteButton() {
    const fromNetwork = elements.fromNetwork.value;
    const toNetwork = elements.toNetwork.value;
    const amount = elements.amount.value;
    
    const isValid = state.walletConnected && 
                    fromNetwork && 
                    toNetwork && 
                    amount && 
                    parseFloat(amount) > 0 &&
                    fromNetwork !== toNetwork;
    
    elements.getQuote.disabled = !isValid;
    
    // Reset button to "Get Quote" when parameters change
    resetQuoteButton();
}

// Reset quote button to initial state
function resetQuoteButton() {
    elements.getQuote.textContent = 'Get Quote';
    elements.getQuote.onclick = handleGetQuote;
    
    // Hide previous quote details
    elements.quoteDetails.classList.add('hidden');
    elements.estimatedOutput.textContent = 'You will receive: --';
    
    // Clear current quote
    state.currentQuote = null;
}

// Swap FROM and TO networks
function swapNetworks() {
    const fromNetwork = elements.fromNetwork.value;
    const toNetwork = elements.toNetwork.value;
    
    elements.fromNetwork.value = toNetwork;
    elements.toNetwork.value = fromNetwork;
    
    updateQuoteButton();
}

// Get quote
async function handleGetQuote() {
    try {
        showLoading('Getting quote...');
        hideMessages();
        
        const fromNetworkId = elements.fromNetwork.value;
        const toNetworkId = elements.toNetwork.value;
        const amountValue = elements.amount.value;
        
        // Get network info
        const fromNetwork = getNetworkInfo(fromNetworkId);
        const toNetwork = getNetworkInfo(toNetworkId);
        
        if (!fromNetwork || !toNetwork) {
            showError('Invalid network selected');
            hideLoading();
            return;
        }
        
        // Convert amount to smallest unit (using from network decimals)
        const amount = ethers.parseUnits(amountValue, fromNetwork.decimals).toString();
        
        const quoteRequest: QuoteRequest = {
            dry: false, // Get real deposit address
            swapType: QuoteRequest.swapType.EXACT_INPUT,
            slippageTolerance: 100, // 1%
            originAsset: fromNetwork.usdtAssetId,
            depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
            destinationAsset: toNetwork.usdtAssetId,
            amount: amount,
            refundTo: state.walletAddress!,
            refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
            recipient: state.walletAddress!,
            recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            quoteWaitingTimeMs: 5000,
        };
        
        const response = await SFA.getQuote(quoteRequest);
        state.currentQuote = response;
        
        // Display quote
        displayQuote(response, fromNetwork, toNetwork);
        
        // Change button to execute
        elements.getQuote.textContent = 'Execute Bridge';
        elements.getQuote.onclick = () => executeBridge(response, fromNetwork, toNetwork);
        
        hideLoading();
        
    } catch (error: any) {
        console.error('Quote error:', error);
        showError(error.body?.message || error.message || 'Failed to get quote');
        hideLoading();
    }
}

// Display quote details
function displayQuote(response: QuoteResponse, fromNetwork: typeof SUPPORTED_NETWORKS[0], toNetwork: typeof SUPPORTED_NETWORKS[0]) {
    const quote = response.quote;
    
    // Update estimated output
    elements.estimatedOutput.textContent = 
        `You will receive: ${quote.amountOutFormatted} USDT`;
    
    // Calculate fee
    const feeUsd = parseFloat(quote.amountInUsd) - parseFloat(quote.amountOutUsd);
    const feePercent = (feeUsd / parseFloat(quote.amountInUsd)) * 100;
    
    // Update quote details
    elements.quoteFee.textContent = `$${feeUsd.toFixed(4)} (${feePercent.toFixed(2)}%)`;
    elements.quoteTime.textContent = `~${quote.timeEstimate}s (${(quote.timeEstimate / 60).toFixed(1)} min)`;
    elements.quoteMinOut.textContent = `${ethers.formatUnits(quote.minAmountOut, toNetwork.decimals)} USDT`;
    
    elements.quoteDetails.classList.remove('hidden');
    
    showStatus(`Quote received! Deposit to: ${quote.depositAddress || 'N/A'}`);
}

// Switch to target network
async function switchNetwork(network: typeof SUPPORTED_NETWORKS[0]) {
    try {
        const chainIdHex = `0x${network.chainId.toString(16)}`;
        
        // Check current network
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (currentChainId === chainIdHex) {
            console.log(`Already on ${network.name}`);
            return;
        }
        
        console.log(`Switching to ${network.name} (Chain ID: ${network.chainId})...`);
        
        // Request network switch
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
        });
        
        console.log(`✓ Switched to ${network.name}`);
    } catch (error: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (error.code === 4902) {
            throw new Error(`Please add ${network.name} network to MetaMask first`);
        }
        throw error;
    }
}

// Execute bridge transaction
async function executeBridge(response: QuoteResponse, fromNetwork: typeof SUPPORTED_NETWORKS[0], toNetwork: typeof SUPPORTED_NETWORKS[0]) {
    try {
        showLoading('Preparing transaction...');
        
        const quote = response.quote;
        
        if (!quote.depositAddress) {
            throw new Error('No deposit address in quote');
        }
        
        // Switch to FROM network before sending transaction
        showLoading(`Switching to ${fromNetwork.name}...`);
        await switchNetwork(fromNetwork);
        
        // Transfer USDT to deposit address
        showLoading('Preparing USDT transfer...');
        const amount = ethers.parseUnits(quote.amountInFormatted, fromNetwork.decimals);
        
        // ERC20 ABI for transfer function
        const erc20Abi = [
            'function transfer(address to, uint256 amount) returns (bool)'
        ];
        
        // Create USDT contract instance
        const usdtContract = new ethers.Contract(
            fromNetwork.usdtContract,
            erc20Abi,
            state.signer
        );
        
        console.log('Transferring USDT:');
        console.log('  From:', state.walletAddress);
        console.log('  To:', quote.depositAddress);
        console.log('  Amount:', quote.amountInFormatted, 'USDT');
        console.log('  Contract:', fromNetwork.usdtContract);
        
        // Execute transfer
        showLoading('Please confirm in wallet...');
        const tx = await usdtContract.transfer(quote.depositAddress, amount);
        
        showStatus(`Transaction sent! Hash: ${tx.hash}`);
        console.log('Transaction hash:', tx.hash);
        
        // Wait for confirmation
        showLoading('Waiting for confirmation...');
        const receipt = await tx.wait();
        
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        showStatus('Transaction confirmed!');
        
        // Submit to StableFlow
        showLoading('Submitting to StableFlow...');
        try {
            await SFA.submitDepositTx({
                txHash: tx.hash,
                depositAddress: quote.depositAddress,
            });
            
            showStatus('Bridging in progress! Track your transaction below.');
        } catch (error) {
            console.error('Error submitting to StableFlow:', error);
            showStatus('Transaction sent but failed to notify StableFlow. Hash: ' + tx.hash);
        }
        
        // Add to transaction history
        const fromNetworkName = SUPPORTED_NETWORKS.find(n => n.id === elements.fromNetwork.value)?.name || elements.fromNetwork.value;
        const toNetworkName = SUPPORTED_NETWORKS.find(n => n.id === elements.toNetwork.value)?.name || elements.toNetwork.value;
        
        addTransaction({
            id: tx.hash,
            from: fromNetworkName,
            to: toNetworkName,
            token: 'USDT',
            amount: quote.amountInFormatted,
            status: 'pending',
            timestamp: Date.now(),
            txHash: tx.hash,
        });
        
        // Reset form
        resetForm();
        hideLoading();
        
    } catch (error: any) {
        console.error('Bridge execution error:', error);
        showError(error.message || 'Failed to execute bridge transaction');
        hideLoading();
    }
}

// Add transaction to history
function addTransaction(tx: Transaction) {
    state.transactions.unshift(tx);
    if (state.transactions.length > 10) {
        state.transactions = state.transactions.slice(0, 10);
    }
    saveTransactions();
    renderTransactions();
}

// Render transactions
function renderTransactions() {
    if (state.transactions.length === 0) {
        elements.transactionList.innerHTML = '<p class="empty-state">No transactions yet</p>';
        return;
    }
    
    elements.transactionList.innerHTML = state.transactions.map(tx => `
        <div class="transaction-item">
            <div class="transaction-header">
                <div class="transaction-route">
                    ${tx.from} → ${tx.to} | ${tx.amount} ${tx.token}
                </div>
                <div class="transaction-status ${tx.status}">
                    ${tx.status.toUpperCase()}
                </div>
            </div>
            <div class="transaction-details">
                ${new Date(tx.timestamp).toLocaleString()}
                ${tx.txHash ? `| ${formatAddress(tx.txHash)}` : ''}
            </div>
        </div>
    `).join('');
}

// Reset form
function resetForm() {
    elements.amount.value = '';
    elements.estimatedOutput.textContent = 'You will receive: --';
    elements.quoteDetails.classList.add('hidden');
    elements.getQuote.textContent = 'Get Quote';
    elements.getQuote.onclick = handleGetQuote;
    state.currentQuote = null;
}

// Utility functions
function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function showLoading(message: string) {
    elements.loadingMessage.textContent = message;
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showStatus(message: string) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.classList.remove('hidden');
    elements.errorMessage.classList.add('hidden');
    setTimeout(() => {
        elements.statusMessage.classList.add('hidden');
    }, 5000);
}

function showError(message: string) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    elements.statusMessage.classList.add('hidden');
}

function hideMessages() {
    elements.statusMessage.classList.add('hidden');
    elements.errorMessage.classList.add('hidden');
}

// Local storage helpers
function saveTransactions() {
    localStorage.setItem('stableflow_transactions', JSON.stringify(state.transactions));
}

function loadTransactions(): Transaction[] {
    try {
        const data = localStorage.getItem('stableflow_transactions');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing app...');
        init();
        renderTransactions();
    });
} else {
    // DOM is already loaded
    console.log('DOM already loaded, initializing app...');
    init();
    renderTransactions();
}

