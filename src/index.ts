/** @format */

import path from 'path';
import { createReadStream } from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import csv from 'csv-parser';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Alchemy API key from environment variables
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  console.error('Alchemy API key not found. Please add ALCHEMY_API_KEY to your .env file.');
  process.exit(1);
}

// Create a public client for Base network
const client = createPublicClient({
  chain: base,
  transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
});

// Path to the input and output CSV files
const inputFile = path.join(__dirname, './data/burn_txs.csv');
const outputFile = path.join(__dirname, './data/burn_address_leaderboard.csv');

// Interface for transaction data
interface Transaction {
  txHash: string;
}

// Interface for address count data
interface AddressCount {
  address: string;
  txCount: number;
}

async function getTransactionSender(txHash: string): Promise<string> {
  try {
    const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
    return tx.from;
  } catch (error) {
    console.error(`Error fetching transaction ${txHash}:`, error);
    return '';
  }
}

async function processBurnTransactions() {
  const transactions: Transaction[] = [];
  const addressCounts: Record<string, number> = {};

  // Read the CSV file
  console.log('Reading burn transactions from CSV...');
  await new Promise<void>((resolve) => {
    createReadStream(inputFile)
      .pipe(csv())
      .on('data', (data: any) => {
        // Use the correct column name from the CSV sample
        const txHash = data.TxHash;
        if (txHash) {
          transactions.push({ txHash });
        }
      })
      .on('end', () => {
        resolve();
      });
  });

  console.log(`Found ${transactions.length} transactions. Fetching sender addresses...`);

  // Process transactions in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    console.log(
      `Processing batch ${i / batchSize + 1}/${Math.ceil(transactions.length / batchSize)}...`
    );

    await Promise.all(
      batch.map(async (tx) => {
        const address = await getTransactionSender(tx.txHash);
        if (address) {
          addressCounts[address] = (addressCounts[address] || 0) + 1;
        }
      })
    );

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < transactions.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Convert the address counts to an array and sort by count in descending order
  const sortedAddressCounts: AddressCount[] = Object.entries(addressCounts)
    .map(([address, txCount]) => ({ address, txCount }))
    .sort((a, b) => b.txCount - a.txCount);

  // Write the results to a new CSV file
  const csvWriter = createObjectCsvWriter({
    path: outputFile,
    header: [
      { id: 'address', title: 'ADDRESS' },
      { id: 'txCount', title: 'TX_COUNT' }
    ]
  });

  await csvWriter.writeRecords(sortedAddressCounts);
  console.log(`Results written to ${outputFile}`);
}

// Run the main function
processBurnTransactions().catch((error) => {
  console.error('Error processing burn transactions:', error);
});
