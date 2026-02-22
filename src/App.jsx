import React, { useEffect, useState } from 'react';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function RecipeForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [protein, setProtein] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [kidFriendly, setKid] = useState(true);
  const [glutenFree, setGF] = useState(true);

  const submit = (e) => {
    e.preventDefault();
    onAdd({ title, url, protein, tags: tags.split(',').map(t => t.trim()).filter(Boolean), notes, kidFriendly, glutenFree });
    setTitle(''); setUrl(''); setProtein(''); setTags(''); setNotes(''); setKid(true); setGF(true);
  };

  return (
    <form className="card" onSubmit={submit}>
      <h3>Add Recipe</h3>
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
      <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} required />
      <input placeholder="Protein (chicken/veg/beef/etc.)" value={protein} onChange={e => setProtein(e.target.value)} />
      <input placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} />
      <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
      <label><input type="checkbox" checked={kidFriendly} onChange={e => setKid(e.target.checked)} /> Kid-friendly</label>
      <label><input type="checkbox" checked={glutenFree} onChange={e => setGF(e.target.checked)} /> Gluten-free</label>
      <button type="submit">Save</button>
    </form>
  );
}

function RecipeList({ recipes, onSelect, selectedId }) {
  return (
    <div className="card">
      <h3>Recipes</h3>
      <div className="recipes">
        {recipes.map(r => (
          <div key={r.id} className={`recipe ${selectedId === r.id ? 'selected' : ''}`} onClick={() => onSelect(r)}>
            <div className="title">{r.title}</div>
            <div className="meta">{[r.protein, r.glutenFree ? 'GF' : '', r.kidFriendly ? 'Kid' : ''].filter(Boolean).join(' · ')}</div>
            <a href={r.url} target="_blank" rel="noreferrer">Open</a>
          </div>
        ))}
      </div>
    </div>
  );
}

function Planner({ plan, recipes, onUpdate }) {
  const setDay = (day, recipeId) => {
    const next = { ...plan, [day]: recipeId ? [recipeId] : [] };
    onUpdate(next);
  };

  return (
    <div className="card">
      <h3>Weekly Plan (Sun–Thu)</h3>
      {days.map(day => (
        <div key={day} className="day">
          <span>{day}</span>
          <select value={plan[day]?.[0] || ''} onChange={e => setDay(day, e.target.value || null)}>
            <option value="">-- choose --</option>
            {recipes.map(r => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function Grocery({ items, onSave }) {
  const [local, setLocal] = useState(items);
  useEffect(() => setLocal(items), [items]);
  const addItem = () => setLocal([...local, { id: crypto.randomUUID(), text: '', done: false }]);
  const updateItem = (id, patch) => setLocal(local.map(i => i.id === id ? { ...i, ...patch } : i));
  const removeItem = (id) => setLocal(local.filter(i => i.id !== id));
  return (
    <div className="card">
      <h3>Grocery List</h3>
      {local.map(item => (
        <div key={item.id} className="grocery-item">
          <input value={item.text} onChange={e => updateItem(item.id, { text: e.target.value })} placeholder="e.g., chicken thighs" />
          <label><input type="checkbox" checked={item.done} onChange={e => updateItem(item.id, { done: e.target.checked })} /> done</label>
          <button onClick={() => removeItem(item.id)}>x</button>
        </div>
      ))}
      <div className="actions">
        <button onClick={addItem}>Add item</button>
        <button onClick={() => onSave(local)}>Save list</button>
      </div>
    </div>
  );
}

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [plan, setPlan] = useState({});
  const [grocery, setGrocery] = useState([]);

  const load = async () => {
    const [r, p, g] = await Promise.all([
      fetchJSON('/api/recipes'),
      fetchJSON('/api/plan'),
      fetchJSON('/api/grocery'),
    ]);
    setRecipes(r);
    setPlan(p);
    setGrocery(g || []);
  };

  useEffect(() => { load(); }, []);

  const addRecipe = async (recipe) => {
    await fetchJSON('/api/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recipe) });
    load();
  };

  const updatePlan = async (next) => {
    setPlan(next);
    await fetchJSON('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: next }) });
  };

  const saveGrocery = async (items) => {
    setGrocery(items);
    await fetchJSON('/api/grocery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
  };

  return (
    <div className="layout">
      <header>
        <h1>Weekly Meal Planner</h1>
        <p>Sun–Thu dinners · GF-friendly · Whole Foods list</p>
      </header>
      <div className="grid">
        <RecipeForm onAdd={addRecipe} />
        <RecipeList recipes={recipes} onSelect={() => {}} />
        <Planner plan={plan} recipes={recipes} onUpdate={updatePlan} />
        <Grocery items={grocery} onSave={saveGrocery} />
      </div>
    </div>
  );
}
