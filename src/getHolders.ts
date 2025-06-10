/** @format */

import path from 'path';
import { createReadStream } from 'fs';
import csv from 'csv-parser';

// Path to the holders CSV file
const holdersFile = path.join(__dirname, './data/holders.csv');

interface Holder {
  address: string;
  balance: number;
}

/**
 * Simple seeded random number generator
 * @param seed - The seed value
 * @returns A function that generates random numbers between 0 and 1
 */
function createSeededRandom(seed: number) {
  let state = seed;
  return function () {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Shuffles an array using a seeded random number generator (Fisher-Yates shuffle)
 * @param array - The array to shuffle
 * @param seed - The seed for deterministic shuffling
 * @returns A new shuffled array
 */
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array]; // Create a copy
  const random = createSeededRandom(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Gets all holders from the holders.csv file
 * @returns Promise<Holder[]> - Array of holders with their addresses and balances
 */
export async function getAllHolders(): Promise<Holder[]> {
  const holders: Holder[] = [];

  await new Promise<void>((resolve, reject) => {
    createReadStream(holdersFile)
      .pipe(csv())
      .on('data', (data: any) => {
        holders.push({
          address: data.HolderAddress,
          balance: parseFloat(data.Balance)
        });
      })
      .on('end', () => {
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });

  return holders;
}

/**
 * Gets a list of holder addresses where each address is duplicated based on their balance
 * If a holder has balance of 5, their address appears 5 times in the returned array
 * @returns Promise<string[]> - Array of addresses duplicated by balance count
 */
export async function getWeightedHoldersList(): Promise<string[]> {
  const holders = await getAllHolders();
  const weightedList: string[] = [];

  for (const holder of holders) {
    // Add the address to the list as many times as their balance (rounded down to integer)
    const balance = Math.floor(holder.balance);
    for (let i = 0; i < balance; i++) {
      weightedList.push(holder.address);
    }
  }

  return weightedList;
}

/**
 * Gets a shuffled list of weighted holder addresses using a seed
 * @param seed - The seed for deterministic shuffling
 * @returns Promise<string[]> - Shuffled array of addresses duplicated by balance count
 */
export async function getShuffledWeightedHoldersList(seed: number): Promise<string[]> {
  const weightedList = await getWeightedHoldersList();
  return shuffleWithSeed(weightedList, seed);
}

/**
 * Gets holders sorted by balance in descending order
 * @param limit - Optional limit for number of holders to return
 * @returns Promise<Holder[]> - Array of holders sorted by balance (highest first)
 */
export async function getHoldersByBalance(limit?: number): Promise<Holder[]> {
  const holders = await getAllHolders();

  // Sort by balance in descending order
  const sortedHolders = holders.sort((a, b) => b.balance - a.balance);

  // Apply limit if provided
  return limit ? sortedHolders.slice(0, limit) : sortedHolders;
}

/**
 * Gets the total number of holders
 * @returns Promise<number> - Total count of holders
 */
export async function getTotalHolders(): Promise<number> {
  const holders = await getAllHolders();
  return holders.length;
}

/**
 * Gets the total supply (sum of all balances)
 * @returns Promise<number> - Total supply
 */
export async function getTotalSupply(): Promise<number> {
  const holders = await getAllHolders();
  return holders.reduce((total, holder) => total + holder.balance, 0);
}
