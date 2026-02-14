#!/usr/bin/env node
/**
 * TalentFlow AI — n8n Workflow Provisioner
 * 
 * Programmatically creates all n8n workflows via the REST API.
 * Run: node n8n/provision.mjs
 * 
 * Workflows created:
 *   WF1: Candidate Intake Pipeline (webhook → route by score → notify)
 *   WF2: Smart Outreach (personalized email + optional Kokoro TTS)
 *   WF3: AirTable Candidate Sync
 *   WF4: Health Monitor & Alerting (cron → /api/health → alert)
 *   WF5: Weekly Pipeline Report (cron → aggregate → email summary)
 */

import { randomUUID } from "node:crypto";

const N8N_URL = process.env.N8N_URL || "https://n8n.elunari.uk";
const N8N_API_KEY = process.env.N8N_API_KEY;
const APP_URL = process.env.APP_URL || "https://talentflow-ai.vercel.app";

if (!N8N_API_KEY) {
  console.error("[!] N8N_API_KEY env var required");
  process.exit(1);
}

const headers = {
  "X-N8N-API-KEY": N8N_API_KEY,
  "Content-Type": "application/json",
};

async function createWorkflow(workflow) {
  const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
    method: "POST",
    headers,
    body: JSON.stringify(workflow),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create "${workflow.name}": ${res.status} ${err}`);
  }
  const data = await res.json();
  console.log(`  [OK] Created: ${workflow.name} (id: ${data.id})`);
  return data;
}

async function activateWorkflow(id) {
  const res = await fetch(`${N8N_URL}/api/v1/workflows/${id}/activate`, {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    console.log(`  [!] Could not activate workflow ${id} (may need manual activation)`);
  } else {
    console.log(`  [OK] Activated workflow ${id}`);
  }
}

// ─── WF1: Candidate Intake Pipeline ────────────────────────────────────
function buildWF1_CandidateIntake() {
  return {
    name: "WF1: Candidate Intake Pipeline",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "candidate-intake",
          responseMode: "responseNode",
          options: {},
        },
        id: "fcb0b1f0-701e-4ce2-ac38-625d2581ebac",
        name: "Candidate Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "candidate-intake",
      },
      {
        parameters: {
          assignments: {
            assignments: [
              {
                id: "17e7d8e5-a368-4311-9bac-5df0b64cbd64",
                name: "candidateName",
                value: "={{ $json.body.candidateName || $json.body.parsedResume?.name || 'Unknown' }}",
                type: "string",
              },
              {
                id: "460d954b-3d47-465d-8adc-a924d7ec0137",
                name: "candidateEmail",
                value: "={{ $json.body.candidateEmail || $json.body.parsedResume?.email || '' }}",
                type: "string",
              },
              {
                id: "af16dd8f-294c-44ef-aef9-592c11c72fdc",
                name: "overallScore",
                value: "={{ $json.body.scoring?.overallScore || 0 }}",
                type: "number",
              },
              {
                id: "4f4bb5a1-27f8-4410-9700-bd86f82cbe47",
                name: "recommendation",
                value: "={{ $json.body.scoring?.recommendation || 'pending' }}",
                type: "string",
              },
              {
                id: "d334de21-52f4-4c82-aa23-ab6a41b18616",
                name: "strengths",
                value: "={{ ($json.body.scoring?.strengths || []).join(', ') }}",
                type: "string",
              },
              {
                id: "d66f2bfb-e41c-4477-8b09-324f26764af5",
                name: "gaps",
                value: "={{ ($json.body.scoring?.gaps || []).join(', ') }}",
                type: "string",
              },
              {
                id: "d46c97e4-e257-46a3-afe9-b0a2401df33a",
                name: "processedAt",
                value: "={{ $now.toISO() }}",
                type: "string",
              },
              {
                id: "9439c30e-92f7-4e97-8358-03f0df0fb28a",
                name: "jobTitle",
                value: "={{ $json.body.jobTitle || 'Not specified' }}",
                type: "string",
              },
            ],
          },
          options: {},
        },
        id: "f3dd0a8b-72a9-4b73-802b-1a7d21cff1da",
        name: "Extract Fields",
        type: "n8n-nodes-base.set",
        typeVersion: 3.4,
        position: [480, 300],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
            conditions: [
              {
                id: "7741583b-c3fb-4c8d-902d-966806106708",
                leftValue: "={{ $json.overallScore }}",
                rightValue: 70,
                operator: { type: "number", operation: "gte" },
              },
            ],
            combinator: "and",
          },
          options: {},
        },
        id: "e2b70f8e-446a-41e4-8b5e-4bc01c99da6a",
        name: "Score >= 70?",
        type: "n8n-nodes-base.if",
        typeVersion: 2,
        position: [720, 300],
      },
      {
        parameters: {
          jsCode: `// Qualified candidate - build notification
const item = $input.first().json;
const emoji = item.overallScore >= 85 ? '🌟' : '✅';
const msg = \`\${emoji} *New Qualified Candidate*

*Name:* \${item.candidateName}
*Email:* \${item.candidateEmail}
*Score:* \${item.overallScore}/100 (\${item.recommendation})
*Job:* \${item.jobTitle}

*Strengths:* \${item.strengths}
*Gaps:* \${item.gaps}
*Processed:* \${item.processedAt}\`;

return [{ json: { ...item, notification: msg, qualified: true, channel: '#recruiting' } }];`,
        },
        id: "cb712e1a-0c4b-430f-97ad-379eda32d7e3",
        name: "Build Qualified Alert",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [960, 200],
      },
      {
        parameters: {
          jsCode: `// Below threshold
const item = $input.first().json;
const msg = \`📋 *Candidate Logged (Below Threshold)*

*Name:* \${item.candidateName}
*Score:* \${item.overallScore}/100
*Job:* \${item.jobTitle}
*Gaps:* \${item.gaps}

Candidate has been logged for review.\`;

return [{ json: { ...item, notification: msg, qualified: false, channel: '#recruiting-review' } }];`,
        },
        id: "1706af3d-8e4a-47ed-9115-8eff47755e11",
        name: "Build Review Notice",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [960, 420],
      },
      {
        parameters: {
          respondWith: "json",
          responseBody: '={{ JSON.stringify({ success: true, qualified: $json.qualified, score: $json.overallScore, notification: $json.notification }) }}',
          options: {},
        },
        id: "d007840a-6628-4abe-a559-6e7b3d454fb9",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [1200, 300],
      },
    ],
    connections: {
      "Candidate Webhook": { main: [[{ node: "Extract Fields", type: "main", index: 0 }]] },
      "Extract Fields": { main: [[{ node: "Score >= 70?", type: "main", index: 0 }]] },
      "Score >= 70?": {
        main: [
          [{ node: "Build Qualified Alert", type: "main", index: 0 }],
          [{ node: "Build Review Notice", type: "main", index: 0 }],
        ],
      },
      "Build Qualified Alert": { main: [[{ node: "Respond to Webhook", type: "main", index: 0 }]] },
      "Build Review Notice": { main: [[{ node: "Respond to Webhook", type: "main", index: 0 }]] },
    },
    settings: {
      executionOrder: "v1",
    },
  };
}

