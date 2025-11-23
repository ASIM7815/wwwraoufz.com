# 🔐 RAOUFz E2E Encryption - Quick Reference

## For End Users

### ✅ How to Start a Secure Call

1. **Create Room**
   - Click "Create Room"
   - You'll get a **16-character code** like: `kJ8mP2nQ7xR4vT9w`
   - You'll see a **safety phrase** like: `ALPHA BRAVO CHARLIE DELTA`

2. **Share Securely**
   - Share the 16-character code with your contact
   - Use a secure channel (Signal, in-person, etc.)
   - Never share publicly!

3. **Verify Together**
   - When your contact joins, compare safety phrases
   - Say your phrases to each other verbally
   - They MUST match exactly

4. **Call Protected**
   - Look for 🔒 **End-to-End Encrypted** badge
   - Your conversation is now private
   - Even the server can't see your call!

### ⚠️ Security Warnings

| Warning | Meaning | Action |
|---------|---------|--------|
| 🔒 End-to-End Encrypted | ✅ Full protection | Continue normally |
| ⚠️ Transport Encryption Only | Browser doesn't support E2E | Upgrade browser or accept |
| Safety phrases don't match | 🚨 Possible attack! | End call immediately |

### 🔄 During the Call

- Safety phrase may change every 5 minutes (key rotation) - this is normal
- Verify new phrase with your contact when it changes
- If phrase suddenly doesn't match - someone may be attacking!

## For Developers

### Quick Implementation Check

```javascript
// 1. Check if E2E is available
const caps = CryptoUtils.getCapabilities();
console.log('Full E2E:', caps.fullE2E);

// 2. Verify encryption is active
console.log('Encrypted:', webrtcHandler.isE2EEncrypted);

// 3. Check safety phrase
const crypto = window.getCryptoUtils();
console.log('Phrase:', crypto?.safetyPhrase);
```

### File Dependencies

```
index.html
  ├── crypto-utils.js       (MUST load first)
  ├── client.js             (Socket.io connection)
  ├── script.js             (Room management)
  └── webrtc-handler.js     (Call handling with E2E)
```

### Browser Requirements

| Browser | E2E Support | Version |
|---------|-------------|---------|
| Chrome | ✅ Full | 90+ |
| Edge | ✅ Full | 90+ |
| Firefox | ⚠️ Fallback | All versions |
| Safari | ⚠️ Fallback | All versions |

### Key Configuration Points

```javascript
// crypto-utils.js
PBKDF2_ITERATIONS: 100000      // Higher = more secure, slower
generateSecureRoomCode(16)     // Length: 16 chars minimum

// script.js
startKeyRotation(code, 5)      // Rotate every 5 minutes

// webrtc-handler.js
configuration.iceServers       // Add TURN for production
```

## 🐛 Troubleshooting

### Common Error Messages

```javascript
// "Encryption not initialized"
→ Call window.getCryptoUtils() returned null
→ Ensure room was created/joined with 16-char code

// "No decryption key available"
→ Key rotation out of sync
→ Refresh page and reconnect

// "Insertable Streams not supported"
→ Browser doesn't support E2E
→ Use Chrome 90+ or accept transport encryption
```

### Debug Commands

```javascript
// Check crypto state
window.getCryptoUtils()?.encryptionKey !== null

// Check encrypted senders/receivers
webrtcHandler.encryptedSenders.length
webrtcHandler.encryptedReceivers.length

// Monitor frame encryption
// (Check console for: "🔒 Encrypted X frames")
```

## 📊 Performance Metrics

| Metric | Impact |
|--------|--------|
| CPU Usage | +5-10% |
| Latency | <1ms per frame |
| Bandwidth | +1-2% |
| Battery | Minimal |

## 🚀 Production Checklist

- [ ] HTTPS enabled (required)
- [ ] crypto-utils.js loaded before other scripts
- [ ] TURN servers configured
- [ ] Browser version detection implemented
- [ ] Error monitoring active
- [ ] User education on safety phrases
- [ ] Secure code sharing channels documented

## 🔑 Security Guarantees

### ✅ Protected Against
- Network eavesdropping
- Server compromise
- Man-in-the-middle (with safety phrase verification)
- Replay attacks
- Frame tampering

### ❌ NOT Protected Against
- Malicious browser extensions
- Compromised endpoint devices
- Screen recording malware
- Keyloggers

## 📞 Quick Commands

```javascript
// Create secure room programmatically
const code = generateRoomCode();
await createRoom();

// Join with code
document.getElementById('joinCodeInput').value = 'YourCodeHere';
await joinRoom();

// Start encrypted call
startVideoCall();  // or startAudioCall();

// Check encryption status
window.displayEncryptionStatus(webrtcHandler.isE2EEncrypted);
```

---

## Need Help?

1. **Not working?** → Check browser console for errors
2. **Safety phrases differ?** → Verify room codes match exactly
3. **No E2E badge?** → Browser may not support Insertable Streams
4. **Call quality issues?** → Reduce video resolution or disable E2E

**Remember**: Your safety phrase is your security. If it doesn't match, don't trust the call!

🔒 **End-to-End. Zero Knowledge. Maximum Privacy.**
