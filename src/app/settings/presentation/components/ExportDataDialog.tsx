/**
 * ExportDataDialog Component
 * 
 * Modal for exporting user data in JSON or CSV format.
 * Allows selecting which data to export (settings, wordbook, or both).
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/shared/presentation/components/ui/dialog';
import { Button } from '@/app/shared/presentation/components/ui/button';
import { Label } from '@/app/shared/presentation/components/ui/label';
import { Checkbox } from '@/app/shared/presentation/components/ui/checkbox';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDataDialog({ open, onOpenChange }: ExportDataDialogProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [exportSettings, setExportSettings] = useState(true);
  const [exportWordbook, setExportWordbook] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!exportSettings && !exportWordbook) {
      toast.error('Please select at least one data type to export');
      return;
    }

    setLoading(true);

    try {
      const exports: Promise<void>[] = [];

      if (exportSettings) {
        exports.push(
          fetch(`/api/settings?format=${format}`, {
            credentials: 'include',
          }).then(async (response) => {
            if (!response.ok) throw new Error('Failed to export settings');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lass-settings-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          })
        );
      }

      if (exportWordbook) {
        exports.push(
          fetch(`/api/word_book_entry?format=${format}`, {
            credentials: 'include',
          }).then(async (response) => {
            if (!response.ok) throw new Error('Failed to export wordbook');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lass-wordbook-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          })
        );
      }

      await Promise.all(exports);
      toast.success('Data exported successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Your Data</DialogTitle>
          <DialogDescription>
            Download your data in JSON or CSV format. You can select which data to export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
                  className="h-4 w-4"
                />
                <span className="text-sm">JSON (recommended)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
                  className="h-4 w-4"
                />
                <span className="text-sm">CSV (spreadsheet)</span>
              </label>
            </div>
          </div>

          {/* Data Type Selection */}
          <div className="space-y-3">
            <Label>Data to Export</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="settings"
                checked={exportSettings}
                onCheckedChange={(checked) => setExportSettings(checked as boolean)}
              />
              <label
                htmlFor="settings"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Settings
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wordbook"
                checked={exportWordbook}
                onCheckedChange={(checked) => setExportWordbook(checked as boolean)}
              />
              <label
                htmlFor="wordbook"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Wordbook Entries
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
