const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const auth = require('../middleware/auth');

const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.GITHUB_TOKEN,
});

const MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini';

router.use(auth);

function stripMarkdown(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

async function generateText(prompt, systemInstruction) {
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: 1024,
  });
  return response.choices[0].message.content;
}

/**
 * POST /api/ai/screen-resume
 */
router.post('/screen-resume', async (req, res) => {
  try {
    const { resumeText, jobTitle, requirements } = req.body;
    if (!resumeText || !jobTitle) {
      return res.status(400).json({ error: 'resumeText and jobTitle are required' });
    }
    const requirementsStr = Array.isArray(requirements) ? requirements.join(', ') : requirements || '';
    const prompt = `You are an expert HR recruiter. Analyze this resume for the role of ${jobTitle}. Requirements: ${requirementsStr}. Resume: ${resumeText}. Return ONLY valid JSON (no markdown, no explanation): { "score": number (0-100), "summary": "string (2-3 sentences)", "strengths": ["string"], "gaps": ["string"], "recommendation": "Strong Fit" | "Moderate Fit" | "Weak Fit" }`;

    const rawText = await generateText(prompt);
    let parsed;
    try {
      parsed = JSON.parse(stripMarkdown(rawText));
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI response', raw: rawText });
    }
    res.json(parsed);
  } catch (err) {
    console.error('POST /ai/screen-resume error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * POST /api/ai/generate-jd
 */
router.post('/generate-jd', async (req, res) => {
  try {
    const { jobTitle, department, keySkills } = req.body;
    if (!jobTitle || !department) {
      return res.status(400).json({ error: 'jobTitle and department are required' });
    }
    const keySkillsStr = Array.isArray(keySkills) ? keySkills.join(', ') : keySkills || '';
    const prompt = `Generate a professional job description for ${jobTitle} in ${department} department. Key skills required: ${keySkillsStr}. Return ONLY valid JSON: { "title": "string", "overview": "string", "responsibilities": ["string"], "requirements": ["string"], "niceToHave": ["string"], "benefits": ["string"] }`;

    const rawText = await generateText(prompt);
    let parsed;
    try {
      parsed = JSON.parse(stripMarkdown(rawText));
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI response', raw: rawText });
    }
    res.json(parsed);
  } catch (err) {
    console.error('POST /ai/generate-jd error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * POST /api/ai/performance-summary
 */
router.post('/performance-summary', async (req, res) => {
  try {
    const { employeeName, rating, goals, achievements, managerNotes } = req.body;
    if (!employeeName || rating === undefined) {
      return res.status(400).json({ error: 'employeeName and rating are required' });
    }
    const goalsStr = Array.isArray(goals) ? goals.join(', ') : goals || 'N/A';
    const achievementsStr = Array.isArray(achievements) ? achievements.join(', ') : achievements || 'N/A';
    const prompt = `You are an HR performance review assistant. Generate a professional performance summary for ${employeeName}. Rating: ${rating}/5. Goals: ${goalsStr}. Achievements: ${achievementsStr}. Manager notes: ${managerNotes || 'None'}. Return a concise 3-4 sentence professional performance summary as plain text only, no JSON.`;

    const summary = await generateText(prompt);
    res.json({ summary: summary.trim() });
  } catch (err) {
    console.error('POST /ai/performance-summary error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * POST /api/ai/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const { role = 'employee', name = 'User', employeeData = {} } = context || {};
    const systemInstruction = 'You are HireBot, an HR assistant chatbot for HireFlow HRMS. Be helpful, professional, and concise. Keep responses under 100 words.';
    const userMessage = `The current user is a ${role} named ${name}. Their data: ${JSON.stringify(employeeData)}. Question: ${message}`;

    const reply = await generateText(userMessage, systemInstruction);
    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error('POST /ai/chat error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;
