# Local Multiplayer Testing Guide

## Quick Test (2 Players)

1. **Start the game:**
   ```bash
   npm run dev
   ```

2. **Open two browser tabs:**
   - Tab 1: http://localhost:3000
   - Tab 2: http://localhost:3000

3. **Create a game:**
   - **Tab 1**: Enter name "Player1", click "Generate" for room code
   - **Tab 2**: Enter name "Player2", use the same room code
   - **Tab 1**: Click "Start Game"

4. **Test the flow:**
   - Player1 creates a prompt (e.g., "red car sunset")
   - AI generates image
   - Player2 guesses the prompt
   - See scoring in action!

## Advanced Testing (3+ Players)

### Option 1: Multiple Browser Types
- Chrome: Player 1
- Firefox: Player 2  
- Edge: Player 3

### Option 2: Incognito Windows
- Regular window: Player 1
- Incognito window: Player 2
- Private window (Firefox): Player 3

### Option 3: Mobile Testing
1. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. On your phone, go to: `http://YOUR_IP:3000`
   (e.g., http://192.168.1.100:3000)

## Test Scenarios

### Basic Flow Test
- [ ] Join room with 2+ players
- [ ] Start game
- [ ] Create prompt (check word limit)
- [ ] AI generates image
- [ ] Submit guesses
- [ ] Check scoring accuracy
- [ ] Complete round and start next

### Edge Cases to Test
- [ ] Very similar prompts vs guesses
- [ ] Exact matches (should get 100 points)
- [ ] Completely wrong guesses (should get 0-20 points)
- [ ] Player disconnection during game
- [ ] Invalid room codes
- [ ] Empty prompts/guesses

### Performance Testing
- [ ] Multiple games running simultaneously
- [ ] Long prompts (test word limit)
- [ ] Special characters in prompts
- [ ] Network disconnection/reconnection

## Debugging Tips

### Check Server Logs
Watch the terminal running the server for:
- Socket connections/disconnections
- API calls to AI service
- Error messages

### Check Browser Console
Press F12 and look for:
- Socket.io connection status
- JavaScript errors
- Network requests

### Monitor Costs
Visit: http://localhost:5000/api/costs
- Track API usage
- Monitor spending
- Verify provider is working

## Quick Demo Script

**Perfect for showing friends:**

1. **Setup (30 seconds):**
   - Start server: `npm run dev`
   - Open 2 tabs: http://localhost:3000

2. **Demo (2 minutes):**
   - Tab 1: "Alice" + Generate room "ABC123"
   - Tab 2: "Bob" + Join room "ABC123"  
   - Start game
   - Alice creates prompt: "blue ocean waves"
   - Bob guesses: "ocean blue waves" (should get ~80 points)
   - Show scoring and next round

3. **Wow factor:**
   - Show AI-generated image quality
   - Demonstrate real-time updates
   - Show cost monitoring at /api/costs