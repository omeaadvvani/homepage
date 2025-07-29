-- Enable real-time for user_preferences table
-- This migration enables real-time subscriptions for the user_preferences table

-- Enable real-time for user_preferences table
ALTER PUBLICATION supabase_realtime ADD TABLE user_preferences;

-- Create a function to handle real-time updates for user_preferences
CREATE OR REPLACE FUNCTION handle_user_preferences_realtime()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be extended to add custom logic for real-time updates
  -- For now, it just returns the NEW record for real-time broadcasting
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for real-time updates
DROP TRIGGER IF EXISTS trigger_user_preferences_realtime ON user_preferences;
CREATE TRIGGER trigger_user_preferences_realtime
  AFTER INSERT OR UPDATE OR DELETE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_preferences_realtime();

-- Add comment to document the real-time feature
COMMENT ON TABLE user_preferences IS 'Real-time enabled table for user preferences with automatic updates'; 