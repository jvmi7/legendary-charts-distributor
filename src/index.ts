/** @format */

import { getTopAddresses } from './getAddresses';
import { getShuffledWeightedHoldersList } from './getHolders';
import { getGreyscaleTokenIds, getGreyscaleHolders } from './getGreyscaleHolders';
import { CHARTS_CONTRACT_ADDRESS, RANDOM_SEED } from './config';

async function main() {
  const winners: string[] = [];

  console.log('🔥 Getting top addresses from burn transactions...');
  const topAddresses = await getTopAddresses();
  winners.push(...topAddresses);

  const holders = await getShuffledWeightedHoldersList(RANDOM_SEED);
  console.log(`Got ${holders.length} weighted holders`);

  console.log('🎨 Getting greyscale NFT token IDs...');
  const greyscaleTokenIds = await getGreyscaleTokenIds(CHARTS_CONTRACT_ADDRESS, 1000);
  console.log(`Found ${greyscaleTokenIds.length} greyscale NFTs`);

  console.log('👥 Getting holders of greyscale NFTs...');
  const greyscaleHolders = await getGreyscaleHolders(greyscaleTokenIds);
  console.log(`Found ${greyscaleHolders.length} unique greyscale NFT holders`);

  // First: pick 4 random holders from the main collection
  console.log('🎯 Picking 4 random collection holders...');
  const selectedCollectionHolders = pickRandomWithSeed(holders, 4, RANDOM_SEED);
  console.log('Selected collection holders ✅');
  winners.push(...selectedCollectionHolders);

  // Remove the selected collection holders from greyscale holders to prevent double selection
  const filteredGreyscaleHolders = greyscaleHolders.filter(
    (holder) => !selectedCollectionHolders.includes(holder)
  );

  // Then: pick 4 random greyscale holders from the remaining list
  console.log('\n🎲 Picking 4 random greyscale holders from remaining list...');
  const selectedGreyscaleHolders = pickRandomWithSeed(filteredGreyscaleHolders, 4, RANDOM_SEED + 1); // Use different seed
  console.log('Selected greyscale holders ✅');
  winners.push(...selectedGreyscaleHolders);

  console.log(`\n🏆 Total winners: ${winners.length}`);

  console.log('\n🎉 FINAL WINNERS:');
  console.log('='.repeat(50));

  console.log('\n📈 Top 8 Burn Addresses:');
  topAddresses.forEach((address, index) => {
    console.log(`  ${index + 1}. ${address}`);
  });

  console.log('\n🎨 4 Collection Holders:');
  selectedCollectionHolders.forEach((address, index) => {
    console.log(`  ${index + 1}. ${address}`);
  });

  console.log('\n🖤 4 Greyscale Holders:');
  selectedGreyscaleHolders.forEach((address, index) => {
    console.log(`  ${index + 1}. ${address}`);
  });

  console.log('\n' + '='.repeat(50));
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
 * Pick random items from an array using a seeded random generator
 * @param array - The array to pick from
 * @param count - Number of items to pick
 * @param seed - The seed for deterministic randomness
 * @returns Array of randomly selected items
 */
function pickRandomWithSeed<T>(array: T[], count: number, seed: number): T[] {
  if (count >= array.length) {
    return [...array]; // Return all items if count is greater than array length
  }

  const random = createSeededRandom(seed);
  const shuffled = [...array]; // Create a copy
  const selected: T[] = [];

  // Fisher-Yates shuffle to select random items
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(random() * (shuffled.length - i)) + i;
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    selected.push(shuffled[i]);
  }

  return selected;
}

main().catch(console.error);
