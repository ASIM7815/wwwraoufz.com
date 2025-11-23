# ✅ Testing Checklist - Group Calling Features

## Pre-Testing Setup

- [ ] Server is running (`npm start` or `node server.js`)
- [ ] All files saved and no syntax errors
- [ ] Browser console open for debugging
- [ ] At least 2 devices/browsers available for testing

---

## Basic Room Functionality

### Room Creation
- [ ] Click "+" button opens modal
- [ ] "Create Room" generates unique room code
- [ ] Room info card appears in sidebar
- [ ] Your color is displayed in the card
- [ ] Participant count shows "1 participant"
- [ ] Room code is displayed correctly

### Room Sharing
- [ ] "Copy Link" button copies link to clipboard
- [ ] Visual feedback shows "Copied!" message
- [ ] "Share" button opens native share (mobile) or copies link
- [ ] Shared link format: `https://yoursite.com/?room=ABCD1234`
- [ ] Link is valid and clickable

### Room Joining
- [ ] Paste link in new browser/device
- [ ] Auto-joins room with the code from URL
- [ ] Gets assigned a different color than host
- [ ] Room info card appears with correct code
- [ ] Participant count updates to "2 participants"
- [ ] Both users see updated participant count

---

## Color Assignment

### First 3 Participants
- [ ] Person 1 (Host): Gets first color (Coral Red #FF6B6B)
- [ ] Person 2: Gets second color (Turquoise #4ECDC4)
- [ ] Person 3: Gets third color (Sky Blue #45B7D1)

### Color Display
- [ ] Color shows in room info card (colored circle)
- [ ] Each participant sees their own color
- [ ] All participants see different colors

### Multiple Participants
- [ ] 4th person gets 4th color
- [ ] 5th person gets 5th color
- [ ] Colors cycle after 15 participants (if testing that many)

---

## Duo Video Call (2 People)

### Call Initiation
- [ ] Click video call button in chat header
- [ ] Camera/microphone permission prompt appears
- [ ] Grant permissions
- [ ] Local video appears
- [ ] Incoming call modal appears for other user

### Call Acceptance
- [ ] Other user sees incoming call modal
- [ ] Caller name displayed correctly
- [ ] "Video Call" badge shown
- [ ] Accept button works
- [ ] Reject button works

### During Call
- [ ] Remote video displays in large view
- [ ] Local video displays in small overlay (bottom-right)
- [ ] Local video is mirrored (horizontally flipped)
- [ ] Audio works both ways
- [ ] Call duration timer starts and counts up

### Call Controls
- [ ] Mute button toggles audio
- [ ] Muted state shows visual indicator
- [ ] Video toggle button turns camera on/off
- [ ] Flip camera works (mobile only)
- [ ] End call button terminates call cleanly

### Call End
- [ ] Clicking end call stops all streams
- [ ] UI returns to chat view
- [ ] Other user's call also ends
- [ ] Cameras and mics are released

---

## Group Video Call (3+ People)

### Group Call Interface
- [ ] 3rd person joins room
- [ ] UI automatically switches to group call layout
- [ ] Grid view appears instead of large video
- [ ] All videos displayed in equal-sized tiles

### Video Grid Layout
**Test with 3 people:**
- [ ] 2×2 grid (2 columns, 2 rows)
- [ ] 3 video tiles visible (1 empty slot)

**Test with 4 people:**
- [ ] 2×2 grid fully filled
- [ ] All 4 videos visible

**Test with 5-6 people:**
- [ ] 3×2 grid (3 columns, 2 rows)
- [ ] All videos visible

**Test with 7-9 people (if possible):**
- [ ] 3×3 grid
- [ ] All videos visible

### Color-Coded Borders
- [ ] Each video tile has colored border
- [ ] Border color matches participant's assigned color
- [ ] Local video has your color
- [ ] Remote videos have their respective colors

### Name Labels
- [ ] Each video shows participant name
- [ ] Name label has colored background matching participant color
- [ ] "You" label shows on your video
- [ ] Labels are readable and positioned correctly (bottom-left)

### Participant List
- [ ] Sidebar shows list of all participants
- [ ] Each participant has colored indicator
- [ ] Participant numbers shown (1, 2, 3...)
- [ ] "You" indicator for current user
- [ ] List updates when people join/leave

### Group Call Controls
- [ ] Mute button works for all participants
- [ ] Video toggle works
- [ ] End call button works
- [ ] Share button is accessible during call
- [ ] Call duration shown and updates

---

## Audio Call (Group)

### Group Audio Interface
- [ ] Start audio call with 3+ people
- [ ] Participant list shows all members
- [ ] Audio works for all participants
- [ ] No video tiles (audio only)
- [ ] All controls functional

---

## Dynamic Participant Management

### New Participant Joins During Call
- [ ] Active call with 2 people
- [ ] 3rd person joins room
- [ ] UI switches to group layout automatically
- [ ] New video tile appears
- [ ] New participant gets unique color
- [ ] Participant count updates
- [ ] Existing participants see new person

### Participant Leaves During Call
- [ ] One participant ends call
- [ ] Their video tile disappears
- [ ] Remaining participants continue calling
- [ ] Participant count decreases
- [ ] Grid layout adjusts if needed

### Host Leaves
- [ ] Host ends call
- [ ] Other participants continue (room persists)
- [ ] No interruption to ongoing calls

### Last Participant Leaves
- [ ] Last person ends call
- [ ] Room is deleted from server
- [ ] No memory leaks

---

## Responsive Design

### Desktop (>768px)
- [ ] Sidebar visible with room info
- [ ] Grid layout with multiple columns
- [ ] All controls accessible
- [ ] Participant list on side

### Tablet (480-768px)
- [ ] Responsive grid (fewer columns)
- [ ] All features accessible
- [ ] Touch controls work
- [ ] Readable text sizes

### Mobile (<480px)
- [ ] Single column grid layout
- [ ] Stacked video tiles
- [ ] Mobile controls optimized
- [ ] Share button works
- [ ] Native share API functional

---

## Network & Performance

### Connection Quality
- [ ] Video streams start within 2-3 seconds
- [ ] No significant lag or delay
- [ ] Audio is clear
- [ ] Video is smooth (not choppy)

### Bandwidth
**With 2 people:**
- [ ] Total bandwidth < 2 Mbps

**With 4 people:**
- [ ] Total bandwidth < 5 Mbps

**With 6 people:**
- [ ] Total bandwidth < 7 Mbps

### CPU Usage
- [ ] Browser doesn't freeze
- [ ] CPU usage reasonable (<70%)
- [ ] No excessive battery drain on mobile

---

## Edge Cases

### Permissions
- [ ] Denying camera permission shows error
- [ ] Denying microphone permission shows error
- [ ] Error messages are user-friendly

### Network Issues
- [ ] Weak WiFi: Call quality degrades gracefully
- [ ] Connection lost: Reconnection attempted
- [ ] Disconnection: Other participants notified

### Multiple Tabs
- [ ] Opening room in 2 tabs handled properly
- [ ] No conflicts between tabs
- [ ] Camera/mic not shared between tabs

### Refresh During Call
- [ ] Refresh page during call
- [ ] Can rejoin call after refresh
- [ ] Other participants not disrupted

---

## Browser Compatibility

### Chrome
- [ ] All features work
- [ ] Performance is good
- [ ] Native share API works

### Firefox
- [ ] All features work
- [ ] Performance is good
- [ ] Copy link fallback works (no native share)

### Safari
- [ ] All features work
- [ ] iOS Safari tested
- [ ] WebRTC permissions work
- [ ] Native share API works

### Edge
- [ ] All features work
- [ ] Chromium-based features work
- [ ] Native share API works

---

## Security & Privacy

### Media Privacy
- [ ] No video/audio stored on server
- [ ] Streams stop when call ends
- [ ] Camera light turns off after call

### Room Privacy
- [ ] Can't join without room code
- [ ] Room codes are random and secure
- [ ] No public room listing

### Data Privacy
- [ ] No participant data persisted
- [ ] Rooms auto-delete when empty
- [ ] Colors not stored after disconnect

---

## Integration with Existing Features

### Chat Messages
- [ ] Messages work during call
- [ ] End-to-end encryption still works
- [ ] Messages appear in real-time

### Room Management
- [ ] Creating room works with existing flow
- [ ] Joining room works with existing flow
- [ ] All existing features still functional

### Backward Compatibility
- [ ] Duo calls (2 people) work as before
- [ ] No breaking changes to existing features
- [ ] Legacy UI available for duo calls

---

## Final Checks

### Code Quality
- [ ] No console errors
- [ ] No JavaScript exceptions
- [ ] All promises handled properly
- [ ] Memory leaks checked (dev tools)

### User Experience
- [ ] Smooth transitions
- [ ] Visual feedback for actions
- [ ] Loading states shown where needed
- [ ] Error messages are helpful

### Documentation
- [ ] README files created
- [ ] Quick start guide available
- [ ] Feature documentation complete
- [ ] Technical docs for developers

---

## Test Results

**Date Tested:** _______________

**Tester:** _______________

**Browsers Tested:**
- [ ] Chrome v____
- [ ] Firefox v____
- [ ] Safari v____
- [ ] Edge v____

**Devices Tested:**
- [ ] Desktop
- [ ] Laptop
- [ ] Tablet
- [ ] Mobile (iOS)
- [ ] Mobile (Android)

**Number of Participants Tested:**
- [ ] 2 participants
- [ ] 3 participants
- [ ] 4 participants
- [ ] 6 participants
- [ ] 9 participants

**Overall Status:**
- [ ] ✅ All tests passed
- [ ] ⚠️ Minor issues found (list below)
- [ ] ❌ Major issues found (list below)

**Issues Found:**
```
1. 
2. 
3. 
```

**Notes:**
```




```

---

## Sign-Off

**Tested By:** _______________

**Date:** _______________

**Status:** ☐ Ready for Production | ☐ Needs Fixes

---

*Use this checklist to ensure all group calling features work correctly before deployment.*
