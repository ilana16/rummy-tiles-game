# Rummy Tiles - Live Multiplayer Game

A modern, web-based implementation of the classic Rummy tile game with real-time multiplayer functionality, AI opponents, and a beautiful tabletop-inspired interface.

![Rummy Tiles Game](https://img.shields.io/badge/Game-Rummy%20Tiles-orange) ![React](https://img.shields.io/badge/React-18.3.1-blue) ![Node.js](https://img.shields.io/badge/Node.js-22.13.0-green) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black)

## 🎮 Features

### Core Gameplay
- **Classic Rummy Rules**: Form sets of 3+ tiles (groups or runs)
- **Initial Meld Requirement**: First play must be worth 30+ points
- **Table Manipulation**: Rearrange existing sets after initial meld
- **Joker Support**: Wild jokers with 30-point penalty
- **Win Condition**: First player to use all tiles wins

### Multiplayer Experience
- **Real-time Multiplayer**: Up to 4 players per game
- **Private Game Rooms**: Create custom game codes
- **AI Opponents**: Three difficulty levels (Easy, Medium, Hard)
- **Live Chat**: In-game messaging system
- **Spectator Mode**: Watch games in progress

### Modern Interface
- **Responsive Design**: Works on desktop and mobile
- **3D Tile Effects**: Beautiful tile animations and shadows
- **Tabletop Aesthetic**: Classic wood and felt textures
- **Intuitive Controls**: Drag-and-drop tile manipulation
- **Real-time Updates**: Instant game state synchronization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ilana16/rummy-tiles-game.git
   cd rummy-tiles-game
   ```

2. **Install frontend dependencies**
   ```bash
   pnpm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Start the backend server**
   ```bash
   cd server
   npm start
   ```

5. **Start the frontend development server**
   ```bash
   pnpm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 How to Play

### Basic Rules
1. **Objective**: Be the first player to use all your tiles
2. **Sets**: Form groups (same number, different colors) or runs (consecutive numbers, same color)
3. **Initial Meld**: Your first play must be worth at least 30 points
4. **Manipulation**: After initial meld, you can rearrange table sets
5. **Jokers**: Use jokers as wild cards (30-point penalty if left in hand)

### Game Flow
1. **Join/Create Game**: Enter username and create or join a game room
2. **Wait for Players**: Games start with 2-4 players
3. **Draw Initial Hand**: Each player gets 14 tiles
4. **Take Turns**: Draw a tile, play sets if possible, discard if needed
5. **Win**: First player to use all tiles wins the round

### Scoring
- **Number tiles**: Face value (1-13 points)
- **Jokers**: 30 points if left in hand
- **Winner**: 0 points
- **Others**: Sum of remaining tiles

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1**: Modern UI framework
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Shadcn/UI**: Beautiful component library
- **Lucide React**: Icon library
- **Socket.IO Client**: Real-time communication

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **Socket.IO**: Real-time bidirectional communication
- **UUID**: Unique identifier generation
- **CORS**: Cross-origin resource sharing

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Git**: Version control

## 📁 Project Structure

```
rummy-tiles-game/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── LoginScreen.jsx     # User authentication
│   │   ├── MainMenu.jsx        # Game menu
│   │   ├── GameRoom.jsx        # Lobby/waiting room
│   │   ├── GameBoard.jsx       # Main game interface
│   │   ├── TileComponent.jsx   # Individual tile rendering
│   │   ├── PlayerHand.jsx      # Player's tile hand
│   │   ├── GameTable.jsx       # Table sets display
│   │   └── ChatPanel.jsx       # In-game chat
│   ├── contexts/               # React contexts
│   │   └── GameContext.jsx     # Global game state
│   ├── lib/                    # Utility libraries
│   │   ├── gameLogic.js        # Core game rules
│   │   ├── gameState.js        # State management
│   │   ├── aiBot.js           # AI opponent logic
│   │   ├── firebase.js        # Firebase configuration
│   │   └── simpleAuth.js      # Local authentication
│   └── App.jsx                 # Main application component
├── server/                      # Backend source code
│   ├── index.js                # Express server and Socket.IO
│   └── package.json           # Backend dependencies
├── public/                     # Static assets
├── package.json               # Frontend dependencies
└── README.md                  # This file
```

## 🎨 Game Components

### Tile System
- **Colors**: Red, Blue, Yellow, Black
- **Numbers**: 1-13 (two sets of each)
- **Jokers**: 2 wild jokers per game
- **Visual Design**: 3D effects with shadows and gradients

### AI Opponents
- **Easy**: Basic play, no manipulation
- **Medium**: Smart set selection, basic manipulation
- **Hard**: Advanced manipulation, strategic play

### Multiplayer Features
- **Real-time Sync**: All players see updates instantly
- **Reconnection**: Players can rejoin if disconnected
- **Game Persistence**: Games continue even if players leave
- **Chat System**: Communicate with other players

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Firebase Configuration (optional)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server Configuration
PORT=3001
```

### Game Settings
Modify game settings in `src/lib/gameLogic.js`:

```javascript
export const GAME_CONFIG = {
  INITIAL_MELD_REQUIREMENT: 30,
  JOKER_PENALTY: 30,
  MAX_PLAYERS: 4,
  INITIAL_HAND_SIZE: 14
};
```

## 🚀 Deployment

### Frontend (Netlify/Vercel)
1. Build the project: `pnpm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables

### Backend (Heroku/Railway)
1. Deploy the `server` folder
2. Set `PORT` environment variable
3. Configure CORS origins for your frontend domain

### Full Stack (Docker)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure responsive design
- Test multiplayer functionality

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Upcoming Features
- [ ] Tournament mode
- [ ] Player statistics and rankings
- [ ] Custom tile themes
- [ ] Mobile app (React Native)
- [ ] Voice chat integration
- [ ] Replay system
- [ ] Advanced AI with machine learning

### Known Issues
- [ ] Occasional sync delays in high-latency networks
- [ ] Mobile touch gestures need refinement
- [ ] AI difficulty balancing

## 🙏 Acknowledgments

- **Rummikub**: Original tile-based rummy game inspiration
- **React Team**: For the amazing framework
- **Socket.IO**: For real-time communication
- **Tailwind CSS**: For beautiful styling utilities
- **Shadcn/UI**: For elegant component designs

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ilana16/rummy-tiles-game/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ilana16/rummy-tiles-game/discussions)
- **Email**: Ilana.cunningham16@gmail.com

---

**Enjoy playing Rummy Tiles!** 🎮✨