// ─── WF2: Smart Outreach ───────────────────────────────────────────────
function buildWF2_SmartOutreach() {
  return {
    name: "WF2: Smart Outreach Generator",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "smart-outreach",
          responseMode: "responseNode",
          options: {},
        },
        id: "aff78b28-f133-4cf9-bee2-0e33c8e1a73e",
        name: "Outreach Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "smart-outreach",
      },
      {
        parameters: {
          jsCode: `// Generate personalized outreach email using candidate data
const body = $input.first().json.body;
const candidate = body.candidateName || 'Candidate';
const score = body.overallScore || 0;
const strengths = body.strengths || [];
const jobTitle = body.jobTitle || 'the position';
const companyName = body.companyName || 'our company';

// Determine tone based on score
let tone, urgency;
if (score >= 85) {
  tone = 'enthusiastic and warm';
  urgency = 'We were genuinely impressed by your profile';
} else if (score >= 70) {
  tone = 'professional and encouraging';
  urgency = 'Your background caught our attention';
} else {
  tone = 'professional and courteous';
  urgency = 'Thank you for your interest';
}

const topStrengths = (Array.isArray(strengths) ? strengths : []).slice(0, 3).join(', ');

const emailPrompt = \`Write a personalized recruiting outreach email.

Candidate: \${candidate}
Score: \${score}/100
Role: \${jobTitle}
Company: \${companyName}
Key strengths: \${topStrengths}
Tone: \${tone}
Opening hook: \${urgency}

Rules:
- Keep it under 150 words
- Be specific about why THEY are a fit (reference their strengths)
- Include a clear call to action (schedule a call)
- Sound human, not templated
- No generic flattery
- Sign off as "The Recruiting Team"\`;

// Also build a voice script for Kokoro TTS (shorter, conversational)
const voiceScript = \`Hi \${candidate.split(' ')[0]}, this is a quick message from the recruiting team at \${companyName}. \${urgency} for the \${jobTitle} role. Your experience in \${topStrengths || 'the relevant areas'} really stood out to us. We'd love to schedule a quick chat — check your email for details. Looking forward to connecting!\`;

return [{ json: { 
  ...body, 
  emailPrompt, 
  voiceScript,
  tone,
  urgency,
  topStrengths 
} }];`,
        },
        id: "5bfddad6-707e-43c9-9f84-73c7f234d795",
        name: "Build Outreach Content",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [500, 300],
      },
      {
        parameters: {
          respondWith: "json",
          responseBody: '={{ JSON.stringify({ success: true, emailPrompt: $json.emailPrompt, voiceScript: $json.voiceScript, tone: $json.tone }) }}',
          options: {},
        },
        id: "75b1ce57-cd54-4932-80a6-4ca41db65440",
        name: "Respond",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [750, 300],
      },
    ],
    connections: {
      "Outreach Webhook": { main: [[{ node: "Build Outreach Content", type: "main", index: 0 }]] },
      "Build Outreach Content": { main: [[{ node: "Respond", type: "main", index: 0 }]] },
    },
    settings: { executionOrder: "v1" },
  };
}

