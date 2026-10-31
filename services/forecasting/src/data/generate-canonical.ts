import * as fs from 'fs';
import * as path from 'path';

// Seeded pseudo-random generator for 100% deterministic reproducibility
class SeededRandom {
  private s: number;
  constructor(seed: number) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }
  next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  // Normal distribution via Box-Muller transform
  gaussian(mean = 0, stdev = 1): number {
    const u1 = Math.max(1e-9, this.next());
    const u2 = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * stdev;
  }
}

export function generateCanonicalDataset(startDateStr = '2026-08-01', totalDays = 90) {
  const rng = new SeededRandom(1337);
  const startDate = new Date(startDateStr + 'T00:00:00Z');

  const ingredients = [
    {
      id: 'bat_wings',
      name: 'Bat Wings',
      unit: 'pieces',
      baseDemand: 45,
      noiseStdev: 4.5,
      seasonality: (dayOfWeek: number) => (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 ? 1.35 : 0.85),
      leadTimeDays: 5,
      currentStock: 180,
      safetyStock: 75,
      packSize: 25,
      moq: 50,
      unitCost: 1.2,
    },
    {
      id: 'mandrake_root',
      name: 'Mandrake Root',
      unit: 'roots',
      baseDemand: 18,
      noiseStdev: 2.2,
      seasonality: (dayOfWeek: number) => (dayOfWeek >= 2 && dayOfWeek <= 4 ? 1.2 : 0.9),
      leadTimeDays: 7,
      currentStock: 65,
      safetyStock: 35,
      packSize: 10,
      moq: 20,
      unitCost: 4.5,
    },
    {
      id: 'ghost_pepper',
      name: 'Ghost Pepper',
      unit: 'grams',
      baseDemand: 12,
      noiseStdev: 3.0,
      seasonality: (_: number) => 1.0,
      leadTimeDays: 4,
      currentStock: 40,
      safetyStock: 25,
      packSize: 15,
      moq: 30,
      unitCost: 0.8,
    },
    {
      id: 'dragon_scale',
      name: 'Dragon Scale',
      unit: 'scales',
      baseDemand: 3.2,
      noiseStdev: 1.5,
      seasonality: (dayOfWeek: number) => (dayOfWeek === 6 ? 1.5 : 0.9),
      leadTimeDays: 14,
      currentStock: 15,
      safetyStock: 10,
      packSize: 5,
      moq: 10,
      unitCost: 45.0,
    },
    {
      id: 'phoenix_feather',
      name: 'Phoenix Feather',
      unit: 'feathers',
      baseDemand: 1.4,
      noiseStdev: 0.9,
      seasonality: (_: number) => 1.0,
      leadTimeDays: 21,
      currentStock: 6,
      safetyStock: 5,
      packSize: 2,
      moq: 4,
      unitCost: 120.0,
    },
    {
      id: 'obsidian_dust',
      name: 'Obsidian Dust',
      unit: 'grams',
      baseDemand: 25,
      noiseStdev: 2.0,
      seasonality: (_: number) => 1.0,
      leadTimeDays: 3,
      currentStock: 110,
      safetyStock: 40,
      packSize: 50,
      moq: 50,
      unitCost: 2.1,
    },
    {
      id: 'distilled_aether',
      name: 'Distilled Aether',
      unit: 'ml',
      baseDemand: 30,
      noiseStdev: 3.5,
      seasonality: (dayOfWeek: number) => (dayOfWeek === 5 ? 1.25 : 0.95),
      leadTimeDays: 6,
      currentStock: 140,
      safetyStock: 50,
      packSize: 50,
      moq: 100,
      unitCost: 3.5,
    },
  ];

  // Midnight Curse event on days 80-82 (October 19-21, 2026)
  const midnightCurseStartDay = 80;
  const midnightCurseEndDay = 82;

  const dataset = ingredients.map((ing) => {
    const points = [];
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const currentDate = new Date(startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
      const dateStr = currentDate.toISOString().slice(0, 10);
      const dayOfWeek = currentDate.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

      const seasonalFactor = ing.seasonality(dayOfWeek);
      const isMidnightCurse = dayIndex >= midnightCurseStartDay && dayIndex <= midnightCurseEndDay;
      const eventMultiplier = isMidnightCurse ? 3.0 : 1.0;

      let value = Math.max(0, (ing.baseDemand * seasonalFactor + rng.gaussian(0, ing.noiseStdev)) * eventMultiplier);

      // Injected deliberate anomalies for testing robust anomaly detection:
      // 1. Day 62: Unannounced demand spike in Distilled Aether (120 ml vs ~30 ml avg)
      if (ing.id === 'distilled_aether' && dayIndex === 62) {
        value = 122.5;
      }
      // 2. Day 45: Sudden negative ledger drop/shrinkage recorded in Ghost Pepper
      // (Will be injected into stock adjustments)

      // Round to 1 decimal place or whole numbers for discrete items
      const roundedValue = ['bat_wings', 'mandrake_root', 'dragon_scale', 'phoenix_feather'].includes(ing.id)
        ? Math.round(value)
        : Math.round(value * 10) / 10;

      points.push({
        date: dateStr,
        timestamp: currentDate.getTime(),
        value: roundedValue,
        isMidnightCurse,
        eventMultiplier,
      });
    }

    return {
      ingredientId: ing.id,
      ingredientName: ing.name,
      unit: ing.unit,
      leadTimeDays: ing.leadTimeDays,
      currentStock: ing.currentStock,
      safetyStock: ing.safetyStock,
      packSize: ing.packSize,
      moq: ing.moq,
      unitCost: ing.unitCost,
      points,
    };
  });

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalDays,
      startDate: startDateStr,
      seed: 1337,
      midnightCurseWindow: {
        startDate: new Date(startDate.getTime() + midnightCurseStartDay * 86400000).toISOString().slice(0, 10),
        endDate: new Date(startDate.getTime() + midnightCurseEndDay * 86400000).toISOString().slice(0, 10),
        multiplier: 3.0,
      },
    },
    ingredients: dataset,
  };
}

if (require.main === module) {
  const data = generateCanonicalDataset();
  const dir1 = path.join(__dirname, '../../data');
  const dir2 = path.join(__dirname, '../../../../tests/fixtures');

  [dir1, dir2].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const file1 = path.join(dir1, 'canonical_apothecary_90d.json');
  const file2 = path.join(dir2, 'canonical_apothecary_90d.json');

  fs.writeFileSync(file1, JSON.stringify(data, null, 2), 'utf-8');
  fs.writeFileSync(file2, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Canonical dataset successfully generated:\n- ${file1}\n- ${file2}`);
}

