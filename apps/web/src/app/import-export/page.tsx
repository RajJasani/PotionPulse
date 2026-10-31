'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

interface PreviewRow {
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost: number;
  valid: boolean;
}

export default function ImportExportPage() {
  const [importType, setImportType] = useState<'INGREDIENTS' | 'SUPPLIERS'>('INGREDIENTS');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  const mockUploadCSV = () => {
    setPreviewRows([
      { name: 'Silverleaf Herb', sku: 'BOT-SLV-01', category: 'BOTANICAL', unit: 'g', cost: 4.5, valid: true },
      { name: 'Brimstone Crystal', sku: 'MIN-BRM-02', category: 'MINERAL', unit: 'g', cost: 18.0, valid: true },
      { name: 'Wyrm Fang', sku: 'CRE-WYR-03', category: 'CREATURE', unit: 'pcs', cost: 65.0, valid: true },
      { name: 'Troll Blood (Unrefined)', sku: 'ESS-TRL-04', category: 'ESSENCE', unit: 'ml', cost: 12.0, valid: true },
    ]);
    setImportSuccess(false);
  };

  const handleCommitImport = () => {
    setImportSuccess(true);
    setPreviewRows([]);
  };

  const handleExport = (entity: string, format: 'CSV' | 'JSON') => {
    const data = JSON.stringify({ entity, exportedAt: new Date().toISOString(), status: 'SUCCESS' }, null, 2);
    const blob = new Blob([data], { type: format === 'JSON' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `potionpulse-${entity.toLowerCase()}-${Date.now()}.${format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileSpreadsheet className="w-7 h-7 text-potionPurple" />
              Data Import & Export Center
            </h1>
            <p className="text-sm text-paleLavender/60 mt-1">
              Bulk migration pipelines for catalogs, historical movements, and audit records.
            </p>
          </div>
        </div>

        {/* Import / Export Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Import Section */}
          <Card className="p-6 space-y-4 bg-midnight/50 border border-potionPurple/25">
            <div className="flex items-center justify-between border-b border-potionPurple/20 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-pumpkin" />
                Bulk CSV Ingestion
              </h3>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value as any)}
                className="bg-midnight px-2.5 py-1 rounded text-xs text-paleLavender border border-potionPurple/20"
              >
                <option value="INGREDIENTS">Ingredients Catalog</option>
                <option value="SUPPLIERS">Suppliers Directory</option>
              </select>
            </div>

            <p className="text-xs text-paleLavender/70">
              Upload standard UTF-8 encoded CSV files. Columns are validated prior to committing into the database.
            </p>

            {/* Drop Zone */}
            <div
              onClick={mockUploadCSV}
              className="border-2 border-dashed border-potionPurple/30 rounded-xl p-8 text-center hover:border-potionPurple cursor-pointer transition-colors bg-midnight/30 space-y-2"
            >
              <Upload className="w-8 h-8 mx-auto text-potionPurple" />
              <p className="text-xs font-semibold text-white">
                Click to load sample template / browse CSV file
              </p>
              <p className="text-[11px] text-paleLavender/50">
                Supports up to 5,000 rows per batch. Required headers: name, sku, category, unit, cost
              </p>
            </div>

            {importSuccess && (
              <div className="p-3 bg-cauldronGreen/10 border border-cauldronGreen/30 rounded-lg text-xs text-cauldronGreen flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>4 rows successfully imported into active tenant catalog!</span>
              </div>
            )}

            {previewRows.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Staged Rows Preview ({previewRows.length})</span>
                  <Badge variant="success">All rows valid</Badge>
                </div>

                <div className="max-h-48 overflow-y-auto border border-potionPurple/20 rounded-lg divide-y divide-potionPurple/15 text-xs">
                  {previewRows.map((r, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center bg-midnight/40">
                      <div>
                        <span className="font-semibold text-white">{r.name}</span>
                        <span className="text-paleLavender/50 font-mono ml-2">({r.sku})</span>
                      </div>
                      <span className="font-mono text-pumpkin">${r.cost} / {r.unit}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleCommitImport}
                  className="w-full bg-cauldronGreen hover:bg-cauldronGreen/90 text-black font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Commit Ingestion to Database
                </Button>
              </div>
            )}
          </Card>

          {/* Export Section */}
          <Card className="p-6 space-y-4 bg-midnight/50 border border-potionPurple/25">
            <div className="border-b border-potionPurple/20 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-potionPurple" />
                Tenant Snapshot Export
              </h3>
              <p className="text-xs text-paleLavender/60 mt-0.5">
                Download verified complete data dumps for archival or external analytics.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Ingredient Balances & Shelves', key: 'INVENTORY' },
                { label: 'Immutable Stock Movement Ledger', key: 'LEDGER' },
                { label: 'Sales & POS Transaction History', key: 'SALES' },
                { label: 'System Security & Role Audit Trail', key: 'AUDIT' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-3.5 bg-midnight/40 rounded-xl border border-potionPurple/15 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">{item.label}</h4>
                    <span className="text-[10px] text-paleLavender/50 font-mono">
                      Target: Current Tenant Workspace
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(item.key, 'CSV')}
                      className="h-7 px-2 text-xs flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-pumpkin" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(item.key, 'JSON')}
                      className="h-7 px-2 text-xs flex items-center gap-1"
                    >
                      <FileCode className="w-3 h-3 text-potionPurple" />
                      JSON
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
