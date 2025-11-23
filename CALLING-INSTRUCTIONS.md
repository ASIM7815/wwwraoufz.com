# 📞 How to Use Video & Audio Calling in RAOUFz

## ✅ Simple Steps to Make Calls Work

### Method 1: **Automatic Room Creation** (EASIEST - New Feature!)
1. **Click the Video Call 📹 or Audio Call 📞 button** directly
2. The app will **automatically create a room** for you
3. You'll see a notification with your **Room Code** (e.g., `CALL_ABC123`)
4. **Share this room code** with the person you want to call
5. They need to **join your room** using that code
6. Once they join, **the call will connect automatically!** 🎉

### Method 2: **Manual Room Creation** (Traditional Method)
1. **Create or Join a Room** first:
   - Click the **"+"** button or open Room Modal
   - Choose **"Create Room"** or **"Join Room"**
   - Enter a room code (e.g., `MYROOM123`)
   - Share this code with the other person

2. **Wait for Connection**:
   - Wait for the other person to join your room
   - You'll see "Connected! 🎉" when they join

3. **Start Your Call**:
   - Click **Video Call 📹** for video calling
   - Click **Audio Call 📞** for audio calling
   - Grant camera/microphone permissions when asked

## 🔧 Troubleshooting

### "WebRTC not ready" Error
- **Solution**: Refresh the page and wait 2-3 seconds before clicking call buttons

### "No answer" Message
- **Cause**: No one has joined your room yet
- **Solution**: Share your room code and wait for someone to join

### Camera/Microphone Not Working
- **Check**: Browser permissions (click lock icon 🔒 in address bar)
- **Check**: No other app is using camera/microphone
- **Try**: Close other video call apps (Zoom, Teams, etc.)

### Call Not Connecting
1. Make sure **both users are in the same room**
2. Check that **room code matches exactly** (case-sensitive)
3. Ensure **camera/mic permissions are granted**
4. Try refreshing the page and rejoining

## 🌐 Deployment Notes (Render/Vercel)

### For Render ✅ (RECOMMENDED)
- Works perfectly with WebRTC
- Real-time WebSocket support
- No configuration needed

### For Vercel ⚠️ (Limited)
- Vercel is serverless - WebSocket may disconnect
- Better for static sites
- Use Render for full calling functionality

## 🎯 Quick Test
1. Open the app in **two different browser tabs** (or devices)
2. In Tab 1: Click Video Call - note the room code
3. In Tab 2: Join the room with that code
4. Call connects! 📞✅

## 🔐 Privacy Features
- ✅ End-to-end encrypted calls
- ✅ Vanishing chats
- ✅ No data stored on server
- ✅ Room codes required for access

---
**Need Help?** The app now auto-creates rooms when you click call buttons, making it super easy! 🚀
