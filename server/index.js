const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');

const DATA_PATH = path.join(__dirname, 'data.json');

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(
      DATA_PATH,
      JSON.stringify(
        {
          recipes: [],
          plan: { Sun: [], Mon: [], Tue: [], Wed: [], Thu: [] },
          grocery: [],
        },
        null,
        2
      )
    );
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/recipes', (req, res) => {
  const data = loadData();
  res.json(data.recipes);
});

app.post('/api/recipes', (req, res) => {
  const { title, url, tags = [], notes = '', protein = '', kidFriendly = false, glutenFree = false } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'title and url required' });
  const data = loadData();
  const recipe = {
    id: nanoid(),
    title,
    url,
    tags,
    notes,
    protein,
    kidFriendly,
    glutenFree,
  };
  data.recipes.push(recipe);
  saveData(data);
  res.json(recipe);
});

app.get('/api/plan', (req, res) => {
  const data = loadData();
  res.json(data.plan);
});

app.post('/api/plan', (req, res) => {
  const { plan } = req.body;
  if (!plan) return res.status(400).json({ error: 'plan required' });
  const data = loadData();
  data.plan = plan;
  saveData(data);
  res.json(plan);
});

app.get('/api/grocery', (req, res) => {
  const data = loadData();
  res.json(data.grocery || []);
});

app.post('/api/grocery', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
  const data = loadData();
  data.grocery = items;
  saveData(data);
  res.json(items);
});

// Serve static built frontend if present
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
