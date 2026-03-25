const express = require('express');
const { OpenAI } = require('openai');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/summary', authMiddleware, async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: 'Create concise, clear wiki summaries in 2-3 sentences with neutral tone.'
        },
        {
          role: 'user',
          content: `Summarize this wiki content:\n\n${content}`
        }
      ],
      max_output_tokens: 180
    });

    const summary = (response.output_text || '').trim();

    if (!summary) {
      return res.status(500).json({ error: 'Failed to generate summary' });
    }

    return res.json({ summary });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
