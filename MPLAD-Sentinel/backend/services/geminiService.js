// Gemini API service — generates AI risk narratives
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

let genAI = null;

function getClient() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

export async function generateRiskNarrative(project, analysisResult) {
  const client = getClient();

  // Fallback if no API key
  if (!client) {
    return analysisResult.narrative_text;
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const flagList = analysisResult.contributing_factors
      .map(f => `• ${f.flag} (weight: ${f.weight}pts) — ${f.explanation}`)
      .join('\n');

    const prompt = `You are an audit intelligence assistant for MPLAD-Sentinel, an AI-powered public transparency platform for India's MPLADS government scheme.

Given the following project information and detected anomalies, write a clear, factual, and professional 3-4 sentence risk assessment for a government auditor. 
- Use factual language; do NOT accuse anyone of fraud.
- Cite specific data points (percentages, amounts in lakhs, dates).
- End with a concrete recommendation.
- Keep it under 120 words.

Project: ${project.title}
Location: ${project.constituency}, ${project.district}, ${project.state}
Work Type: ${project.work_type}
Sanctioned Amount: ₹${project.sanctioned_amount} Lakhs
Expended Amount: ₹${project.expended_amount} Lakhs
Financial Progress: ${project.financial_progress_pct}%
Physical Progress: ${project.physical_progress_pct}%
Status: ${project.status}
Contractor: ${project.contractor_name}
Expected Completion: ${project.expected_completion}

Risk Score: ${analysisResult.risk_score}/100 (${analysisResult.risk_level.toUpperCase()})

Detected Anomalies:
${flagList || 'None'}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('[Gemini] Narrative generation failed:', err.message);
    return analysisResult.narrative_text; // graceful fallback
  }
}

export async function generateCitizenEvidenceSummary(project, reports) {
  const client = getClient();
  if (!client || reports.length === 0) return null;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const reportSummaries = reports.map((r, i) =>
      `Report ${i + 1}: Condition reported as "${r.reported_condition}". Description: "${r.description}"`
    ).join('\n');

    const prompt = `Summarise the following ${reports.length} citizen field reports about a government project in 2-3 sentences. 
Focus on the pattern of evidence and whether they consistently indicate a discrepancy with official records.
Do not name individuals. Be factual and neutral.

Official Status: ${project.status}
Project: ${project.title}, ${project.constituency}

Citizen Reports:
${reportSummaries}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    return null;
  }
}