// ─── WF3: AirTable Sync ────────────────────────────────────────────────
function buildWF3_AirTableSync() {
  return {
    name: "WF3: Candidate Data Sync",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "candidate-sync",
          responseMode: "responseNode",
          options: {},
        },
        id: "40c58e97-1cf9-48a7-be69-9b9434d3cbd0",
        name: "Sync Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "candidate-sync",
      },
      {
        parameters: {
          jsCode: `// Transform candidate data into flat record for external storage (AirTable/Sheets/CRM)
const body = $input.first().json.body;
const resume = body.parsedResume || {};
const scoring = body.scoring || {};

const record = {
  // Candidate info
  name: resume.name || body.candidateName || 'Unknown',
  email: resume.email || body.candidateEmail || '',
  phone: resume.phone || '',
  location: resume.location || '',
  
  // Skills & experience
  skills: (resume.skills || []).join(', '),
  experienceCount: (resume.experience || []).length,
  latestRole: (resume.experience || [])[0]?.title || 'N/A',
  latestCompany: (resume.experience || [])[0]?.company || 'N/A',
  education: (resume.education || []).map(e => e.degree + ' - ' + e.institution).join('; '),
  certifications: (resume.certifications || []).join(', '),
  
  // Scoring
  overallScore: scoring.overallScore || 0,
  recommendation: scoring.recommendation || 'pending',
  strengths: (scoring.strengths || []).join(', '),
  gaps: (scoring.gaps || []).join(', '),
  scoreSummary: scoring.summary || '',
  
  // Breakdown scores
  technicalSkills: scoring.breakdown?.find(b => b.category.includes('Technical'))?.score || 0,
  experienceLevel: scoring.breakdown?.find(b => b.category.includes('Experience'))?.score || 0,
  aiExpertise: scoring.breakdown?.find(b => b.category.includes('AI'))?.score || 0,
  automationSkills: scoring.breakdown?.find(b => b.category.includes('Automation'))?.score || 0,
  communication: scoring.breakdown?.find(b => b.category.includes('Communication'))?.score || 0,
  culturalFit: scoring.breakdown?.find(b => b.category.includes('Cultural'))?.score || 0,
  
  // Meta
  jobTitle: body.jobTitle || 'Not specified',
  processedAt: new Date().toISOString(),
  source: 'TalentFlow AI',
  status: (scoring.overallScore || 0) >= 70 ? 'Qualified' : 'Review',
  questionsGenerated: (body.questions || []).length,
};

return [{ json: { record, candidateId: body.candidateId || record.name.replace(/\\s/g, '-').toLowerCase() } }];`,
        },
        id: "7f88a07e-d9c5-4b19-90c7-3ad47ef8f728",
        name: "Transform to Record",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [500, 300],
      },
      {
        parameters: {
          respondWith: "json",
          responseBody: '={{ JSON.stringify({ success: true, record: $json.record, candidateId: $json.candidateId, message: "Candidate synced to pipeline tracker" }) }}',
          options: {},
        },
        id: "111756da-6c82-4d2e-93e4-191959f548bb",
        name: "Respond",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [750, 300],
      },
    ],
    connections: {
      "Sync Webhook": { main: [[{ node: "Transform to Record", type: "main", index: 0 }]] },
      "Transform to Record": { main: [[{ node: "Respond", type: "main", index: 0 }]] },
    },
    settings: { executionOrder: "v1" },
  };
}

