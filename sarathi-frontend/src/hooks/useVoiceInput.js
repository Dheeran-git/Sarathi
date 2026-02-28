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
  const silenceTimerRef = useRef(null);
  const fullTranscriptRef = useRef('');

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
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setState('listening');
        fullTranscriptRef.current = '';
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (currentFinal) {
          fullTranscriptRef.current += ' ' + currentFinal;
        }

        const displayText = (fullTranscriptRef.current + ' ' + currentInterim).trim();
        setTranscript(displayText);

        // Reset the silence timer on every new word detected
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        silenceTimerRef.current = setTimeout(() => {
          // Once user pauses for 1.5s, finalize 
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 1500);
      };

      recognition.onerror = (event) => {
        console.error('[VoiceInput] Error:', event.error);
        setState('idle');

        if (event.error === 'not-allowed' || event.error === 'no-speech') {
          _simulateVoiceInput();
        }
      };

      recognition.onend = () => {
        if (state === 'listening' || state === 'processing') {
          setState('idle');
          const finalOutput = fullTranscriptRef.current.trim();

          if (finalOutput) {
            onTranscript?.(finalOutput, 1.0);
          }

          // Clear it out for next time
          setTranscript('');
          fullTranscriptRef.current = '';
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
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (state === 'listening') {
      setState('processing');
      // The onend handler will fire and submit the text
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
