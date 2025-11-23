#!/usr/bin/env node

/**
 * Railway Deployment Verification Script
 * Tests video/audio calling functionality
 */

const https = require('https');
const http = require('http');

// Configuration
const TEST_URL = process.argv[2] || 'http://localhost:3000';

console.log('🧪 Railway Deployment Test Suite\n');
console.log(`Testing URL: ${TEST_URL}\n`);

// Test 1: Health Check
async function testHealthCheck() {
  return new Promise((resolve) => {
    const protocol = TEST_URL.startsWith('https') ? https : http;
    const url = `${TEST_URL}/health`;
    
    console.log('1️⃣  Testing Health Endpoint...');
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'healthy') {
            console.log('   ✅ Health check passed');
            console.log(`   📊 Uptime: ${Math.floor(json.uptime)}s`);
            console.log(`   🌍 Environment: ${json.environment || 'unknown'}`);
            console.log(`   🔒 HTTPS: ${json.secure ? 'Yes' : 'No'}`);
            resolve(true);
          } else {
            console.log('   ❌ Health check failed');
            resolve(false);
          }
        } catch (e) {
          console.log('   ❌ Invalid response');
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve(false);
    });
  });
}

// Test 2: WebRTC Config
async function testWebRTCConfig() {
  return new Promise((resolve) => {
    const protocol = TEST_URL.startsWith('https') ? https : http;
    const url = `${TEST_URL}/api/webrtc-config`;
    
    console.log('\n2️⃣  Testing WebRTC Configuration...');
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.stunServers && json.stunServers.length > 0) {
            console.log('   ✅ WebRTC config available');
            console.log(`   🎯 STUN servers: ${json.stunServers.length}`);
            resolve(true);
          } else {
            console.log('   ❌ WebRTC config invalid');
            resolve(false);
          }
        } catch (e) {
          console.log('   ❌ Invalid response');
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve(false);
    });
  });
}

// Test 3: Static Files
async function testStaticFiles() {
  return new Promise((resolve) => {
    const protocol = TEST_URL.startsWith('https') ? https : http;
    
    console.log('\n3️⃣  Testing Static Files...');
    
    protocol.get(TEST_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (data.includes('RAOUFz') || data.includes('<!DOCTYPE html>')) {
          console.log('   ✅ Static files served correctly');
          console.log(`   📦 Response size: ${data.length} bytes`);
          resolve(true);
        } else {
          console.log('   ❌ Static files not found');
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve(false);
    });
  });
}

// Run all tests
async function runTests() {
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testWebRTCConfig());
  results.push(await testStaticFiles());
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Your app is ready for Railway.');
    console.log('\n📋 Checklist for Video/Audio Calls:');
    console.log('   ✅ Server running');
    console.log('   ✅ WebRTC configured');
    console.log('   ✅ STUN servers available');
    console.log('   ✅ Static files served');
    console.log('\n🚀 Next steps:');
    console.log('   1. Deploy to Railway');
    console.log('   2. Test video call with 2 devices');
    console.log('   3. Test audio call');
    console.log('   4. Test room sharing');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  console.log('\n');
}

// Run
runTests().catch(console.error);