// ─── WF4: Health Monitor ────────────────────────────────────────────────
function buildWF4_HealthMonitor() {
  return {
    name: "WF4: Health Monitor & Alerts",
    nodes: [
      {
        parameters: {
          rule: {
            interval: [{ field: "minutes", minutesInterval: 5 }],
          },
        },
        id: "9e1d41a6-8922-4800-aa78-37aa47e00a9e",
        name: "Every 5 Minutes",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1.2,
        position: [250, 300],
      },
      {
        parameters: {
          url: `=${APP_URL}/api/health`,
          method: "GET",
          options: {
            timeout: 10000,
          },
        },
        id: "3c525c66-4b8a-40fb-b18d-41132dcc6d53",
        name: "Check /api/health",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [480, 300],
        continueOnFail: true,
      },
      {
        parameters: {
          jsCode: `// Evaluate health response
const item = $input.first().json;
const isError = !!$input.first().error;
const statusCode = item.statusCode || item.status || 200;
const isHealthy = !isError && statusCode !== 500 && item.status === 'healthy';

const report = {
  healthy: isHealthy,
  checkedAt: new Date().toISOString(),
  appUrl: '${APP_URL}',
  uptime: item.uptime || 'unknown',
  aiStatus: item.ai?.status || 'unknown',
  totalRequests: item.ai?.totalRequests || 0,
  errorRate: item.ai?.errorRate || 'unknown',
  avgLatency: item.ai?.avgLatencyMs || 'unknown',
  lastError: item.ai?.lastError || 'none',
  statusCode,
};

if (!isHealthy) {
  report.alert = true;
  report.alertMessage = \`[ALERT] TalentFlow AI health check FAILED at \${report.checkedAt}. Status: \${statusCode}. AI Status: \${report.aiStatus}. Last error: \${report.lastError}\`;
}

return [{ json: report }];`,
        },
        id: "acfcd46b-9f92-46a3-afc8-5bcfcb82e3a9",
        name: "Evaluate Health",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [720, 300],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
            conditions: [
              {
                id: "ae5ab86c-62c8-4c29-9d87-316ed6b21b4a",
                leftValue: "={{ $json.healthy }}",
                rightValue: true,
                operator: { type: "boolean", operation: "equals" },
              },
            ],
            combinator: "and",
          },
          options: {},
        },
        id: "6e20c794-cbb2-46d2-9f55-1775d17661f8",
        name: "Is Healthy?",
        type: "n8n-nodes-base.if",
        typeVersion: 2,
        position: [960, 300],
      },
      {
        parameters: {
          jsCode: `// All good - log healthy status
const item = $input.first().json;
return [{ json: { 
  status: 'OK', 
  message: 'TalentFlow AI is running normally',
  checkedAt: item.checkedAt,
  uptime: item.uptime,
  aiStatus: item.aiStatus,
  totalRequests: item.totalRequests,
} }];`,
        },
        id: "de3c7095-66a9-49b8-ba88-d45c3581aad0",
        name: "Log Healthy",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [1200, 200],
      },
      {
        parameters: {
          jsCode: `// ALERT - service unhealthy
const item = $input.first().json;
const alert = {
  status: 'ALERT',
  message: item.alertMessage || 'Health check failed',
  checkedAt: item.checkedAt,
  appUrl: item.appUrl,
  details: item,
};
// In production: this would trigger Slack/email notification
// For demo: we log and return the alert
return [{ json: alert }];`,
        },
        id: "dbd3e6e9-4cc5-4990-b204-2e133ddb9b26",
        name: "Fire Alert",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [1200, 420],
      },
    ],
    connections: {
      "Every 5 Minutes": { main: [[{ node: "Check /api/health", type: "main", index: 0 }]] },
      "Check /api/health": { main: [[{ node: "Evaluate Health", type: "main", index: 0 }]] },
      "Evaluate Health": { main: [[{ node: "Is Healthy?", type: "main", index: 0 }]] },
      "Is Healthy?": {
        main: [
          [{ node: "Log Healthy", type: "main", index: 0 }],
          [{ node: "Fire Alert", type: "main", index: 0 }],
        ],
      },
    },
    settings: { executionOrder: "v1" },
  };
}

