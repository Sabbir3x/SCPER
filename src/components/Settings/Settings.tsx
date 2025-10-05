import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { TeamManagement } from './TeamManagement'; // Import the new component

interface Setting {
  key: string;
  value: any;
  description: string;
}

export const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*').order('key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        await supabase
          .from('settings')
          .update({
            value: setting.value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq('key', setting.key);
      }

      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'Settings Updated',
        entity_type: 'settings',
        details: { updated_keys: settings.map((s) => s.key) },
      });

      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-yellow-800">You don't have permission to access settings</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#212529] mb-2">Settings</h1>
          <p className="text-gray-600">Configure system parameters</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#c8f031] text-[#212529] font-semibold rounded-lg hover:bg-[#b8e021] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-200">
        {settings.map((setting) => (
          <div key={setting.key} className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <SettingsIcon size={20} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#212529] mb-1">
                  {setting.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{setting.description}</p>

                {setting.key === 'moderator_approval_required' || setting.key === 'auto_approve_enabled' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setting.value === 'true' || setting.value === true}
                      onChange={(e) => updateSetting(setting.key, e.target.checked.toString())}
                      className="w-4 h-4 rounded border-gray-300 text-[#c8f031] focus:ring-[#c8f031]"
                    />
                    <span className="text-sm text-gray-700">
                      {setting.value === 'true' || setting.value === true ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                ) : setting.key === 'follow_up_delay_days' ? (
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8f031] focus:border-transparent"
                    placeholder="[5, 12, 25]"
                  />
                ) : (
                  <input
                    type="number"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8f031] focus:border-transparent"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add the Team Management component here */}
      <TeamManagement />

    </div>
  );
};
