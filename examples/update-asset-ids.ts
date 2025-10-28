/**
 * Tool to fetch and display current USDT Asset IDs from StableFlow API
 * 
 * Usage:
 *   1. Set your JWT token below or via environment variable
 *   2. Run: npx tsx update-asset-ids.ts
 *   3. Copy the output to update SUPPORTED_NETWORKS in web-demo/app.ts
 * 
 * Last run: 2025-10-28
 */

import { SFA, OpenAPI } from 'stableflow-ai-sdk';

// Configure API
OpenAPI.BASE = 'https://api.stableflow.ai';

// JWT Token - Get from https://app.stableflow.ai/
const JWT_TOKEN = process.env.STABLEFLOW_JWT_TOKEN || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjQxNTA2MjUsImlhdCI6MTc2MTU1ODYyNSwidXNlcl9pZCI6Mjl9.LYgx-jtL4YpeuWctzSGpk_bZQv8wIeMbbLiTzrVO9ZE';

if (!JWT_TOKEN) {
    console.error('❌ Error: JWT token is required!');
    console.error('Set STABLEFLOW_JWT_TOKEN environment variable or update JWT_TOKEN in this file.');
    process.exit(1);
}

OpenAPI.TOKEN = JWT_TOKEN;

// Target networks for the web demo
const TARGET_NETWORKS = [
    { id: 'eth', name: 'Ethereum', chainId: 1 },
    { id: 'arb', name: 'Arbitrum', chainId: 42161 },
    { id: 'pol', name: 'Polygon', chainId: 137 },
    { id: 'bsc', name: 'BNB Chain', chainId: 56 },
    { id: 'op', name: 'Optimism', chainId: 10 },
    { id: 'avax', name: 'Avalanche', chainId: 43114 },
];

async function updateAssetIds() {
    try {
        console.log('╔════════════════════════════════════════════════════════════════╗');
        console.log('║                                                                ║');
        console.log('║         StableFlow USDT Asset ID Updater                       ║');
        console.log('║                                                                ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');
        
        console.log('📡 Fetching tokens from API...\n');
        const tokens = await SFA.getTokens();
        
        console.log(`✓ Received ${tokens.length} tokens from API\n`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Check each target network
        let allFound = true;
        const results: any[] = [];
        
        for (const network of TARGET_NETWORKS) {
            const networkTokens = tokens.filter(t => t.blockchain === network.id);
            const usdt = networkTokens.find(t => t.symbol === 'USDT');
            
            if (usdt) {
                results.push({
                    id: network.id,
                    name: network.name,
                    chainId: network.chainId,
                    assetId: usdt.assetId,
                    decimals: usdt.decimals,
                    found: true
                });
                console.log(`✅ ${network.name} (${network.id})`);
                console.log(`   Chain ID: ${network.chainId}`);
                console.log(`   Asset ID: ${usdt.assetId}`);
                console.log(`   Decimals: ${usdt.decimals}\n`);
            } else {
                results.push({
                    id: network.id,
                    name: network.name,
                    chainId: network.chainId,
                    found: false
                });
                console.log(`❌ ${network.name} (${network.id}): USDT not found\n`);
                allFound = false;
            }
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        if (!allFound) {
            console.log('⚠️  Warning: Some networks are missing USDT tokens!\n');
        }
        
        // Generate TypeScript code
        console.log('📋 Copy this to web-demo/app.ts:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('// Supported networks with USDT info (hardcoded from API)');
        console.log(`// Last updated: ${new Date().toISOString().split('T')[0]}`);
        console.log('const SUPPORTED_NETWORKS = [');
        
        for (const result of results) {
            if (result.found) {
                console.log('    {');
                console.log(`        id: '${result.id}',`);
                console.log(`        name: '${result.name}',`);
                console.log(`        chainId: ${result.chainId},`);
                console.log(`        usdtAssetId: '${result.assetId}',`);
                console.log(`        decimals: ${result.decimals}`);
                console.log('    },');
            }
        }
        
        console.log('];\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Show all available blockchains
        const uniqueBlockchains = [...new Set(tokens.map(t => t.blockchain))].sort();
        console.log('ℹ️  All available blockchain IDs from API:');
        console.log(uniqueBlockchains.join(', '));
        console.log('\n');
        
        // Asset ID format analysis
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📊 Asset ID Format Analysis:\n');
        
        const nep141Count = results.filter(r => r.found && r.assetId.startsWith('nep141:')).length;
        const nep245Count = results.filter(r => r.found && r.assetId.startsWith('nep245:')).length;
        
        console.log(`  nep141 format: ${nep141Count} networks`);
        console.log(`  nep245 format: ${nep245Count} networks\n`);
        
        results.forEach(r => {
            if (r.found) {
                const format = r.assetId.startsWith('nep141:') ? 'nep141' : 
                             r.assetId.startsWith('nep245:') ? 'nep245' : 'unknown';
                console.log(`  ${r.name.padEnd(15)} - ${format}`);
            }
        });
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('✅ Update complete!\n');
        
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.status === 401) {
            console.error('\n💡 Tip: Your JWT token may have expired.');
            console.error('   Get a new token from: https://app.stableflow.ai/');
        }
        if (error.body) {
            console.error('Details:', JSON.stringify(error.body, null, 2));
        }
        process.exit(1);
    }
}

// Run the update
updateAssetIds();

