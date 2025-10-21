/**
 * ConsentDialog Component
 * 
 * Displays GDPR consent information when users attempt to sign in for the first time.
 * Consent is stored in localStorage (client-side only).
 * 
 * This dialog appears before redirecting to OAuth providers.
 * Once accepted, it won't show again.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Shield } from 'lucide-react';

interface ConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentDialog({ open, onAccept, onDecline }: ConsentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6" />
            <DialogTitle>Privacy & Data Protection</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              Before you sign in, please review how we handle your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <strong>Account Data:</strong> We store your email address and authentication information from GitHub or Google.
              </li>
              <li>
                <strong>Learning Data:</strong> Your settings and wordbook entries are stored on our servers to sync across devices.
              </li>
              <li>
                <strong>Cookies:</strong> We use cookies to keep you signed in and maintain your session.
              </li>
              <li>
                <strong>Your Rights:</strong> You can export or delete all your data anytime from the Settings page.
              </li>
            </ul>
            <p className="text-sm">
              We comply with GDPR requirements and respect your privacy. By signing in, you consent to this data processing.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDecline}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onAccept}
            className="w-full sm:w-auto"
          >
            I Agree & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
