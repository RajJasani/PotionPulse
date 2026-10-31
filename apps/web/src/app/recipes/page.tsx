'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FlaskConical,
  PlusCircle,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';

interface RecipeIngredient {
  name: string;
  quantityPerBatch: number;
  unit: string;
  onHand: number;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  brewTimeMinutes: number;
  batchYield: number;
  description: string;
  ingredients: RecipeIngredient[];
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: 'rec-001',
      name: 'Draught of Midnight Speed',
      category: 'ELIXIR',
      brewTimeMinutes: 45,
      batchYield: 5,
      description: 'Increases agility and reaction speed by 300%. Crucial during Midnight Curse events.',
      ingredients: [
        { name: 'Bat Wings', quantityPerBatch: 4, unit: 'pairs', onHand: 120 },
        { name: 'Ghost Pepper Essence', quantityPerBatch: 15, unit: 'ml', onHand: 40 },
        { name: 'Distilled Aether', quantityPerBatch: 50, unit: 'ml', onHand: 200 },
      ],
    },
    {
      id: 'rec-002',
      name: 'Mandrake Restorative Draught',
      category: 'MEDICINAL',
      brewTimeMinutes: 90,
      batchYield: 3,
      description: 'Cures petrification and high-order curses. Requires slow reduction over cauldron heat.',
      ingredients: [
        { name: 'Mandrake Root', quantityPerBatch: 25, unit: 'g', onHand: 15 },
        { name: 'Spring Water Essence', quantityPerBatch: 100, unit: 'ml', onHand: 500 },
      ],
    },
    {
      id: 'rec-003',
      name: 'Dragonfire Berserk Philter',
      category: 'COMBAT',
      brewTimeMinutes: 120,
      batchYield: 2,
      description: 'Grants temporary immunity to physical blades and engulfs strikes in crimson flame.',
      ingredients: [
        { name: 'Dragon Scale', quantityPerBatch: 1, unit: 'scale', onHand: 4 },
        { name: 'Obsidian Dust', quantityPerBatch: 30, unit: 'g', onHand: 80 },
        { name: 'Brimstone Essence', quantityPerBatch: 20, unit: 'ml', onHand: 50 },
      ],
    },
  ]);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(recipes[0]!);
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1);
  const [showNewModal, setShowNewModal] = useState(false);

  // New recipe state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBrewTime, setNewBrewTime] = useState(60);
  const [newYield, setNewYield] = useState(4);

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Recipe = {
      id: `rec-${Date.now()}`,
      name: newName,
      category: 'CUSTOM',
      brewTimeMinutes: Number(newBrewTime),
      batchYield: Number(newYield),
      description: newDesc,
      ingredients: [
        { name: 'Bat Wings', quantityPerBatch: 2, unit: 'pairs', onHand: 120 },
        { name: 'Distilled Aether', quantityPerBatch: 30, unit: 'ml', onHand: 200 },
      ],
    };
    setRecipes([created, ...recipes]);
    setSelectedRecipe(created);
    setShowNewModal(false);
  };

  // Compute maximum possible batches given current on-hand stock
  const maxPossibleBatches = Math.min(
    ...selectedRecipe.ingredients.map((ing) => Math.floor(ing.onHand / ing.quantityPerBatch)),
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FlaskConical className="w-7 h-7 text-potionPurple" />
              Recipe Formulations & Cauldron Brewing
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Maintain apothecary bills-of-materials and simulate multi-batch inventory feasibility.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 bg-pumpkin hover:bg-pumpkin/90 text-white"
          >
            <PlusCircle className="w-4 h-4" />
            New Formulation
          </Button>
        </div>

        {/* Layout: Recipe List Left, Brew Simulator Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Recipe List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-paleLavender/60">
              Formulation Library ({recipes.length})
            </h3>
            {recipes.map((rec) => (
              <Card
                key={rec.id}
                onClick={() => setSelectedRecipe(rec)}
                className={`p-4 cursor-pointer transition-all border ${
                  selectedRecipe.id === rec.id
                    ? 'border-potionPurple bg-midnight/90 shadow-md shadow-potionPurple/15'
                    : 'border-potionPurple/15 bg-midnight/40 hover:bg-midnight/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-white text-sm">{rec.name}</h4>
                  <Badge variant="outline" className="text-[10px]">
                    {rec.category}
                  </Badge>
                </div>
                <p className="text-xs text-paleLavender/70 mt-1 line-clamp-2">{rec.description}</p>
                <div className="flex items-center gap-4 text-xs text-paleLavender/50 pt-3 border-t border-potionPurple/10 mt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-potionPurple" />
                    {rec.brewTimeMinutes} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-pumpkin" />
                    Yield: {rec.batchYield} vials
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Active Recipe Simulator */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-6 bg-ink border-2 border-potionPurple/30 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-potionPurple/20 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pumpkin" />
                    {selectedRecipe.name}
                  </h2>
                  <p className="text-xs text-paleLavender/60 mt-0.5">{selectedRecipe.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-paleLavender/50 block">
                    Max Possible Batches
                  </span>
                  <span
                    className={`text-2xl font-black ${
                      maxPossibleBatches > 0 ? 'text-cauldronGreen' : 'text-crimson'
                    }`}
                  >
                    {maxPossibleBatches}x ({maxPossibleBatches * selectedRecipe.batchYield} vials)
                  </span>
                </div>
              </div>

              {/* Batch Scale Controls */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-semibold text-paleLavender/70 block">
                  Simulate Batch Multiplier
                </span>
                <div className="flex gap-2">
                  {[1, 2, 5, 10].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setBatchMultiplier(mult)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        batchMultiplier === mult
                          ? 'bg-potionPurple text-white shadow-md'
                          : 'bg-midnight/70 text-paleLavender/60 hover:text-white border border-potionPurple/15'
                      }`}
                    >
                      {mult}x Batch ({mult * selectedRecipe.batchYield} Vials)
                    </button>
                  ))}
                </div>
              </div>

              {/* Bill of Materials Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-paleLavender/80">
                  Required Ingredients Breakdown ({batchMultiplier}x)
                </h4>

                <div className="divide-y divide-potionPurple/15 border border-potionPurple/20 rounded-xl overflow-hidden">
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    const totalRequired = ing.quantityPerBatch * batchMultiplier;
                    const isSufficient = ing.onHand >= totalRequired;
                    const shortfall = Math.max(0, totalRequired - ing.onHand);

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 flex items-center justify-between text-xs ${
                          isSufficient ? 'bg-midnight/30' : 'bg-crimson/10'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-white">{ing.name}</p>
                          <p className="text-[11px] text-paleLavender/50 font-mono">
                            Required: {totalRequired} {ing.unit} &bull; On Hand: {ing.onHand} {ing.unit}
                          </p>
                        </div>

                        <div className="text-right">
                          {isSufficient ? (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Ready
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Short {shortfall} {ing.unit}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Brew Action */}
              <div className="pt-2 flex items-center justify-between border-t border-potionPurple/20">
                <div className="text-xs text-paleLavender/60">
                  Total brew time: <strong className="text-white">{selectedRecipe.brewTimeMinutes * batchMultiplier} minutes</strong>
                </div>

                <Button
                  disabled={batchMultiplier > maxPossibleBatches}
                  className="bg-pumpkin hover:bg-pumpkin/90 text-white font-bold flex items-center gap-1.5"
                >
                  <Flame className="w-4 h-4 fill-white" />
                  Brew {batchMultiplier * selectedRecipe.batchYield} Vials
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* New Recipe Modal */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 bg-ink border border-potionPurple/40 space-y-4">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-potionPurple" />
                  Create Recipe Formulation
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewModal(false)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleCreateRecipe} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Potion Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Philter of True Sight"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Brewing instructions and magical effects..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-xs text-paleLavender focus:outline-none focus:border-potionPurple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                      Brew Time (Mins)
                    </label>
                    <input
                      type="number"
                      min={5}
                      required
                      value={newBrewTime}
                      onChange={(e) => setNewBrewTime(Number(e.target.value))}
                      className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-xs text-paleLavender focus:outline-none focus:border-potionPurple"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                      Batch Yield (Vials)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newYield}
                      onChange={(e) => setNewYield(Number(e.target.value))}
                      className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-xs text-paleLavender focus:outline-none focus:border-potionPurple"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-potionPurple/15">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-potionPurple hover:bg-potionPurple/90 text-white flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save Formulation
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
