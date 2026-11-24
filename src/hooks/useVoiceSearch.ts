import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface UseVoiceSearchOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export function useVoiceSearch({
  onResult,
  onError,
  lang,
}: UseVoiceSearchOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    setIsSupported(!!SpeechRec);

    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      const msg = 'Speech recognition is not supported in this browser.';
      setError(msg);
      onError?.(msg);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang =
        lang ||
        (typeof navigator !== 'undefined' && navigator.language
          ? navigator.language
          : 'en-US');

      recognition.onstart = () => {
        if (!isMountedRef.current) return;
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (!isMountedRef.current) return;
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            currentFinal += result[0].transcript;
          } else {
            currentInterim += result[0].transcript;
          }
        }

        const recognizedText = (currentFinal || currentInterim).trim();
        if (recognizedText) {
          setTranscript(recognizedText);
          const isFinal = Boolean(currentFinal);
          onResult?.(recognizedText, isFinal);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (!isMountedRef.current) return;
        setIsListening(false);
        let errorMsg = 'Voice search error occurred.';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          errorMsg = 'Microphone permission denied. Please allow microphone access in browser settings.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech detected. Please try again.';
        } else if (event.error === 'network') {
          errorMsg = 'Network error occurred during speech recognition.';
        } else if (event.error === 'aborted') {
          return;
        }
        setError(errorMsg);
        onError?.(errorMsg);
      };

      recognition.onend = () => {
        if (!isMountedRef.current) return;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      const msg = err?.message || 'Failed to start voice search.';
      setError(msg);
      onError?.(msg);
    }
  }, [lang, onError, onResult]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearError: () => setError(null),
  };
}
