# MemesWar Bot

An automated bot for managing [MemesWar](https://t.me/Memes_War_Start_Bot/MemesWar?startapp=3K4X6N) tasks and activities.

## Features

- Automatic daily check-in
- Treasury rewards claiming
- Quest completion
- Guild operations
- Warbond management
- Multi-account support

## Prerequisites

- Node.js v16 or higher
- npm (Node Package Manager)

## Installation

1. Clone the repository

```bash
git clone https://github.com/Galkurta/MemeWar-BOT.git
cd MemeWar-BOT
```

2. Install dependencies

```bash
npm install
```

3. Edit `data.txt` file in the root directory

- Open Telegram Web
- Login and visit [MemesWar Bot](https://t.me/Memes_War_Start_Bot/MemesWar?startapp=3K4X6N)
- Press F12 to open Developer Tools
- Go to Network tab
- Find request to "memes-war.memecore.com"
- Copy the `telegramInitData`
- Paste it into `data.txt` (one account per line)

4. Run the bot

```bash
node main.js
```

## Features Explained

### Daily Check-in

- Automatically checks in daily for rewards
- Tracks consecutive check-in days

### Treasury Management

- Monitors treasury reward availability
- Claims rewards when available
- Shows countdown for next claim

### Quest System

- Automatically detects available quests
- Completes daily and single quests
- Claims quest rewards

### Guild Operations

- Transfers Warbonds to guild when threshold is met
- Manages guild favorites
- Monitors guild status

## Notes

- The bot runs in continuous cycles
- Each cycle processes all accounts in `data.txt`
- Default cycle interval is 65 minutes
- Minimum Warbond threshold for transfer is 1000

## Register

New to MemesWar? Register using [this link](https://t.me/Memes_War_Start_Bot/MemesWar?startapp=3K4X6N) to get started with additional benefits!

## Warning

This is an unofficial bot. Use at your own risk. The authors are not responsible for any consequences of using this bot.

## Contributing

Feel free to submit issues and pull requests to help improve the bot.

## License

[MIT License](LICENSE)
