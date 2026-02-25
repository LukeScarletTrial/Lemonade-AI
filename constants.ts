import { FileSystemItem } from './types';

export const INITIAL_FILES: FileSystemItem[] = [
  {
    id: 'root-folder',
    name: 'project',
    type: 'folder',
    isOpen: true
  },
  {
    id: 'index-html',
    name: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello Lemonade</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to Lemonade AI 🍋</h1>
        <p>Edit this file or ask the AI to make changes!</p>
        <button id="clickBtn">Click Me</button>
        <p id="output"></p>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
    language: 'html',
    type: 'file',
    parentId: 'root-folder'
  },
  {
    id: 'style-css',
    name: 'style.css',
    content: `body {
    font-family: sans-serif;
    background-color: #fef9c3;
    color: #333;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}

.container {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

h1 {
    color: #eab308;
}

button {
    background-color: #eab308;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 1rem;
}

button:hover {
    background-color: #ca8a04;
}`,
    language: 'css',
    type: 'file',
    parentId: 'root-folder'
  },
  {
    id: 'script-js',
    name: 'script.js',
    content: `document.getElementById('clickBtn').addEventListener('click', () => {
    const output = document.getElementById('output');
    output.textContent = 'You squeezed the lemon! ' + new Date().toLocaleTimeString();
});`,
    language: 'javascript',
    type: 'file',
    parentId: 'root-folder'
  }
];

export const REACT_TEMPLATE: FileSystemItem[] = [
  { id: 'root', name: 'root', type: 'folder', isOpen: true },
  {
    id: 'pkg-json',
    name: 'package.json',
    type: 'file',
    language: 'json',
    parentId: 'root',
    content: `{
  "name": "react-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`
  },
  {
    id: 'index-html',
    name: 'index.html',
    type: 'file',
    language: 'html',
    parentId: 'root',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>React App</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="index.jsx"></script>
</body>
</html>`
  },
  {
    id: 'index-jsx',
    name: 'index.jsx',
    type: 'file',
    language: 'javascript',
    parentId: 'root',
    content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);`
  },
  {
    id: 'app-jsx',
    name: 'App.jsx',
    type: 'file',
    language: 'javascript',
    parentId: 'root',
    content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>🍋 React on Lemonade AI</h1>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
           padding: '10px 20px', 
           fontSize: '16px', 
           background: '#eab308', 
           color: 'white', 
           border: 'none', 
           borderRadius: '5px',
           cursor: 'pointer'
        }}
      >
        Increment
      </button>
    </div>
  );
}`
  }
];

export const NODE_TEMPLATE: FileSystemItem[] = [
  { id: 'root', name: 'root', type: 'folder', isOpen: true },
  {
    id: 'pkg-json',
    name: 'package.json',
    type: 'file',
    language: 'json',
    parentId: 'root',
    content: `{
  "name": "node-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}`
  },
  {
    id: 'index-js',
    name: 'index.js',
    type: 'file',
    language: 'javascript',
    parentId: 'root',
    content: `const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello from Lemonade Node.js!');
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});`
  },
  {
    id: 'readme',
    name: 'README.md',
    type: 'file',
    language: 'markdown',
    parentId: 'root',
    content: `# Node.js Project

This is a Node.js project template.
Note: You cannot run a server directly in this browser IDE, 
but you can write code, export it, and run it locally.`
  }
];

export const SYSTEM_INSTRUCTION = `You are Lemonade AI, an expert coding assistant embedded in a web IDE.
Your goal is to help users write, debug, and refactor code.
You have the ability to CREATE, UPDATE, and DELETE files in the user's workspace.

When the user asks for changes:
1. Analyze the request.
2. Return a JSON response describing your thoughts and the specific file actions to take.

Your response MUST be a valid JSON object matching this schema:
{
  "explanation": "A brief explanation of what you are doing.",
  "actions": [
    {
      "type": "create" | "update" | "delete",
      "filePath": "relative path (e.g., 'index.html', 'src/app.js')",
      "content": "The full content of the file (required for create/update)"
    }
  ]
}

- Always provide the FULL content for 'update' actions; do not use diffs.
- Be concise in your explanation.
- Assume the root directory is standard.
- Use best practices for code.
- IMPORTANT: Return ONLY raw JSON. Do not use Markdown code blocks (e.g., \`\`\`json).`;

export const PROVIDER_MODELS = {
  gemini: [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-pro-preview-05-06',
    'gemini-2.5-pro-preview',
    'gemini-2.5-pro',
    'gemini-2.5-flash-preview-09-2025',
    'gemini-2.5-flash-lite-preview-09-2025',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite-001',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-exp:free',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash'
  ],
  chatgpt_puter: [
    'gpt-5.2',
    'gpt-5.2-chat',
    'gpt-5.2-pro',
    'gpt-5.1',
    'gpt-5.1-chat-latest',
    'gpt-5.1-codex',
    'gpt-5.1-codex-max',
    'gpt-5.1-codex-mini',
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-5-chat-latest',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-4.5-preview',
    'gpt-4o',
    'gpt-4o-mini',
    'o1',
    'o1-mini',
    'o1-pro',
    'o3',
    'o3-mini',
    'o4-mini',
    'openrouter:openai/gpt-oss-120b',
    'openrouter:openai/gpt-oss-120b:exacto',
    'openrouter:openai/gpt-oss-20b',
    'openrouter:openai/gpt-oss-20b:free',
    'openrouter:openai/gpt-oss-safeguard-20b',
    'openrouter:openai/codex-mini',
    'openrouter:openai/gpt-5-codex',
    'openrouter:openai/gpt-5.1-codex',
    'openrouter:openai/gpt-5.1-codex-max',
    'openrouter:openai/gpt-5.1-codex-mini'
  ],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  deepseek: ['deepseek-chat', 'deepseek-coder'],
  grok: ['grok-beta']
};