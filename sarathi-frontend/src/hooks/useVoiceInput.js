import { useState, useCallback, useRef } from 'react';

/**
 * useVoiceInput — hook for voice recording using Web Speech API.
 *
 * Uses the browser's SpeechRecognition API for real voice-to-text.
 * Falls back to mock data if the API is unavailable.
 */
export function useVoiceInput({ onTranscript, language = 'en-IN' } = {}) {
  const [state, setState] = useState('idle'); // idle | listening | processing
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check for Web Speech API support
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognition);

  const startListening = useCallback(() => {
    if (!isSupported) {
      _simulateVoiceInput();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = language; // 'en-IN' for English
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setState('listening');
      };

      recognition.onresult = (event) => {
        setState('processing');
        const result = event.results[0][0];
        const text = result.transcript;
        const confidence = result.confidence;

        console.log(`[VoiceInput] Transcript: "${text}" (confidence: ${confidence.toFixed(2)})`);

        setTranscript(text);
        setState('idle');
        onTranscript?.(text, confidence);
      };

      recognition.onerror = (event) => {
        console.error('[VoiceInput] Error:', event.error);
        setState('idle');

        if (event.error === 'not-allowed' || event.error === 'no-speech') {
          _simulateVoiceInput();
        }
      };

      recognition.onend = () => {
        if (state === 'listening') {
          setState('idle');
        }
      };

      recognition.start();
    } catch (err) {
      console.error('[VoiceInput] Failed to start recognition:', err);
      _simulateVoiceInput();
    }
  }, [SpeechRecognition, isSupported, language, onTranscript, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (state === 'listening') {
      setState('processing');
      setTimeout(() => setState('idle'), 500);
    }
  }, [state]);

  const toggleListening = useCallback(() => {
    if (state === 'idle') startListening();
    else if (state === 'listening') stopListening();
  }, [state, startListening, stopListening]);

  // Private: Simulated voice input fallback
  const _simulateVoiceInput = useCallback(() => {
    setState('listening');
    timeoutRef.current = setTimeout(() => {
      setState('processing');
      setTimeout(() => {
        const mockTranscript = 'I need pension scheme';
        setTranscript(mockTranscript);
        setState('idle');
        onTranscript?.(mockTranscript, 0.95);
      }, 1500);
    }, 3000);
  }, [onTranscript]);

  return {
    state,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    isSupported,
  };
}

export default useVoiceInput;
