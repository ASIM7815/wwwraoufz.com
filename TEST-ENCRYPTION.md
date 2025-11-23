# 🧪 Testing E2E Text Message Encryption

## Quick Test Guide

### ✅ Test 1: Verify Encryption is Active

1. **Start the server:**
   ```powershell
   node server.js
   ```

2. **Open two browser windows:**
   - Window A: http://localhost:3000
   - Window B: http://localhost:3000

3. **In Window A:**
   - Click "Create Room"
   - Copy the 16-character room code
   - Open Browser Console (F12)
   - Look for: `✅ TEXT MESSAGES WILL BE END-TO-END ENCRYPTED`

4. **In Window B:**
   - Click "Join Room"
   - Paste the room code
   - Open Browser Console (F12)
   - Look for: `✅ TEXT MESSAGES WILL BE END-TO-END ENCRYPTED`

5. **Send a test message from Window A:**
   - Type: "This is a secret message"
   - Press Enter
   - Check console: `🔐 Message encrypted before sending`

6. **Check Window B:**
   - Message should appear decrypted
   - Check console: `🔓 Message decrypted successfully`

7. **Check UI:**
   - Both windows should show green padlock icon (🔒)
   - Text: "Messages are end-to-end encrypted"

---

### ✅ Test 2: Verify Server Cannot Read Messages

1. **Look at server terminal while sending messages**

2. **Expected output:**
   ```
   🔐 Encrypted message relayed in room ABC12345 from User_xyz
   ```

3. **You should NOT see:**
   - ❌ The actual message text
   - ❌ "This is a secret message"
   - ❌ Any plain text content

---

### ✅ Test 3: Network Inspection

1. **In browser, open DevTools (F12)**

2. **Go to Network tab**

3. **Filter by "WS" (WebSocket)**

4. **Send a message: "Test 123"**

5. **Click on the WebSocket connection**

6. **Look at "Messages" tab**

7. **Find your message frame**

8. **You should see:**
   ```json
   {
     "encrypted": "a8f3c2e1d4b7...",
     "nonce": "x7k2m4n8p9q1...",
     "keyId": 0,
     "sender": "User_abc"
   }
   ```

9. **You should NOT see:**
   - ❌ `"text": "Test 123"`
   - ❌ Any plain text

---

### ✅ Test 4: Wrong Key Decryption

1. **Window A creates room with Code X**

2. **Window B tries to join with DIFFERENT code (wrong)**
   - This simulates man-in-the-middle attack

3. **Send message from Window A**

4. **Window B should show:**
   - `[🔒 Encrypted message]`
   - Message cannot be decrypted without correct key

---

### ✅ Test 5: Backward Compatibility

1. **Manually enter a 6-character code** (legacy mode)

2. **Console should show:**
   ```
   ⚠️ Legacy 6-character code - transport encryption only
   ```

3. **Messages will work but:**
   - No E2E encryption
   - Server can read messages
   - Only DTLS transport encryption

---

## 🔍 What to Look For

### ✅ Success Indicators:

**Console Logs:**
```
🔐 E2E Encryption initialized
✅ TEXT MESSAGES WILL BE END-TO-END ENCRYPTED
🔐 Message encrypted before sending
🔓 Message decrypted successfully
```

**UI Indicators:**
- ✅ Green padlock icon visible
- ✅ "Messages are end-to-end encrypted" text
- ✅ Messages appear normally

**Server Logs:**
```
🔐 Encrypted message relayed in room ABC12345 from User_xyz
```

**Network Traffic:**
- ✅ Base64 encoded data
- ❌ No plain text visible

---

### ❌ Failure Indicators:

**If you see these, encryption is NOT working:**

1. **Console:**
   ```
   ❌ Failed to encrypt message
   ⚠️ Web Crypto API not available
   ```

2. **UI:**
   - No padlock icon
   - No encryption message

3. **Server Logs:**
   ```
   📨 Message relayed... from User_xyz
   (without 🔐 emoji)
   ```

4. **Network:**
   ```json
   {"text": "plain text message"}
   ```

---

## 🐛 Troubleshooting

### Problem: "Encryption not initialized"

**Solution:**
- Make sure room code is 16+ characters
- Check browser supports Web Crypto API
- Try Chrome/Edge (best support)

### Problem: "[🔒 Encrypted message]" shown

**Solution:**
- Both users must use SAME room code
- Don't manually edit room codes
- Create fresh room and rejoin

### Problem: No padlock icon

**Solution:**
- Check console for errors
- Verify crypto-utils.js is loaded
- Make sure using 16-char room code

### Problem: Server shows plain text

**Solution:**
- Check you're using updated server.js
- Restart server: `node server.js`
- Clear browser cache (Ctrl+Shift+Del)

---

## 📊 Expected vs Actual

| Item | Expected | Check |
|------|----------|-------|
| Room code length | 16+ characters | ✅ |
| Console: E2E initialized | ✅ Yes | ✅ |
| Padlock icon visible | ✅ Yes | ✅ |
| Server logs encrypted | 🔐 emoji | ✅ |
| Network shows base64 | ✅ Yes | ✅ |
| Network shows plain text | ❌ No | ✅ |
| Message decrypts | ✅ Yes | ✅ |

---

## 🎯 Final Verification Checklist

- [ ] Server started without errors
- [ ] Two browser windows open
- [ ] 16-character room code generated
- [ ] Both users joined successfully
- [ ] Console shows "E2E ENCRYPTED" message
- [ ] Green padlock icon visible in UI
- [ ] Messages send and receive correctly
- [ ] Server logs show 🔐 emoji
- [ ] Network tab shows encrypted data
- [ ] No plain text in network traffic
- [ ] Wrong key shows "[🔒 Encrypted message]"

---

## 🚀 If All Tests Pass

**Congratulations!** Your chat is fully end-to-end encrypted:

✅ Messages cannot be read by server  
✅ Messages cannot be intercepted  
✅ Only users with room code can decrypt  
✅ Same security as Signal/WhatsApp  

**You're good to go! 🎉**

---

## 📞 Need Help?

If tests fail or you see unexpected behavior, check:
1. Browser console for errors
2. Server terminal for errors
3. Network tab for failed requests
4. File paths are correct

Common issues:
- Missing `crypto-utils.js` file
- Old cached files (clear cache)
- Browser doesn't support Web Crypto API
- Server not restarted after changes
