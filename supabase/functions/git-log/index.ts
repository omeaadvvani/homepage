import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { exec } from "https://deno.land/x/exec/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitCommit {
  hash: string;
  authorName: string;
  authorEmail: string;
  subject: string;
  authorDate: string;
  body?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { number = 10, fields = ['hash', 'authorName', 'authorEmail', 'subject', 'authorDate'] } = body

    // Execute git log command
    const gitLogCommand = `git log --pretty=format:"%H|%an|%ae|%s|%ai" --max-count=${number}`
    
    console.log('Executing git log command:', gitLogCommand)
    
    const { stdout, stderr } = await exec(gitLogCommand)
    
    if (stderr) {
      console.error('Git log stderr:', stderr)
    }

    if (!stdout) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No git log output found',
          commits: [] 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse git log output
    const commits: GitCommit[] = stdout.trim().split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [hash, authorName, authorEmail, subject, authorDate] = line.split('|')
        return {
          hash: hash || '',
          authorName: authorName || '',
          authorEmail: authorEmail || '',
          subject: subject || '',
          authorDate: authorDate || '',
          body: '' // Git log doesn't include body by default
        }
      })

    console.log(`Found ${commits.length} commits`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        commits,
        total: commits.length,
        message: `Retrieved ${commits.length} commits`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in git-log function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        commits: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 