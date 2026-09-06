import { useMMOStore } from '../../store/useMMOStore';
import { Avatar } from './Avatar';

export function NetworkedPlayers() {
  const players = useMMOStore((state) => state.players);
  const localId = useMMOStore((state) => state.localId);

  return (
    <group>
      {Object.values(players).map((player) => {
        const isLocal = player.id === localId;
        // Don't render local player if we want to use a first-person view, 
        // or render them if third-person. We'll render everyone for now.
        return (
          <Avatar 
            key={player.id} 
            id={player.id}
            modelName={player.avatar} 
            position={player.position} 
            rotation={player.rotation}
            state={player.state}
            isLocal={isLocal}
            nickname={player.nickname}
          />
        );
      })}
    </group>
  );
}
