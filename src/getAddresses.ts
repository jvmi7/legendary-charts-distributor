/** @format */

import path from 'path';
import { createReadStream } from 'fs';
import csv from 'csv-parser';

// Path to the CSV file
const csvFile = path.join(__dirname, './data/address_tx_counts.csv');

interface AddressCount {
  address: string;
  txCount: number;
}

export async function getTopAddresses() {
  const addresses: AddressCount[] = [];

  // Read the CSV file
  await new Promise<void>((resolve) => {
    createReadStream(csvFile)
      .pipe(csv())
      .on('data', (data: any) => {
        addresses.push({
          address: data.ADDRESS,
          txCount: parseInt(data.TX_COUNT)
        });
      })
      .on('end', () => {
        resolve();
      });
  });

  // Get the top 8 addresses (they should already be sorted in descending order)
  const top8 = addresses.slice(0, 8).map((address) => address.address);

  return top8;
}
