interface AppSettings {
  childName: string;
  savedPin: string;
  notifications: boolean;
  soundEffects: boolean;
  timeRestrictions: boolean;
  maxSessionTime: number;
  notification_email: string;
  notification_frequency: 'off' | 'after_each_session' | 'daily' | 'weekly';
}

const SETTINGS_STORAGE_KEY = 'appSettings';

export const SettingsStorage = {
  /**
   * Get default settings
   */
  getDefaultSettings: (): AppSettings => ({
    childName: "Alex",
    savedPin: "1234", // Default PIN
    notifications: true,
    soundEffects: true,
    timeRestrictions: false,
    maxSessionTime: 60,
    notification_email: "glg23@ic.ac.uk", // Default email
    notification_frequency: 'off', // Default to off
  }),

  /**
   * Load settings from localStorage
   */
  loadSettings: (): AppSettings => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return { ...SettingsStorage.getDefaultSettings(), ...parsed };
      }
      return SettingsStorage.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
      return SettingsStorage.getDefaultSettings();
    }
  },

  /**
   * Save settings to localStorage
   */
  saveSettings: (settings: AppSettings): void => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      // Keep backward compatibility for child name
      localStorage.setItem('childName', settings.childName);
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  },

  /**
   * Get current PIN
   */
  getCurrentPin: (): string => {
    const settings = SettingsStorage.loadSettings();
    return settings.savedPin;
  },

  /**
   * Update PIN
   */
  updatePin: (newPin: string): boolean => {
    try {
      const settings = SettingsStorage.loadSettings();
      const updatedSettings = { ...settings, savedPin: newPin };
      SettingsStorage.saveSettings(updatedSettings);
      return true;
    } catch (error) {
      console.error('Failed to update PIN:', error);
      return false;
    }
  },

  /**
   * Get email notification settings
   */
  getEmailSettings: (): { email: string; frequency: AppSettings['notification_frequency'] } => {
    const settings = SettingsStorage.loadSettings();
    return {
      email: settings.notification_email,
      frequency: settings.notification_frequency
    };
  },

  /**
   * Check if email notifications are enabled
   */
  isEmailNotificationEnabled: (): boolean => {
    const settings = SettingsStorage.loadSettings();
    return settings.notification_frequency !== 'off' && !!settings.notification_email;
  }
};

// Export the interface for use in other files
export type { AppSettings };