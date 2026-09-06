import { useEffect, useRef, useState } from 'react';
import { useMMOStore } from '../../store/useMMOStore';

export function ConcertAudio() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const localId = useMMOStore((state) => state.localId);

  useEffect(() => {
    // Only mount if connected
    if (!localId) return;
    
    // In a real MMO, we would sync the timestamp from the server.
    // For now, we will just play the track locally when joined.
    const audio = new Audio('/assets/Skylike - Higher.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    // Start playing 
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.warn("Audio autoplay blocked by browser:", err);
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [localId]);

  return null;
}