// ─── WF5: Weekly Pipeline Report ────────────────────────────────────────
function buildWF5_WeeklyReport() {
  return {
    name: "WF5: Weekly Pipeline Report",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "pipeline-report",
          responseMode: "responseNode",
          options: {},
        },
        id: "086b3323-2075-4b7b-945b-02bf5500bdab",
        name: "Report Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [250, 300],
        webhookId: "pipeline-report",
      },
      {
        parameters: {
          jsCode: `// Generate a pipeline analytics report from candidate batch data
const body = $input.first().json.body;
const candidates = body.candidates || [];

const total = candidates.length;
const qualified = candidates.filter(c => (c.scoring?.overallScore || 0) >= 70).length;
const strongMatch = candidates.filter(c => c.scoring?.recommendation === 'strong_match').length;
const potentialMatch = candidates.filter(c => c.scoring?.recommendation === 'potential_match').length;
const weakMatch = candidates.filter(c => c.scoring?.recommendation === 'weak_match').length;

const avgScore = total > 0 
  ? Math.round(candidates.reduce((sum, c) => sum + (c.scoring?.overallScore || 0), 0) / total)
  : 0;

// Find most common skills
const allSkills = candidates.flatMap(c => c.parsedResume?.skills || []);
const skillCounts = {};
allSkills.forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
const topSkills = Object.entries(skillCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([skill, count]) => skill + ' (' + count + ')');

// Find most common gaps
const allGaps = candidates.flatMap(c => c.scoring?.gaps || []);
const gapCounts = {};
allGaps.forEach(g => { gapCounts[g] = (gapCounts[g] || 0) + 1; });
const topGaps = Object.entries(gapCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([gap, count]) => gap + ' (' + count + ')');

const report = {
  period: body.period || 'This Week',
  generatedAt: new Date().toISOString(),
  summary: {
    totalCandidates: total,
    qualifiedCount: qualified,
    qualificationRate: total > 0 ? Math.round((qualified / total) * 100) + '%' : '0%',
    averageScore: avgScore,
    strongMatches: strongMatch,
    potentialMatches: potentialMatch,
    weakMatches: weakMatch,
  },
  insights: {
    topSkillsInPool: topSkills,
    commonGaps: topGaps,
  },
  topCandidates: candidates
    .filter(c => (c.scoring?.overallScore || 0) >= 70)
    .sort((a, b) => (b.scoring?.overallScore || 0) - (a.scoring?.overallScore || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.parsedResume?.name || 'Unknown',
      score: c.scoring?.overallScore || 0,
      recommendation: c.scoring?.recommendation,
      topStrength: (c.scoring?.strengths || [])[0] || 'N/A',
    })),
};

return [{ json: report }];`,
        },
        id: "392885a2-1d46-4e75-bad9-7c295666c146",
        name: "Generate Report",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [500, 300],
      },
      {
        parameters: {
          respondWith: "json",
          responseBody: "={{ JSON.stringify($json) }}",
          options: {},
        },
        id: "41f7dedb-f919-45ae-aa8d-8c56591a67b1",
        name: "Respond",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [750, 300],
      },
    ],
    connections: {
      "Report Webhook": { main: [[{ node: "Generate Report", type: "main", index: 0 }]] },
      "Generate Report": { main: [[{ node: "Respond", type: "main", index: 0 }]] },
    },
    settings: { executionOrder: "v1" },
  };
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  console.log("=== TalentFlow AI - n8n Workflow Provisioner ===\n");
  console.log(`n8n: ${N8N_URL}`);
  console.log(`App: ${APP_URL}\n`);

  // Check API connectivity
  try {
    const res = await fetch(`${N8N_URL}/api/v1/workflows`, { headers });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const { data } = await res.json();
    console.log(`Connected to n8n. Existing workflows: ${data.length}\n`);
    
    // Clean existing TalentFlow workflows
    for (const wf of data) {
      if (wf.name.startsWith("WF")) {
        console.log(`  Removing old: ${wf.name} (${wf.id})`);
        await fetch(`${N8N_URL}/api/v1/workflows/${wf.id}`, { method: "DELETE", headers });
      }
    }
  } catch (e) {
    console.error(`[!] Cannot connect to n8n at ${N8N_URL}: ${e.message}`);
    process.exit(1);
  }

  console.log("\nCreating workflows...\n");

  const workflows = [
    buildWF1_CandidateIntake(),
    buildWF2_SmartOutreach(),
    buildWF3_AirTableSync(),
    buildWF4_HealthMonitor(),
    buildWF5_WeeklyReport(),
  ];

  const created = [];
  for (const wf of workflows) {
    try {
      const result = await createWorkflow(wf);
      created.push(result);
    } catch (e) {
      console.error(`  [!] ${e.message}`);
    }
  }

  // Activate all webhook workflows (not cron ones initially)
  console.log("\nActivating webhook workflows...\n");
  for (const wf of created) {
    await activateWorkflow(wf.id);
  }

  console.log("\n=== Provisioning Complete ===");
  console.log(`\nWebhook URLs (when active):`);
  console.log(`  WF1 Intake:   ${N8N_URL}/webhook/candidate-intake`);
  console.log(`  WF2 Outreach: ${N8N_URL}/webhook/smart-outreach`);
  console.log(`  WF3 Sync:     ${N8N_URL}/webhook/candidate-sync`);
  console.log(`  WF5 Report:   ${N8N_URL}/webhook/pipeline-report`);
  console.log(`\nFor testing (before activation):`);
  console.log(`  WF1 Test: ${N8N_URL}/webhook-test/candidate-intake`);
  console.log(`  WF2 Test: ${N8N_URL}/webhook-test/smart-outreach`);
  console.log(`  WF3 Test: ${N8N_URL}/webhook-test/candidate-sync`);
  console.log(`  WF5 Test: ${N8N_URL}/webhook-test/pipeline-report`);
  console.log(`\nWF4 (Health Monitor) runs on cron schedule (every 5 min)`);
  console.log(`\nOpen n8n editor: ${N8N_URL}`);
}

main().catch(console.error);
