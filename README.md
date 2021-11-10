# SevenUp-SevenDown

Authors: Tim Wang https://github.com/ploki96 && Jordan Gilberg https://github.com/J-Gilberg

Tech:
Languages: JavaScript
Frontend: React
Backend: Express, Socket.io, node.js

MVP:
- Players join a room via a roomcode to play a game together.
- A complete game can be played
  - multiple rounds.
- score is tailed automatically
- error prevention
  - ensure cards are played in accordance to the rules
- do not use a database
- utilize server to handle heavy game logic
- ensure all clients display the same game state while also maintaining unique hand states

SevenUp-SevenDown is a card game typically played with 4 players. 

The Game Rules:
- All 53 cards are dealt.
- Goal is to play as many cards as you can.
- Score is tallied by the cards left in your hand
  - Aces = 15 points
  - Jack through Kings = 10 points
  - 1 though 10 = card number (example: 9 of diamonds = 9 points)
- Player with the 7 of spades starts;
- Players play cards 1+/-the seven suited.
- Turns move to the left.
- Players on their turn must attempt to play one card;
  - if the player does not have a play able card the player behind them in the turn order passes a card of their choice. 
- Game ends when a players point limit hits the set threshold (Like Hearts):
  - Player with the lowest score at this time wins
