import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface GitCommit {
  hash: string;
  authorName: string;
  authorEmail: string;
  subject: string;
  authorDate: string;
  body?: string;
}

const GitLogTest: React.FC = () => {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchGitLog = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('🔍 Fetching Git log from API...');
        
        // For now, show a demo since the git-log function needs to be deployed
        // In production, this would call the Supabase Edge Function
        console.log('🔍 Git log API not deployed yet. Showing demo data...');
        
        // Demo data to show the structure
        const demoCommits: GitCommit[] = [
          {
            hash: 'd9e1abb1',
            authorName: 'VoiceVedic Team',
            authorEmail: 'team@voicevedic.com',
            subject: '🎤 INTEGRATE VOICE INTERFACE: Speech-to-Text and Text-to-Speech with automatic processing',
            authorDate: '2025-07-29T11:30:00.000Z'
          },
          {
            hash: '4f4927e2',
            authorName: 'VoiceVedic Team',
            authorEmail: 'team@voicevedic.com',
            subject: '🔧 COMPREHENSIVE FIXES: Router errors, Panchang API, and page reload issues',
            authorDate: '2025-07-29T11:25:00.000Z'
          },
          {
            hash: 'bc90d203',
            authorName: 'VoiceVedic Team',
            authorEmail: 'team@voicevedic.com',
            subject: 'Fix: Accurate event answers, no long spiritual essays, always use Panchang API as source of truth',
            authorDate: '2025-07-29T11:20:00.000Z'
          }
        ];
        
        console.log('✅ Demo Git log data loaded');
        setCommits(demoCommits);
        setLoading(false);
        
        // TODO: Uncomment when git-log function is deployed
        // const { data, error } = await supabase.functions.invoke('git-log', {
        //   body: {
        //     number: 10,
        //     fields: ['hash', 'authorName', 'authorEmail', 'subject', 'authorDate']
        //   }
        // });
        // if (error) {
        //   console.error('❌ Supabase function error:', error);
        //   setError(`API error: ${error.message}`);
        //   setLoading(false);
        //   return;
        // }
        // if (!data || !data.success) {
        //   console.error('❌ API response error:', data?.error || 'Unknown error');
        //   setError(data?.error || 'Failed to fetch Git log');
        //   setLoading(false);
        //   return;
        // }
        // console.log('✅ Git log fetched successfully:', data.commits);
        // setCommits(data.commits || []);
        // setLoading(false);

      } catch (err) {
        console.error('❌ Error fetching Git log:', err);
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      }
    };

    fetchGitLog();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const truncateHash = (hash: string) => {
    return hash.substring(0, 8);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Git Log Test</h3>
      
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Loading Git history...</span>
        </div>
      ) : error ? (
        <div className="text-red-600 text-sm">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-500">Debug Info</summary>
            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {`Git Log API: Demo Mode (API not deployed yet)
Endpoint: /functions/v1/git-log (when deployed)
Method: POST with number and fields parameters
Status: ${loading ? 'Loading...' : error ? 'Error' : 'Success'}
Demo Data: Showing sample commits from VoiceVedic repository`}
            </pre>
          </details>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">
            Showing last {commits.length} commits
          </p>
          
          {commits.length === 0 ? (
            <p className="text-gray-500 text-sm">No commits found</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {commits.map((commit, index) => (
                <div key={commit.hash} className="border border-gray-200 rounded p-3 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {truncateHash(commit.hash)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(commit.authorDate)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">#{commits.length - index}</span>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{commit.subject}</h4>
                  
                  <div className="text-xs text-gray-600">
                    <p>Author: {commit.authorName} ({commit.authorEmail})</p>
                    {commit.body && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-500">Show body</summary>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-20">
                          {commit.body}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Total commits: {commits.length}</p>
            <p>Repository: VoiceVedic (via Supabase Edge Function)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitLogTest; 