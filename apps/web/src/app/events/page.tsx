'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Calendar,
  Zap,
  PlusCircle,
  Flame,
  CheckCircle2,
  Clock,
  Skull,
} from 'lucide-react';

interface SeasonalEvent {
  id: string;
  name: string;
  code: string;
  description: string;
  multiplier: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  affectedIngredients: string[];
}

export default function SeasonalEventsPage() {
  const [events, setEvents] = useState<SeasonalEvent[]>([
    {
      id: 'event-001',
      name: 'The Midnight Curse (Spooky Apex)',
      code: 'MIDNIGHT_CURSE_2026',
      description:
        'Occurs annually from Oct 28 to Nov 2. Mystical apothecary demand spikes violently for dark alchemy components.',
      multiplier: 3.0,
      startDate: '2026-10-28',
      endDate: '2026-11-02',
      isActive: true,
      affectedIngredients: ['Bat Wings', 'Mandrake Root', 'Ghost Pepper', 'Dragon Scale'],
    },
    {
      id: 'event-002',
      name: 'Blood Moon Conjunction',
      code: 'BLOOD_MOON_CONJUNCTION',
      description:
        'Celestial alignment amplifying vampiric and restorative potion brewing frequency across the realm.',
      multiplier: 2.2,
      startDate: '2026-11-14',
      endDate: '2026-11-16',
      isActive: false,
      affectedIngredients: ['Blood Orange Extract', 'Crimson Lily Petals'],
    },
    {
      id: 'event-003',
      name: 'Winter Solstice Frost Faire',
      code: 'WINTER_SOLSTICE_2026',
      description:
        'End-of-year festival requiring mass production of Warmth draughts and Frost Resistance elixirs.',
      multiplier: 1.8,
      startDate: '2026-12-20',
      endDate: '2026-12-26',
      isActive: false,
      affectedIngredients: ['Frost Lotus', 'Star Anise', 'Glacial Slime'],
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMultiplier, setNewMultiplier] = useState(2.0);
  const [newStart, setNewStart] = useState('2026-11-05');
  const [newEnd, setNewEnd] = useState('2026-11-08');
  const [newIngredients, setNewIngredients] = useState('Nightshade, Mandrake Root');

  const toggleEventActive = (id: string) => {
    setEvents(
      events.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)),
    );
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: SeasonalEvent = {
      id: `event-${Date.now()}`,
      name: newName,
      code: newName.toUpperCase().replace(/\s+/g, '_'),
      description: 'Custom seasonal event configured for local apothecary demand curves.',
      multiplier: Number(newMultiplier),
      startDate: newStart,
      endDate: newEnd,
      isActive: true,
      affectedIngredients: newIngredients.split(',').map((s) => s.trim()),
    };
    setEvents([newEvent, ...events]);
    setShowCreateModal(false);
    setNewName('');
  };

  const midnightCurse = events.find((e) => e.code === 'MIDNIGHT_CURSE_2026');

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-pumpkin" />
              Seasonal Events & Midnight Curse Engine
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Configure mystical events that apply deterministic demand multipliers to specific ingredients.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-pumpkin hover:bg-pumpkin/90 text-white"
          >
            <PlusCircle className="w-4 h-4" />
            New Seasonal Event
          </Button>
        </div>

        {/* Featured Midnight Curse Banner */}
        {midnightCurse && (
          <Card className="p-6 bg-gradient-to-r from-potionPurple/25 via-midnight/80 to-pumpkin/20 border-2 border-pumpkin/40 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" className="bg-pumpkin text-black font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-black" />
                    Apex Mystical Event
                  </Badge>
                  <Badge variant={midnightCurse.isActive ? 'success' : 'outline'}>
                    {midnightCurse.isActive ? 'Live & Multiplying' : 'Inactive'}
                  </Badge>
                </div>

                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Skull className="w-6 h-6 text-pumpkin" />
                  {midnightCurse.name}
                </h2>
                <p className="text-xs text-paleLavender/80 max-w-xl">
                  {midnightCurse.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-paleLavender/60">Targeted Ingredients:</span>
                  {midnightCurse.affectedIngredients.map((ing) => (
                    <span
                      key={ing}
                      className="px-2 py-0.5 rounded bg-midnight/80 border border-pumpkin/30 text-xs font-mono text-pumpkin"
                    >
                      {ing} (3.0x)
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                <div className="p-3 bg-midnight/80 rounded-xl border border-pumpkin/30 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-paleLavender/50 block">
                    Demand Multiplier
                  </span>
                  <span className="text-3xl font-extrabold text-pumpkin">3.0x</span>
                </div>

                <Button
                  onClick={() => toggleEventActive(midnightCurse.id)}
                  className={`font-semibold ${
                    midnightCurse.isActive
                      ? 'bg-crimson hover:bg-crimson/90 text-white'
                      : 'bg-cauldronGreen hover:bg-cauldronGreen/90 text-black'
                  }`}
                >
                  {midnightCurse.isActive ? 'Deactivate Event' : 'Activate Event'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Event Schedule List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-potionPurple" />
            Seasonal Event Schedule
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card
                key={event.id}
                className={`p-5 flex flex-col justify-between transition-all border ${
                  event.isActive
                    ? 'border-potionPurple/50 bg-midnight/70'
                    : 'border-potionPurple/15 bg-midnight/30 opacity-70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{event.name}</h4>
                      <p className="text-[10px] font-mono text-paleLavender/50">{event.code}</p>
                    </div>
                    <Badge variant={event.isActive ? 'success' : 'outline'}>
                      {event.isActive ? 'Active' : 'Off'}
                    </Badge>
                  </div>

                  <p className="text-xs text-paleLavender/70">{event.description}</p>

                  <div className="p-2.5 rounded-lg bg-ink/70 border border-potionPurple/15 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-paleLavender/60">Multiplier:</span>
                      <span className="font-bold text-pumpkin font-mono">{event.multiplier}x Surge</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-paleLavender/60">Duration:</span>
                      <span className="text-white font-mono text-[11px]">
                        {event.startDate} &rarr; {event.endDate}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-paleLavender/50 block mb-1">
                      Affected Ingredients:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {event.affectedIngredients.map((item) => (
                        <span
                          key={item}
                          className="px-1.5 py-0.5 rounded bg-potionPurple/15 text-[10px] text-paleLavender border border-potionPurple/25"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-potionPurple/15 flex items-center justify-between">
                  <span className="text-[11px] text-paleLavender/50 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    Deterministic Sync
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleEventActive(event.id)}
                    className="h-8 px-2 text-xs"
                  >
                    {event.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 bg-ink border border-potionPurple/40 space-y-4">
              <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-pumpkin" />
                  Create Seasonal Event
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-paleLavender/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Event Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lunar Eclipse Gathering"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-sm text-paleLavender focus:outline-none focus:border-potionPurple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-xs text-paleLavender focus:outline-none focus:border-potionPurple"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-xs text-paleLavender focus:outline-none focus:border-potionPurple"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Demand Multiplier ({newMultiplier}x)
                  </label>
                  <input
                    type="range"
                    min="1.1"
                    max="5.0"
                    step="0.1"
                    value={newMultiplier}
                    onChange={(e) => setNewMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-pumpkin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-paleLavender/80 mb-1">
                    Affected Ingredients (comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bat Wings, Mandrake Root"
                    value={newIngredients}
                    onChange={(e) => setNewIngredients(e.target.value)}
                    className="w-full p-2 bg-midnight/70 border border-potionPurple/20 rounded-lg text-xs text-paleLavender focus:outline-none focus:border-potionPurple"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-potionPurple/15">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-pumpkin hover:bg-pumpkin/90 text-white flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Create Event
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
