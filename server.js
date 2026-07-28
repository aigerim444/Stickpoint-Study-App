const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('.')); // Serve your HTML file

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Reads from Secrets
});

// The endpoint your Stickpoint app calls
app.post('/api/claude', async (req, res) => {
  try {
    const { messages, system, max_tokens } = req.body;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 4000,
      system: system || undefined,
      messages: messages,
    });

    res.json({ text: response.content[0].text });
  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));