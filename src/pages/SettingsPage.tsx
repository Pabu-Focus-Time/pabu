import { useState } from "react";
import { ArrowLeft, Shield, Clock, User, Bell, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { SessionIndicator } from "@/components/SessionIndicator";
import redPandaLogo from "../assets/pabu_logo.png";
import { SettingsStorage } from "@/utils/settingsStorage";
import { EmailService } from "@/services/emailService";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Load settings from localStorage with temporary PIN fields
  const loadComponentSettings = () => {
    const savedSettings = SettingsStorage.loadSettings();
    return {
      ...savedSettings,
      parentPin: "", // Temporary field for current PIN entry
      newPin: "",    // Temporary field for new PIN
      confirmPin: "" // Temporary field for PIN confirmation
    };
  };

  const [settings, setSettings] = useState(loadComponentSettings());

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    if (settings.newPin && settings.newPin !== settings.confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "New PIN and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }

    // Prepare settings to save (exclude temporary PIN fields)
    const settingsToSave = {
      childName: settings.childName,
      savedPin: settings.newPin || settings.savedPin, // Update PIN if new one provided
      notifications: settings.notifications,
      soundEffects: settings.soundEffects,
      timeRestrictions: settings.timeRestrictions,
      maxSessionTime: settings.maxSessionTime,
      notification_email: settings.notification_email || '',
      notification_frequency: settings.notification_frequency || 'off'
    };

    try {
      // Save all settings using utility
      SettingsStorage.saveSettings(settingsToSave);
      
      // Update state to reflect saved PIN and clear temporary fields
      setSettings(prev => ({
        ...prev,
        savedPin: settingsToSave.savedPin,
        parentPin: "",
        newPin: "",
        confirmPin: ""
      }));

      toast({
        title: "Settings Saved",
        description: settings.newPin ? 
          "Settings saved and PIN updated successfully." : 
          "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const settingSections = [
    {
      title: "Profile Settings",
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="childName">Child's Name</Label>
            <Input
              id="childName"
              value={settings.childName}
              onChange={(e) => handleInputChange('childName', e.target.value)}
            />
          </div>
        </div>
      )
    },
    {
      title: "Security",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentPin">Current Parent PIN</Label>
            <Input
              id="currentPin"
              type="password"
              value={settings.parentPin}
              onChange={(e) => handleInputChange('parentPin', e.target.value)}
              placeholder="Enter current PIN to change"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Current PIN: {settings.savedPin}
            </p>
          </div>
          <div>
            <Label htmlFor="newPin">New PIN (Optional)</Label>
            <Input
              id="newPin"
              type="password"
              value={settings.newPin}
              onChange={(e) => handleInputChange('newPin', e.target.value)}
              placeholder="Enter new PIN"
            />
          </div>
          <div>
            <Label htmlFor="confirmPin">Confirm New PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              value={settings.confirmPin}
              onChange={(e) => handleInputChange('confirmPin', e.target.value)}
              placeholder="Confirm new PIN"
            />
          </div>
        </div>
      )
    },
    {
      title: "Time Management",
      icon: Clock,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Time Restrictions</Label>
              <p className="text-sm text-muted-foreground">
                Limit session duration for projects
              </p>
            </div>
            <Switch
              checked={settings.timeRestrictions}
              onCheckedChange={(checked) => handleInputChange('timeRestrictions', checked)}
            />
          </div>
          
          {settings.timeRestrictions && (
            <div>
              <Label htmlFor="maxSessionTime">Maximum Session Time (minutes)</Label>
              <Input
                id="maxSessionTime"
                type="number"
                value={settings.maxSessionTime}
                onChange={(e) => handleInputChange('maxSessionTime', parseInt(e.target.value) || 60)}
                min="5"
                max="240"
              />
            </div>
          )}
        </div>
      )
    },
    {
      title: "Preferences",
      icon: Bell,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show completion notifications
              </p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => handleInputChange('notifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Sound Effects</Label>
              <p className="text-sm text-muted-foreground">
                Play sounds for interactions
              </p>
            </div>
            <Switch
              checked={settings.soundEffects}
              onCheckedChange={(checked) => handleInputChange('soundEffects', checked)}
            />
          </div>
        </div>
      )
    },
    {
      title: "Email Notifications",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="notification_email">Notification Email</Label>
            <Input
              id="notification_email"
              type="email"
              value={settings.notification_email || ''}
              onChange={(e) => handleInputChange('notification_email', e.target.value)}
              placeholder="Enter email for notifications"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Email address where session summaries will be sent
            </p>
          </div>
          
          <div>
            <Label htmlFor="notification_frequency">Notification Frequency</Label>
            <select
              id="notification_frequency"
              value={settings.notification_frequency || 'off'}
              onChange={(e) => handleInputChange('notification_frequency', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="off">No email notifications</option>
              <option value="after_each_session">After each session</option>
              <option value="daily">Daily summary</option>
              <option value="weekly">Weekly summary</option>
            </select>
            <p className="text-sm text-muted-foreground mt-1">
              Choose how often you want to receive email summaries
            </p>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Settings:</span>
                <span className="text-sm text-muted-foreground">
                  {settings.notification_email || 'No email set'} - 
                  {settings.notification_frequency === 'off' ? 'Disabled' : 
                   settings.notification_frequency === 'after_each_session' ? 'After each session' :
                   settings.notification_frequency === 'daily' ? 'Daily' : 
                   settings.notification_frequency === 'weekly' ? 'Weekly' : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {settings.notification_email && 
           settings.notification_frequency !== 'off' && 
           EmailService?.isValidEmail && 
           EmailService.isValidEmail(settings.notification_email) && (
            <Button
              onClick={async () => {
                try {
                  const success = await EmailService.testEmail(settings.notification_email, settings.childName);
                  toast({
                    title: success ? "Test Email Sent!" : "Email Failed",
                    description: success 
                      ? "Check your inbox for the test email" 
                      : "Failed to send test email. Please check your settings.",
                    variant: success ? "default" : "destructive"
                  });
                } catch (error) {
                  console.error('Test email error:', error);
                  toast({
                    title: "Email Failed",
                    description: "Failed to send test email. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Test Email
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <SessionIndicator />
      {/* Back to Projects Button */}
      <div className="absolute top-6 left-6">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Button>
      </div>

      {/* Centered Logo */}
      <div className="flex flex-col items-center pt-8 pb-12">
        <div className="mb-8">
          <img 
            src={redPandaLogo} 
            alt="Logo" 
            className="w-24 h-24 mx-auto"
          />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {settingSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {section.content}
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveSettings} className="flex-1">
              Save Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}