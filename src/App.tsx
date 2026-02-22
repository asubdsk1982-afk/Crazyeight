/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  User, 
  Cpu, 
  AlertCircle,
  ChevronRight,
  Info,
  Bomb
} from 'lucide-react';

// --- Types & Constants ---

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'BOMB';

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

type GameStatus = 'start' | 'dealing' | 'player_turn' | 'ai_turn' | 'ai2_turn' | 'suit_selection' | 'game_over';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<Suit, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-slate-900',
  spades: 'text-slate-900',
};

// --- Helpers ---

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ id: `${suit}-${rank}`, suit, rank });
    });
  });
  // Add 3 Bomb cards
  for (let i = 0; i < 3; i++) {
    deck.push({ id: `bomb-${i}`, suit: 'spades', rank: 'BOMB' });
  }
  return deck;
};

const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// --- Components ---

const CardView: React.FC<{ 
  card?: Card; 
  isFaceUp?: boolean; 
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
}> = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  className = ""
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`relative w-16 h-24 sm:w-24 sm:h-36 rounded-lg shadow-lg flex items-center justify-center cursor-pointer select-none transition-shadow
        ${isFaceUp ? 'bg-white' : 'bg-emerald-500 border-4 border-white/20'} 
        ${isPlayable ? 'ring-2 ring-yellow-400 shadow-yellow-400/50' : 'border border-slate-200'}
        ${className}`}
    >
      {isFaceUp && card ? (
        <div className={`flex flex-col items-center justify-between h-full w-full p-1 sm:p-2 ${card.rank === 'BOMB' ? 'text-orange-600' : SUIT_COLORS[card.suit]}`}>
          <div className="self-start text-xs sm:text-lg font-bold leading-none">
            {card.rank === 'BOMB' ? 'B' : card.rank}<br />
            {card.rank === 'BOMB' ? <Bomb className="w-3 h-3 sm:w-5 sm:h-5" /> : SUIT_SYMBOLS[card.suit]}
          </div>
          <div className="text-2xl sm:text-4xl">
            {card.rank === 'BOMB' ? <Bomb className="w-8 h-8 sm:w-12 sm:h-12 animate-pulse" /> : SUIT_SYMBOLS[card.suit]}
          </div>
          <div className="self-end text-xs sm:text-lg font-bold leading-none rotate-180">
            {card.rank === 'BOMB' ? 'B' : card.rank}<br />
            {card.rank === 'BOMB' ? <Bomb className="w-3 h-3 sm:w-5 sm:h-5" /> : SUIT_SYMBOLS[card.suit]}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-16 sm:w-16 sm:h-24 border-2 border-white/10 rounded flex items-center justify-center">
            <div className="text-white/20 text-2xl font-bold">T</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [ai2Hand, setAi2Hand] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [status, setStatus] = useState<GameStatus>('start');
  const [winner, setWinner] = useState<'player' | 'ai' | 'ai2' | null>(null);
  const [message, setMessage] = useState<string>("Welcome to Tina Crazy 8s!");

  // Initialize Game
  const initGame = useCallback(() => {
    const newDeck = shuffle(createDeck());
    const pHand = newDeck.splice(0, 8);
    const aHand = newDeck.splice(0, 8);
    const a2Hand = newDeck.splice(0, 8);
    
    // Ensure first discard is not an 8 for simplicity, or handle it
    let firstDiscard = newDeck.pop()!;
    while (firstDiscard.rank === '8') {
      newDeck.unshift(firstDiscard);
      firstDiscard = newDeck.pop()!;
    }

    setDeck(newDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setAi2Hand(a2Hand);
    setDiscardPile([firstDiscard]);
    setCurrentSuit(firstDiscard.suit);
    setWinner(null);
    setStatus('player_turn');
    setMessage("Your turn! Match the suit or rank.");
  }, []);

  const topCard = discardPile[discardPile.length - 1];

  const canPlay = (card: Card) => {
    if (card.rank === '8' || card.rank === 'BOMB') return true;
    return card.suit === currentSuit || card.rank === topCard.rank;
  };

  const handlePlayerPlay = (card: Card) => {
    if (status !== 'player_turn' || !canPlay(card)) return;

    const newHand = playerHand.filter(c => c.id !== card.id);
    setPlayerHand(newHand);
    setDiscardPile(prev => [...prev, card]);
    setCurrentSuit(card.suit);

    if (newHand.length === 0) {
      setWinner('player');
      setStatus('game_over');
      return;
    }

    if (card.rank === '8' || card.rank === 'BOMB') {
      setStatus('suit_selection');
      setMessage(card.rank === 'BOMB' ? "BOMB! Choose a new suit." : "Crazy 8! Choose a new suit.");
    } else {
      setStatus('ai_turn');
      setMessage("AI 1 is thinking...");
    }
  };

  const handleSuitSelection = (suit: Suit) => {
    setCurrentSuit(suit);
    setStatus('ai_turn');
    setMessage(`Suit changed to ${suit}. AI 1's turn.`);
  };

  const drawCard = (turn: 'player' | 'ai' | 'ai2') => {
    if (deck.length === 0) {
      setMessage("Draw pile is empty! Skipping turn.");
      if (turn === 'player') setStatus('ai_turn');
      else if (turn === 'ai') setStatus('ai2_turn');
      else setStatus('player_turn');
      return;
    }

    const newDeck = [...deck];
    const card = newDeck.pop()!;
    setDeck(newDeck);

    if (turn === 'player') {
      setPlayerHand(prev => [...prev, card]);
      setStatus('ai_turn');
      setMessage("You drew a card. AI 1's turn.");
    } else if (turn === 'ai') {
      setAiHand(prev => [...prev, card]);
      setStatus('ai2_turn');
      setMessage("AI 1 drew a card. AI 2's turn.");
    } else {
      setAi2Hand(prev => [...prev, card]);
      setStatus('player_turn');
      setMessage("AI 2 drew a card. Your turn!");
    }
  };

  // AI Logic
  useEffect(() => {
    if ((status === 'ai_turn' || status === 'ai2_turn') && !winner) {
      const isAI1 = status === 'ai_turn';
      const currentHand = isAI1 ? aiHand : ai2Hand;
      const setHand = isAI1 ? setAiHand : setAi2Hand;
      const nextStatus = isAI1 ? 'ai2_turn' : 'player_turn';
      const aiName = isAI1 ? 'AI 1' : 'AI 2';
      const nextName = isAI1 ? 'AI 2' : 'Your';

      const timer = setTimeout(() => {
        const playableCards = currentHand.filter(canPlay);
        
        if (playableCards.length > 0) {
          const nonEight = playableCards.find(c => c.rank !== '8');
          const cardToPlay = nonEight || playableCards[0];

          const newHand = currentHand.filter(c => c.id !== cardToPlay.id);
          setHand(newHand);
          setDiscardPile(prev => [...prev, cardToPlay]);
          
          if (newHand.length === 0) {
            setWinner(isAI1 ? 'ai' : 'ai2');
            setStatus('game_over');
            return;
          }

          if (cardToPlay.rank === '8' || cardToPlay.rank === 'BOMB') {
            const suitCounts = currentHand.reduce((acc, c) => {
              acc[c.suit] = (acc[c.suit] || 0) + 1;
              return acc;
            }, {} as Record<Suit, number>);
            const bestSuit = (Object.keys(suitCounts) as Suit[]).sort((a, b) => suitCounts[b] - suitCounts[a])[0] || 'spades';
            setCurrentSuit(bestSuit);
            const playMsg = cardToPlay.rank === 'BOMB' ? "a BOMB" : "an 8";
            setMessage(`${aiName} played ${playMsg} and chose ${bestSuit}! ${nextName} turn.`);
          } else {
            setCurrentSuit(cardToPlay.suit);
            setMessage(`${aiName} played ${cardToPlay.rank} of ${cardToPlay.suit}. ${nextName} turn!`);
          }
          setStatus(nextStatus);
        } else {
          drawCard(isAI1 ? 'ai' : 'ai2');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, aiHand, ai2Hand, winner, currentSuit, topCard]);

  return (
    <div className="min-h-screen bg-yellow-500 text-slate-900 font-sans overflow-hidden flex flex-col p-4 sm:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900/10 rounded-lg">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Tina Crazy 8s</h1>
        </div>
        <button 
          onClick={initGame}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/10 hover:bg-slate-900/20 rounded-full transition-colors text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Game
        </button>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col justify-between max-w-6xl mx-auto w-full gap-8">
        
        {/* AI Area */}
        <section className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-16">
          {/* AI 1 */}
          <div className="flex flex-col items-center gap-2">
            <div className={`flex items-center gap-2 text-sm font-medium uppercase tracking-widest transition-colors ${status === 'ai_turn' ? 'text-slate-900' : 'text-slate-900/40'}`}>
              <Cpu className="w-4 h-4" />
              AI 1 ({aiHand.length})
            </div>
            <div className="flex -space-x-10 sm:-space-x-14 overflow-visible py-2">
              <AnimatePresence>
                {aiHand.map((card) => (
                  <CardView key={card.id} card={card} isFaceUp={false} className="z-0 scale-75 sm:scale-90" />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* AI 2 */}
          <div className="flex flex-col items-center gap-2">
            <div className={`flex items-center gap-2 text-sm font-medium uppercase tracking-widest transition-colors ${status === 'ai2_turn' ? 'text-slate-900' : 'text-slate-900/40'}`}>
              <Cpu className="w-4 h-4" />
              AI 2 ({ai2Hand.length})
            </div>
            <div className="flex -space-x-10 sm:-space-x-14 overflow-visible py-2">
              <AnimatePresence>
                {ai2Hand.map((card) => (
                  <CardView key={card.id} card={card} isFaceUp={false} className="z-0 scale-75 sm:scale-90" />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Center Table */}
        <section className="flex-1 flex flex-col items-center justify-center gap-8 relative">
          <div className="flex items-center gap-8 sm:gap-16">
            {/* Draw Pile */}
            <div className="flex flex-col items-center gap-2">
              <div 
                onClick={() => status === 'player_turn' && drawCard('player')}
                className={`relative cursor-pointer group ${status !== 'player_turn' ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute inset-0 bg-black/20 rounded-lg translate-y-2 translate-x-1" />
                <div className="absolute inset-0 bg-black/20 rounded-lg translate-y-1 translate-x-0.5" />
                <CardView 
                  card={{} as Card} 
                  isFaceUp={false} 
                  className="group-hover:-translate-y-1 transition-transform"
                />
                <div className="absolute -top-3 -right-3 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                  {deck.length}
                </div>
              </div>
              <span className="text-slate-900/40 text-[10px] uppercase font-bold tracking-tighter">Draw Pile</span>
            </div>

            {/* Discard Pile */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  <CardView 
                    key={topCard?.id}
                    card={topCard} 
                    isFaceUp={true} 
                  />
                </AnimatePresence>
                {currentSuit && currentSuit !== topCard?.suit && (
                  <div className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-xl animate-bounce">
                    <span className={`text-xl font-bold ${SUIT_COLORS[currentSuit]}`}>
                      {SUIT_SYMBOLS[currentSuit]}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-slate-900/40 text-[10px] uppercase font-bold tracking-tighter">Discard</span>
            </div>
          </div>

          {/* Status Message */}
          <motion.div 
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3"
          >
            {(status === 'ai_turn' || status === 'ai2_turn') ? (
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            ) : (
              <Info className="w-4 h-4 text-blue-400" />
            )}
            <p className="text-sm sm:text-base font-medium">{message}</p>
          </motion.div>
        </section>

        {/* Player Area */}
        <section className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-slate-900/60 text-sm font-medium uppercase tracking-widest">
            <User className="w-4 h-4" />
            Your Hand ({playerHand.length} cards)
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 max-w-full px-4 py-4">
            <AnimatePresence>
              {playerHand.map((card) => (
                <CardView 
                  key={card.id} 
                  card={card} 
                  isPlayable={status === 'player_turn' && canPlay(card)}
                  onClick={() => handlePlayerPlay(card)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {status === 'suit_selection' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
            >
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                {topCard?.rank === 'BOMB' ? <Bomb className="text-orange-500" /> : null}
                {topCard?.rank === 'BOMB' ? 'BOMB!' : 'Crazy 8!'}
              </h2>
              <p className="text-white/60 mb-8">Choose the next suit to be played</p>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelection(suit)}
                    className="flex flex-col items-center gap-2 p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
                  >
                    <span className={`text-4xl group-hover:scale-125 transition-transform ${SUIT_COLORS[suit]}`}>
                      {SUIT_SYMBOLS[suit]}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100">
                      {suit}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {status === 'game_over' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/20 p-12 rounded-[40px] shadow-2xl max-w-md w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
              
              <div className="mb-8 inline-flex p-6 bg-white/5 rounded-full">
                <Trophy className={`w-16 h-16 ${winner === 'player' ? 'text-yellow-400' : 'text-slate-500'}`} />
              </div>
              
              <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">
                {winner === 'player' ? 'Victory!' : 'Game Over'}
              </h2>
              <p className="text-white/60 mb-12 text-lg">
                {winner === 'player' 
                  ? "You've cleared all your cards. Well played!" 
                  : winner === 'ai' 
                    ? "AI 1 has won the game!" 
                    : "AI 2 has won the game!"}
              </p>
              
              <button
                onClick={initGame}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}

        {status === 'start' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-yellow-500 p-4"
          >
            <div className="text-center max-w-lg">
              <div className="mb-12 flex justify-center gap-4">
                {['hearts', 'spades', 'diamonds', 'clubs'].map((s, i) => (
                  <motion.div
                    key={s}
                    animate={{ 
                      y: [0, -20, 0],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                    className={`text-6xl ${SUIT_COLORS[s as Suit]}`}
                  >
                    {SUIT_SYMBOLS[s as Suit]}
                  </motion.div>
                ))}
              </div>
              
              <h1 className="text-6xl sm:text-8xl font-black mb-6 tracking-tighter italic">
                CRAZY<br />EIGHTS
              </h1>
              <p className="text-slate-900/60 mb-12 text-lg leading-relaxed">
                The classic card game of strategy and luck. <br />
                Match suits, ranks, and use the 8s to your advantage.
              </p>
              
              <button
                onClick={initGame}
                className="group relative inline-flex items-center gap-4 px-12 py-6 bg-white text-black font-black text-2xl rounded-full hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95"
              >
                START GAME
                <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="mt-auto pt-8 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold text-slate-900/40">
        <div>© 2026 TINA GAMES</div>
        <div className="flex gap-4">
          <span>Responsive Design</span>
          <span>AI Powered</span>
        </div>
      </footer>
    </div>
  );
}
