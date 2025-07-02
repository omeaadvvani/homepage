import React, { useState } from 'react';
import { Settings, Save, RefreshCw, Trash2, CheckCircle, AlertCircle, Monitor, Smartphone, Tablet, Globe, Clock, Shield } from 'lucide-react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useAuth } from '../hooks/useAuth';

const PreferencesDemo: React.FC = () => {
  const { user } = useAuth();
  const { preferences, loading, error, upsertPreferences, updatePreferences, deletePreferences, deactivatePreferences } = useUserPreferences();
  
  const [formData, setFormData] = useState({
    language: preferences?.language || 'English',
    calendar_type: preferences?.calendar_type || 'Drik Panchang',
    location: preferences?.location || '',
    notification_time: preferences?.notification_time || '07:00'
  });
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Update form when preferences load
  React.useEffect(() => {
    if (preferences) {
      setFormData({
        language: preferences.language,
        calendar_type: preferences.calendar_type,
        location: preferences.location || '',
        notification_time: preferences.notification_time || '07:00'
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      setSaveMessage(null);

      const { error } = await upsertPreferences({
        language: formData.language,
        calendar_type: formData.calendar_type,
        location: formData.location || null,
        notification_time: formData.notification_time || null
      });

      if (error) {
        setSaveMessage({ type: 'error', text: error });
      } else {
        setSaveMessage({ type: 'success', text: 'Preferences saved successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save preferences' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your preferences? You can reactivate them later.')) return;

    try {
      setSaveLoading(true);
      setSaveMessage(null);

      const { error } = await deactivatePreferences();

      if (error) {
        setSaveMessage({ type: 'error', text: error });
      } else {
        setSaveMessage({ type: 'success', text: 'Preferences deactivated successfully!' });
        setFormData({
          language: 'English',
          calendar_type: 'Drik Panchang',
          location: '',
          notification_time: '07:00'
        });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to deactivate preferences' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete your preferences? This action cannot be undone.')) return;

    try {
      setSaveLoading(true);
      setSaveMessage(null);

      const { error } = await deletePreferences();

      if (error) {
        setSaveMessage({ type: 'error', text: error });
      } else {
        setSaveMessage({ type: 'success', text: 'Preferences deleted successfully!' });
        setFormData({
          language: 'English',
          calendar_type: 'Drik Panchang',
          location: '',
          notification_time: '07:00'
        });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to delete preferences' });
    } finally {
      setSaveLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case 'Mobile': return <Smartphone className="w-4 h-4" />;
      case 'Tablet': return <Tablet className="w-4 h-4" />;
      case 'Desktop': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-card shadow-spiritual">
        <div className="text-center">
          <Settings className="w-12 h-12 text-spiritual-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-spiritual-900 mb-2">Login Required</h3>
          <p className="text-spiritual-600">Please log in to manage your preferences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-card shadow-spiritual">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-spiritual-600" />
        <h2 className="text-2xl font-bold text-spiritual-900">User Preferences</h2>
      </div>

      {/* Status Messages */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-spiritual flex items-center gap-3 ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-spiritual">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>Error: {error}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-spiritual-800 mb-2">
            Language
          </label>
          <select
            value={formData.language}
            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-spiritual-200 rounded-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 bg-white text-spiritual-900"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Tamil">Tamil</option>
            <option value="Telugu">Telugu</option>
            <option value="Malayalam">Malayalam</option>
            <option value="Kannada">Kannada</option>
          </select>
        </div>

        {/* Calendar Type */}
        <div>
          <label className="block text-sm font-medium text-spiritual-800 mb-2">
            Calendar Type
          </label>
          <select
            value={formData.calendar_type}
            onChange={(e) => setFormData(prev => ({ ...prev, calendar_type: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-spiritual-200 rounded-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 bg-white text-spiritual-900"
          >
            <option value="Drik Panchang">Drik Panchang</option>
            <option value="Tamil Calendar">Tamil Calendar</option>
            <option value="Telugu Panchangam">Telugu Panchangam</option>
            <option value="ISKCON Calendar">ISKCON Calendar</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-spiritual-800 mb-2">
            Location (Optional)
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Mumbai, India"
            className="w-full px-4 py-3 border-2 border-spiritual-200 rounded-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 bg-white text-spiritual-900 placeholder-spiritual-400"
          />
        </div>

        {/* Notification Time */}
        <div>
          <label className="block text-sm font-medium text-spiritual-800 mb-2">
            Notification Time (Optional)
          </label>
          <input
            type="time"
            value={formData.notification_time}
            onChange={(e) => setFormData(prev => ({ ...prev, notification_time: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-spiritual-200 rounded-spiritual focus:border-spiritual-400 focus:outline-none focus:ring-4 focus:ring-spiritual-200/50 bg-white text-spiritual-900"
          />
        </div>

        {/* Current Preferences Display */}
        {preferences && (
          <div className="bg-spiritual-50 p-4 rounded-spiritual">
            <h3 className="font-medium text-spiritual-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Current Saved Preferences:
            </h3>
            <div className="text-sm text-spiritual-600 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Email:</strong> {preferences.email}</p>
                  <p><strong>Language:</strong> {preferences.language}</p>
                  <p><strong>Calendar:</strong> {preferences.calendar_type}</p>
                  <p><strong>Location:</strong> {preferences.location || 'Not set'}</p>
                </div>
                <div>
                  <p><strong>Notification Time:</strong> {preferences.notification_time || 'Not set'}</p>
                  <p className="flex items-center gap-1">
                    <strong>Device:</strong> 
                    {getDeviceIcon(preferences.device_type)}
                    {preferences.device_type || 'Unknown'}
                  </p>
                  <p className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <strong>Timezone:</strong> {preferences.timezone || 'Not set'}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <strong>Status:</strong> 
                    <span className={`px-2 py-1 rounded text-xs ${preferences.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {preferences.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-spiritual-200">
                <p><strong>Created:</strong> {new Date(preferences.created_at).toLocaleDateString()}</p>
                <p><strong>Last Updated:</strong> {new Date(preferences.updated_at).toLocaleDateString()}</p>
                {preferences.updated_by_admin && (
                  <p className="text-orange-600"><strong>⚠️ Last update was made by admin</strong></p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saveLoading || loading}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-spiritual-400 to-spiritual-500 hover:from-spiritual-500 hover:to-spiritual-600 text-white font-semibold rounded-spiritual shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saveLoading ? 'Saving...' : 'Save Preferences'}
          </button>

          {preferences && preferences.is_active && (
            <button
              onClick={handleDeactivate}
              disabled={saveLoading || loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-spiritual shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-4 h-4" />
              Deactivate
            </button>
          )}

          {preferences && (
            <button
              onClick={handleDelete}
              disabled={saveLoading || loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-spiritual shadow-spiritual hover:shadow-spiritual-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreferencesDemo;