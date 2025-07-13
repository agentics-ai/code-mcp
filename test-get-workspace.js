#!/usr/bin/env node

import { spawn } from 'child_process';

// Test the get_workspace tool specifically
function testGetWorkspace() {
  const serverProcess = spawn('node', ['dist/src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: '/Users/braincraft/Desktop/vscode-mcp-server'
  });

  let responseData = '';

  serverProcess.stdout.on('data', (data) => {
    responseData += data.toString();
    console.log('Server output:', data.toString());
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });

  // Send initialization request
  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  };

  console.log('Sending init request:', JSON.stringify(initRequest));
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait a bit then send get_workspace tool call
  setTimeout(() => {
    const toolRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get_workspace",
        arguments: {}
      }
    };

    console.log('Sending get_workspace request:', JSON.stringify(toolRequest));
    serverProcess.stdin.write(JSON.stringify(toolRequest) + '\n');

    // Close after another timeout
    setTimeout(() => {
      serverProcess.kill();
      console.log('Test completed. Response data:', responseData);
    }, 2000);
  }, 1000);
}

testGetWorkspace();
