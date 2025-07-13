#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test the MCP server by sending it a message
const serverProcess = spawn('node', [join(__dirname, 'dist/src/index.js')], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';

serverProcess.stdout.on('data', (data) => {
  responseData += data.toString();
  console.log('Server response:', data.toString());
});

serverProcess.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Send initialization message
const initMessage = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {}
    },
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }
};

console.log('Sending init message:', JSON.stringify(initMessage));
serverProcess.stdin.write(JSON.stringify(initMessage) + '\n');

// Wait a bit then send list tools message
setTimeout(() => {
  const listToolsMessage = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };
  
  console.log('Sending list tools message:', JSON.stringify(listToolsMessage));
  serverProcess.stdin.write(JSON.stringify(listToolsMessage) + '\n');
}, 1000);

// Wait a bit then send get_workspace tool call
setTimeout(() => {
  const toolCallMessage = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "get_workspace",
      arguments: {}
    }
  };
  
  console.log('Sending get_workspace tool call:', JSON.stringify(toolCallMessage));
  serverProcess.stdin.write(JSON.stringify(toolCallMessage) + '\n');
}, 2000);

// Clean up after 5 seconds
setTimeout(() => {
  console.log('Terminating test...');
  serverProcess.kill();
  process.exit(0);
}, 5000);

serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
});
