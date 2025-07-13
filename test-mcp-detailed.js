#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testMCPServer() {
  console.log('Starting MCP server test...');
  
  const serverProcess = spawn('node', ['dist/src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: '/Users/braincraft/Desktop/vscode-mcp-server'
  });

  let hasServerStarted = false;
  let responses = [];

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log('Server stdout:', output);
    
    if (output.includes('VS Code Agent MCP Server running')) {
      hasServerStarted = true;
    }
    
    // Try to parse JSON responses
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.trim() && line.startsWith('{')) {
        try {
          const response = JSON.parse(line);
          responses.push(response);
          console.log('Parsed response:', JSON.stringify(response, null, 2));
        } catch (e) {
          // Not JSON, ignore
        }
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('Server stderr:', data.toString());
  });

  serverProcess.on('error', (error) => {
    console.error('Server process error:', error);
  });

  // Wait for server to start
  await setTimeout(2000);
  
  if (!hasServerStarted) {
    console.log('Server may not have started properly. Proceeding with test...');
  }

  // Test 1: Initialize
  console.log('\n=== Test 1: Initialize ===');
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

  console.log('Sending initialize request...');
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
  
  await setTimeout(1000);

  // Test 2: List tools
  console.log('\n=== Test 2: List Tools ===');
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };

  console.log('Sending list tools request...');
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  await setTimeout(1000);

  // Test 3: Call get_workspace tool
  console.log('\n=== Test 3: Call get_workspace ===');
  const getWorkspaceRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "get_workspace",
      arguments: {}
    }
  };

  console.log('Sending get_workspace request...');
  serverProcess.stdin.write(JSON.stringify(getWorkspaceRequest) + '\n');
  
  await setTimeout(2000);

  console.log('\n=== Test Summary ===');
  console.log(`Total responses received: ${responses.length}`);
  responses.forEach((response, index) => {
    console.log(`Response ${index + 1}:`, JSON.stringify(response, null, 2));
  });

  serverProcess.kill();
  console.log('Test completed.');
}

testMCPServer().catch(console.error);
