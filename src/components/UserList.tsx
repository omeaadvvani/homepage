import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Mail, Calendar, MapPin, Clock, Eye, EyeOff, Database } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  calendar_tradition: string;
  preferred_language: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

interface UserPreference {
  id: string;
  user_id: string;
  email: string;
  language: string;
  calendar_type: string;
  location: string | null;
  notification_time: string | null;
  timezone: string | null;
  device_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const UserList: React.FC = () => {
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        setError(`Failed to fetch user profiles: ${profilesError.message}`);
        return;
      }

      if (profiles) {
        setUserProfiles(profiles);
        console.log('User profiles found:', profiles.length);
      }

      // Fetch user preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .order('created_at', { ascending: false });

      if (preferencesError) {
        console.error('Error fetching user preferences:', preferencesError);
        setError(`Failed to fetch user preferences: ${preferencesError.message}`);
        return;
      }

      if (preferences) {
        setUserPreferences(preferences);
        console.log('User preferences found:', preferences.length);
      }

    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskEmail = (email: string) => {
    if (!email) return 'No email';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : localPart;
    return `${maskedLocal}@${domain}`;
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">User Database</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">User Database</h3>
        </div>
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <button
          onClick={fetchUsers}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">User Database</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{userProfiles.length}</div>
          <div className="text-sm text-green-700">User Profiles</div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{userPreferences.length}</div>
          <div className="text-sm text-purple-700">User Preferences</div>
        </div>
      </div>

      {/* User Profiles */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">User Profiles ({userProfiles.length})</h4>
        {userProfiles.length === 0 ? (
          <p className="text-gray-500 text-sm">No user profiles found in database</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {userProfiles.map((profile) => (
              <div key={profile.id} className="p-3 bg-green-50 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="font-medium">
                      {showDetails ? profile.email : maskEmail(profile.email)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {profile.calendar_tradition}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.location || 'Not set'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Created: {formatDate(profile.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Preferences */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">User Preferences ({userPreferences.length})</h4>
        {userPreferences.length === 0 ? (
          <p className="text-gray-500 text-sm">No user preferences found in database</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {userPreferences.map((pref) => (
              <div key={pref.id} className="p-3 bg-purple-50 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">
                      {showDetails ? pref.email : maskEmail(pref.email)}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    pref.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {pref.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {pref.calendar_type}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pref.notification_time || 'Not set'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Created: {formatDate(pref.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Database Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h5 className="font-semibold text-blue-800 mb-2">Database Tables</h5>
        <div className="text-xs text-blue-700 space-y-1">
          <div>• user_profiles: {userProfiles.length} records</div>
          <div>• user_preferences: {userPreferences.length} records</div>
          <div>• auth.users: Requires admin access</div>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchUsers}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Refresh User Data
      </button>
    </div>
  );
};

export default UserList; 