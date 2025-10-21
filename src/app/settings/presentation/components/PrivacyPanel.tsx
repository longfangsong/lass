/**
 * Privacy Panel Component
 * 
 * Displays user's data summary, export, and deletion options in Settings page.
 * Integrates with GDPR compliance endpoints.
 */

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/shared/presentation/components/ui/accordion';
import { Button } from '@/app/shared/presentation/components/ui/button';
import { Shield, Download, Trash2 } from 'lucide-react';
import { ExportDataDialog } from './ExportDataDialog';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { useAuth } from '@/app/shared/presentation/hooks/useAuth';

export function PrivacyPanel() {
  const { user } = useAuth();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isLoggedIn = !!user;

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="privacy">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Privacy & Data</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              {!isLoggedIn && (
                <p className="text-sm text-muted-foreground italic">
                  You must be logged in to export or delete your data.
                </p>
              )}
              
              {/* Export Data */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Export Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download all your data in JSON or CSV format.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportDialog(true)}
                  disabled={!isLoggedIn}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
              </div>

              {/* Delete Account */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-destructive">Delete Your Data on Server</h4>
                <p className="text-sm text-muted-foreground">
                  Delete your account and all associated data on the server.
                </p>
                <p className="text-sm text-muted-foreground">
                  Local data will remain on this device.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={!isLoggedIn}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />

      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
