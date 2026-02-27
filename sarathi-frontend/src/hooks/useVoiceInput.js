import { useState, useCallback, useRef } from 'react';

/**
 * useVoiceInput — hook for voice recording.
 * In production, this would use Web Speech API or AWS Transcribe.
 * For the prototype, it simulates recording states.
 */
export function useVoiceInput({ onTranscript, language = 'hi-IN' } = {}) {
  const [state, setState] = useState('idle'); // idle | listening | processing
  const [transcript, setTranscript] = useState('');
  const timeoutRef = useRef(null);

  const startListening = useCallback(() => {
    setState('listening');

    // Simulate voice capture — in production, use SpeechRecognition API
    timeoutRef.current = setTimeout(() => {
      setState('processing');

      // Simulate processing delay
      setTimeout(() => {
        const mockTranscript = language === 'hi-IN'
          ? 'मुझे पेंशन योजना चाहिए'
          : 'I need pension scheme';
        setTranscript(mockTranscript);
        setState('idle');
        onTranscript?.(mockTranscript);
      }, 1500);
    }, 3000);
  }, [language, onTranscript]);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (state === 'listening') {
      setState('processing');
      setTimeout(() => {
        const mockTranscript = 'मुझे योजना की जानकारी चाहिए';
        setTranscript(mockTranscript);
        setState('idle');
        onTranscript?.(mockTranscript);
      }, 1000);
    }
  }, [state, onTranscript]);

  const toggleListening = useCallback(() => {
    if (state === 'idle') startListening();
    else if (state === 'listening') stopListening();
  }, [state, startListening, stopListening]);

  return { state, transcript, startListening, stopListening, toggleListening };
}

export default useVoiceInput;
