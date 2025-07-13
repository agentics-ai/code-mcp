#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

/**
 * Comprehensive MCP Server Test for C  console.log(`Initialize: ${hasInitResponse ? 'PASS' : 'FAIL'}`);
  console.log(`Tools List: ${hasToolsList ? 'PASS' : 'FAIL'}`);
  console.log(`Get Workspace: ${hasWorkspaceResult ? 'PASS' : 'FAIL'}`);
  console.log(`Run Command: ${hasRunCommandResult ? 'PASS' : 'FAIL'}`);
  
  // Print detailed results for run_command
  const runCommandResult = testResults.find(r => r.id === 5);
  if (runCommandResult) {
    console.log('\n📋 Run Command Result Details:');
    console.log(JSON.stringify(runCommandResult, null, 2));
  }de Desktop Compatibility
 * Tests the exact communication pattern Claude Desktop uses
 */

async function testMCPServer() {
  console.log('🧪 Testing MCP Server for Claude Desktop compatibility...\n');

  const serverProcess = spawn('node', ['dist/src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: '/Users/braincraft/Desktop/vscode-mcp-server',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  let responseBuffer = '';
  let testResults = [];

  serverProcess.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    processResponses();
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('❌ Server error:', data.toString());
  });

  function processResponses() {
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop() || ''; // Keep incomplete line

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          console.log('📨 Server response:', JSON.stringify(response, null, 2));
          testResults.push(response);
        } catch (e) {
          console.log('📝 Server output:', line);
        }
      }
    }
  }

  function sendRequest(request, description) {
    console.log(`\n🔄 ${description}`);
    console.log('📤 Request:', JSON.stringify(request, null, 2));
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  }

  // Test 1: Initialize the server
  await new Promise(resolve => setTimeout(resolve, 500));
  
  sendRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: "Claude Desktop",
        version: "1.0.0"
      }
    }
  }, "Initialize MCP Server");

  // Test 2: List available tools
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  sendRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  }, "List Available Tools");

  // Test 3: Call get_workspace tool
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  sendRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "get_workspace",
      arguments: {}
    }
  }, "Call get_workspace Tool");

  // Test 4: Call list_directory tool  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  sendRequest({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "list_directory",
      arguments: {
        path: "/Users/braincraft/Desktop/vscode-mcp-server",
        recursive: false
      }
    }
  }, "Call list_directory Tool");

  // Test 5: Call run_command tool with the failing command
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  sendRequest({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "run_command",
      arguments: {
        command: "npm run test:coverage",
        cwd: "/Users/braincraft/Desktop/vscode-mcp-server"
      }
    }
  }, "Call run_command Tool - npm run test:coverage");

  // Wait for responses and close
  await new Promise(resolve => setTimeout(resolve, 10000)); // Extended timeout for coverage command
  
  console.log('\n🏁 Test Summary:');
  console.log(`Total responses received: ${testResults.length}`);
  
  const hasInitResponse = testResults.some(r => r.id === 1 && r.result);
  const hasToolsList = testResults.some(r => r.id === 2 && r.result?.tools);
  const hasWorkspaceResult = testResults.some(r => r.id === 3 && r.result);
  const hasRunCommandResult = testResults.some(r => r.id === 5);
  const hasDirectoryResult = testResults.some(r => r.id === 4 && r.result);
  
  console.log(`✅ Initialize: ${hasInitResponse ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Tools List: ${hasToolsList ? 'PASS' : 'FAIL'}`);
  console.log(`✅ get_workspace: ${hasWorkspaceResult ? 'PASS' : 'FAIL'}`);
  console.log(`✅ list_directory: ${hasDirectoryResult ? 'PASS' : 'FAIL'}`);
  
  if (hasInitResponse && hasToolsList && hasWorkspaceResult && hasDirectoryResult) {
    console.log('\n🎉 All tests PASSED! Server should work with Claude Desktop.');
  } else {
    console.log('\n⚠️  Some tests FAILED. Check server implementation.');
  }

  serverProcess.kill();
  process.exit(0);
}

testMCPServer().catch(console.error);
