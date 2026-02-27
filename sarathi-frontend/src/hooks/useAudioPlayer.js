import { useState, useCallback, useRef } from 'react';

/**
 * useAudioPlayer — hook to play Polly-generated audio explanations.
 *
 * Member 2 · Sarathi AI Services
 *
 * Usage:
 *   const { play, stop, isPlaying } = useAudioPlayer();
 *   <button onClick={() => play(audioUrl)}>🔊</button>
 */
export function useAudioPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSchemeId, setCurrentSchemeId] = useState(null);
    const audioRef = useRef(null);

    const play = useCallback((audioUrl, schemeId = null) => {
        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        if (!audioUrl) {
            console.warn('[AudioPlayer] No audio URL provided');
            return;
        }

        try {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            setCurrentSchemeId(schemeId);

            audio.onplay = () => setIsPlaying(true);
            audio.onended = () => {
                setIsPlaying(false);
                setCurrentSchemeId(null);
            };
            audio.onerror = (e) => {
                console.error('[AudioPlayer] Playback error:', e);
                setIsPlaying(false);
                setCurrentSchemeId(null);
            };

            audio.play().catch((err) => {
                console.error('[AudioPlayer] Failed to play:', err);
                setIsPlaying(false);
            });
        } catch (err) {
            console.error('[AudioPlayer] Error creating audio:', err);
        }
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsPlaying(false);
        setCurrentSchemeId(null);
    }, []);

    const toggle = useCallback(
        (audioUrl, schemeId = null) => {
            if (isPlaying && currentSchemeId === schemeId) {
                stop();
            } else {
                play(audioUrl, schemeId);
            }
        },
        [isPlaying, currentSchemeId, play, stop]
    );

    return {
        play,
        stop,
        toggle,
        isPlaying,
        currentSchemeId,
    };
}

export default useAudioPlayer;
