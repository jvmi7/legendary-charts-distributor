/** @format */

import dotenv from 'dotenv';
import chartsAbi from './abi/chartsContractAbi.json';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Import Alchemy SDK
const { Alchemy, Network } = require('alchemy-sdk');

// Load environment variables
dotenv.config();

// Get Alchemy API key from environment variables
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  console.error('Alchemy API key not found. Please add ALCHEMY_API_KEY to your .env file.');
  process.exit(1);
}

// Configure Alchemy SDK for Base network
const alchemyConfig = {
  apiKey: ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET // Base network
};

// Create Alchemy instance
const alchemy = new Alchemy(alchemyConfig);

// Base network Alchemy API URL (for direct API calls)
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

// Create viem public client for Base network
const publicClient = createPublicClient({
  chain: base,
  transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
});

interface NFTMetadata {
  tokenId: string;
  tokenType: string;
  name?: string;
  description?: string;
  image?: string;
  raw?: {
    metadata?: any;
    error?: string;
  };
  tokenUri?: string;
  media?: Array<{
    gateway: string;
    thumbnail: string;
    raw: string;
    format: string;
    bytes: number;
  }>;
  attributes?: Array<{
    trait_type: string;
    value: any;
  }>;
  owners?: string[];
  contract?: {
    address: string;
    name?: string;
    symbol?: string;
    totalSupply?: string;
    tokenType: string;
  };
}

interface AlchemyNFTResponse {
  nfts: NFTMetadata[];
  pageKey?: string;
  totalCount: number;
}

/**
 * Gets all NFTs in a collection with their metadata
 * @param contractAddress - The contract address of the NFT collection
 * @param includeMetadata - Whether to include metadata (default: true)
 * @param maxNFTs - Maximum number of NFTs to fetch (optional, fetches all if not specified)
 * @returns Promise<NFTMetadata[]> - Array of NFTs with metadata
 */
