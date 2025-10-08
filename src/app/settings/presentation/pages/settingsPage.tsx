import { toast } from "sonner";
import { SettingsForm } from '../components/settingsForm';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Settings Form */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              Settings
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure your learning settings and notification preferences.
            </p>
          </div>
          <div className="p-6 pt-0">
            <SettingsForm 
              onSave={() => {
                toast.success('Settings saved successfully!');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}