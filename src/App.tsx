import { useGame } from './hooks/useGame';
import { getOrCreateRoomId } from './lib/room';
import UsernameScreen from './components/UsernameScreen';
import LobbyScreen from './components/LobbyScreen';
import ArenaScreen from './components/ArenaScreen';

function App() {
  const roomId = getOrCreateRoomId();
  const game = useGame(roomId);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-orange-500/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        {game.screen === 'username' && <UsernameScreen game={game} />}
        {game.screen === 'lobby' && <LobbyScreen game={game} />}
        {game.screen === 'match' && <ArenaScreen game={game} />}
      </div>
    </div>
  );
}

export default App;
