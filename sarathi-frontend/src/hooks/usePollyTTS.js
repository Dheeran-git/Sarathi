import { useState, useCallback, useRef } from 'react';
import { synthesizeSpeech } from '../utils/api';

/**
 * usePollyTTS — Hook to manage converting text to speech using AWS Polly and playing it.
 * Falls back to browser speechSynthesis if API fails.
 */
export function usePollyTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTextId, setActiveTextId] = useState(null);
    const audioRef = useRef(null);

    // Stop current playback
    const stopPlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        window.speechSynthesis?.cancel(); // Cancel fallback TTS if active
        setIsSpeaking(false);
        setIsLoading(false);
        setActiveTextId(null);
    }, []);

    // Play text using Polly (or fallback)
    const playText = useCallback(async (text, language = 'en', uniqueId = null) => {
        const targetId = uniqueId || text; // Use text as ID if uniqueId not provided

        // If clicking same text that is currently playing -> stop it (toggle)
        if (isSpeaking && activeTextId === targetId) {
            stopPlayback();
            return;
        }

        // Clicked new text -> stop current, then play new
        stopPlayback();
        setIsLoading(true);
        setActiveTextId(targetId);

        try {
            const result = await synthesizeSpeech(text, language);

            if (result && result.audioBase64) {
                // Decode base64 to MP3 blob and play
                const audioStr = 'data:audio/mpeg;base64,' + result.audioBase64;
                const audio = new Audio(audioStr);
                audioRef.current = audio;

                audio.onplay = () => {
                    setIsLoading(false);
                    setIsSpeaking(true);
                };

                audio.onended = () => {
                    stopPlayback();
                };

                audio.onerror = (e) => {
                    console.error('[usePollyTTS] Playback error:', e);
                    stopFallback(text, language);
                };

                await audio.play();
            } else {
                throw new Error('No audio data received');
            }
        } catch (error) {
            console.error('[usePollyTTS] API failed, using fallback:', error);
            stopFallback(text, language);
        }
    }, [isSpeaking, activeTextId, stopPlayback]);

    // Fallback to browser TTS
    const stopFallback = (text, language) => {
        if (!('speechSynthesis' in window)) {
            stopPlayback();
            return;
        }

        setIsLoading(false);
        setIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

        utterance.onend = () => stopPlayback();
        utterance.onerror = () => stopPlayback();

        window.speechSynthesis.speak(utterance);
    };

    return {
        playText,
        stopPlayback,
        isSpeaking,
        isLoading,
        activeTextId
    };
}

export default usePollyTTS;
