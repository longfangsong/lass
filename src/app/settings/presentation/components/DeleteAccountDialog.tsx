/**
 * DeleteAccountDialog Component
 * 
 * Modal for deleting user account server data.
 * Simple confirmation dialog - local data remains on device.
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
import { Alert, AlertDescription } from '@/app/shared/presentation/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { metaTable } from '@/app/sync/infrastructure/tables';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {

    setLoading(true);

    try {
      // Delete settings (account)
      const settingsResponse = await fetch('/api/settings', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!settingsResponse.ok) {
        throw new Error('Failed to delete account');
      }

      // Delete wordbook
      await fetch('/api/word_book_entry', {
        method: 'DELETE',
        credentials: 'include',
      });

      toast.success('Account deleted successfully');
      
      localStorage.removeItem('lass_privacy_consent');

      // Redirect to home after short delay
      setTimeout(async () => {
        await metaTable.setVersion("WordBookEntry", 0);
        navigate('/api/auth/logout');
        window.location.reload(); // Force reload to clear auth state
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Account</DialogTitle>
          <DialogDescription>
            This will delete your account and remove all your data from our servers. Your local data will remain on this device.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> All your settings and wordbook entries on the server will be deleted.
            <br />
            You may sync local data back anytime later.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