export async function getAllNFTsInCollection(
  contractAddress: string,
  includeMetadata: boolean = true,
  maxNFTs?: number
): Promise<NFTMetadata[]> {
  const allNFTs: NFTMetadata[] = [];
  let pageKey: string | undefined;
  let pageCount = 0;

  try {
    do {
      pageCount++;
      console.log(`Fetching page ${pageCount}...`);

      // Calculate how many NFTs to request in this batch
      const remainingNFTs = maxNFTs ? maxNFTs - allNFTs.length : 100;
      const limit = Math.min(100, remainingNFTs); // Don't exceed API limit of 100 per request

      const url = new URL(`${ALCHEMY_BASE_URL}/getNFTsForCollection`);
      url.searchParams.set('contractAddress', contractAddress);
      url.searchParams.set('withMetadata', includeMetadata.toString());
      url.searchParams.set('limit', limit.toString());

      if (pageKey) {
        url.searchParams.set('pageKey', pageKey);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as AlchemyNFTResponse;

      // Add NFTs to our collection, but don't exceed maxNFTs if specified
      if (maxNFTs) {
        const nftsToAdd = data.nfts.slice(0, maxNFTs - allNFTs.length);
        allNFTs.push(...nftsToAdd);
      } else {
        allNFTs.push(...data.nfts);
      }

      pageKey = data.pageKey;

      console.log(
        `Page ${pageCount}: Got ${data.nfts.length} NFTs (Total so far: ${allNFTs.length})`
      );

      // Stop if we've reached the maximum number of NFTs
      if (maxNFTs && allNFTs.length >= maxNFTs) {
        console.log(`✅ Reached maximum limit of ${maxNFTs} NFTs`);
        break;
      }

      // Add a small delay to avoid rate limiting
      if (pageKey) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } while (pageKey);

    console.log(`✅ Completed! Total NFTs fetched: ${allNFTs.length}`);
    return allNFTs;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    throw error;
  }
}

/**
 * Gets token IDs of NFTs with greyscale palette from the collection
 * @param contractAddress - The contract address of the NFT collection
 * @param maxNFTs - Maximum number of NFTs to scan (optional, scans all if not specified)
 * @returns Promise<string[]> - Array of token IDs of greyscale NFTs
 */
export async function getGreyscaleTokenIds(
  contractAddress?: string,
  maxNFTs?: number
): Promise<string[]> {
  // You can set a default contract address here if needed
  const defaultContractAddress = '0xb679683E562b183161d5f3F93c6fA1d3115c4D30'; // Replace with actual contract
  const address = contractAddress || defaultContractAddress;

  try {
    console.log(
      `Getting greyscale NFTs for contract: ${address}${
        maxNFTs ? ` (scanning max ${maxNFTs} NFTs)` : ''
      }`
    );

    // Get all NFTs with metadata (we need metadata to check attributes)
    const allNFTs = await getAllNFTsInCollection(address, true, maxNFTs);

    console.log(`Fetched ${allNFTs.length} NFTs, now filtering for greyscale palette...`);

    // Filter NFTs that have the greyscale palette attribute
    const greyscaleNFTs = allNFTs.filter((nft) => {
      // Check if the NFT has attributes
      if (!nft.raw?.metadata.attributes || !Array.isArray(nft.raw?.metadata.attributes)) {
        return false;
      }

      // Look for the palette attribute with value 'greyscale'
      return nft.raw?.metadata.attributes.some(
        (attr: any) => attr.trait_type === '[ palette ]' && attr.value === 'greyscale'
      );
    });

    console.log(
      `Found ${greyscaleNFTs.length} NFTs with greyscale palette out of ${allNFTs.length} total NFTs`
    );

    // Extract token IDs from greyscale NFTs
    const tokenIds = greyscaleNFTs.map((nft) => nft.tokenId);

    console.log(`Returning ${tokenIds.length} greyscale NFT token IDs`);

    return tokenIds;
  } catch (error) {
    console.error('Error getting greyscale NFT token IDs:', error);
    throw error;
  }
}

export async function getGreyscaleHolders(tokenIds: string[]): Promise<string[]> {
  const defaultContractAddress = '0xb679683E562b183161d5f3F93c6fA1d3115c4D30';
  const holdersSet = new Set<string>();

  try {
    console.log(`Getting holders for ${tokenIds.length} greyscale NFTs using contract calls...`);

    // Process token IDs in batches to avoid overwhelming the RPC
    const batchSize = 10;
    for (let i = 0; i < tokenIds.length; i += batchSize) {
      const batch = tokenIds.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          tokenIds.length / batchSize
        )}...`
      );

      // Process batch in parallel using viem
      await Promise.all(
        batch.map(async (tokenId) => {
          try {
            // Call the ownerOf function on the contract
            const owner = await publicClient.readContract({
              address: defaultContractAddress as `0x${string}`,
              abi: chartsAbi,
              functionName: 'ownerOf',
              args: [BigInt(tokenId)]
            });

            // Add owner to the set (automatically handles duplicates)
            if (owner && typeof owner === 'string') {
              holdersSet.add(owner.toLowerCase());
            }
          } catch (error) {
            console.warn(`Error fetching owner for token ${tokenId}:`, error);
          }
        })
      );

      // Add delay between batches to be respectful to the RPC
      if (i + batchSize < tokenIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const holders = Array.from(holdersSet);
    console.log(`Found ${holders.length} unique holders of ${tokenIds.length} greyscale NFTs`);

    return holders;
  } catch (error) {
    console.error('Error getting greyscale holders:', error);
    throw error;
  }
}

/**
 * Gets detailed NFT metadata for specific token IDs
 * @param contractAddress - The contract address of the NFT collection
 * @param tokenIds - Array of token IDs to get metadata for
 * @returns Promise<NFTMetadata[]> - Array of NFT metadata
 */
export async function getNFTMetadata(
  contractAddress: string,
  tokenIds: string[]
): Promise<NFTMetadata[]> {
  const metadataArray: NFTMetadata[] = [];

  try {
    for (const tokenId of tokenIds) {
      const url = new URL(`${ALCHEMY_BASE_URL}/getNFTMetadata`);
      url.searchParams.set('contractAddress', contractAddress);
      url.searchParams.set('tokenId', tokenId);
      url.searchParams.set('tokenType', 'ERC721');

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.warn(`Failed to fetch metadata for token ${tokenId}: ${response.status}`);
        continue;
      }

      const metadata = (await response.json()) as NFTMetadata;
      metadataArray.push(metadata);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return metadataArray;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    throw error;
  }
}
