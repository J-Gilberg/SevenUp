// export class ManageCards{

//     constructor(playerCount){
//         this.playerCount = playerCount;
//         this.deck = this.buildDeck();
//         this.startingPlayer = null;
//     }

//     buildDeck(){
//         // < 6 => 1 deck
//         // everyone needs 10+ cards
//         let numDecks = Math.ceil(10 / (53 / this.playerCount));
//         let oneDeck = []; 
//         let cardPool = []
//         let suits = ['spades','diamonds', 'clubs', 'hearts']
//         let cardValue;
//         let joker = {
//             number: 0
//             ,suit: "All"
//             ,value: 50
//             ,played: false
//             ,playerId: 0
//             ,uid: 'a00'
//         }
        

//         for (var i =0; i < numDecks; ++i){
//             oneDeck = [];
//             for (var j=0; j<4; ++j){
//                 for (var k=1; k<=13; ++k){
//                     if(k === 1) {
//                         cardValue = 15;
//                     }
//                     else if (k <=10) {
//                         cardValue = k;
//                     }
//                     else {
//                         cardValue = 10;
//                     }
//                     let strK = '0'+k
//                     oneDeck.push({number: k
//                         ,suit: suits[j]
//                         ,value: cardValue
//                         ,played: false
//                         ,player: 0
//                         ,uid: `${i}${suits[j][0]}${strK.substring(strK.length-2,strK.length)}`
//                     })
//                 }
            
//             }
//             joker.uid = i+joker.uid;
//             cardPool = [...cardPool,...oneDeck,joker]
//         }
//         return cardPool;
//     }

//     shuffle(){
//         for(let i = 0; i < this.deck.length;++i){
//             let x = Math.floor(Math.random()*this.deck.length - 1);
//             [this.deck[i], this.deck[x]] = [this.deck[x], this.deck[i]];
//         }
//     }

//     deal(){
//         this.shuffle()
//         var playerNum = 1;
//         var playerHands = [];
//         for(let i = 0; i < this.playerCount; ++i){
//             playerHands.push([]);
//         }
//         for(let j = 0; j < this.deck.length ;++j){
//             this.deck[j].playerId = playerNum;
//             if(this.deck[j].uid.substring(2,4) === 's07'){
//                 if (this.startingPlayer === null) {
//                     this.startingPlayer = playerNum;
//                 } else if (this.startingPlayer > playerNum) {
//                     this.startingPlayer = playerNum;
//                 }
//             }
//             playerHands[playerNum-1].push(this.deck[j]);
//             ++playerNum;
//             if(playerNum === this.playerCount + 1){
//                 playerNum = 1;
//             }
//         }
//         console.log(playerHands)
//         return playerHands;
//     }
// }