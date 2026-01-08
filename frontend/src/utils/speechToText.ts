/**
 * Speech-to-Text using Web Speech API
 * Provides real-time speech recognition for captions
 */

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onnomatch: ((this: SpeechRecognition, ev: Event) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitSpeechRecognition: SpeechRecognitionConstructor;
    }
}

export interface CaptionResult {
    text: string;
    isFinal: boolean;
    confidence: number;
    timestamp: number;
    language: string;
}

export interface SpeechToTextOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    maxAlternatives?: number;
    onResult?: (result: CaptionResult) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
}

export class SpeechToTextService {
    private recognition: SpeechRecognition | null = null;
    private isListening = false;
    private options: SpeechToTextOptions;
    private restartTimeout: NodeJS.Timeout | null = null;

    constructor(options: SpeechToTextOptions = {}) {
        this.options = {
            language: 'vi-VN', // Default to Vietnamese
            continuous: true,
            interimResults: true,
            maxAlternatives: 1,
            ...options,
        };

        this.initRecognition();
    }

    private initRecognition(): boolean {
        if (typeof window === 'undefined') {
            console.warn('Speech recognition not available in SSR');
            return false;
        }

        const SpeechRecognitionAPI =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) {
            console.warn('Web Speech API not supported in this browser');
            return false;
        }

        this.recognition = new SpeechRecognitionAPI();
        this.recognition.continuous = this.options.continuous!;
        this.recognition.interimResults = this.options.interimResults!;
        this.recognition.lang = this.options.language!;
        this.recognition.maxAlternatives = this.options.maxAlternatives!;

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            const result = event.results[event.resultIndex];
            const alternative = result[0];

            const captionResult: CaptionResult = {
                text: alternative.transcript,
                isFinal: result.isFinal,
                confidence: alternative.confidence,
                timestamp: Date.now(),
                language: this.options.language!,
            };

            this.options.onResult?.(captionResult);
        };

        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);

            // Handle recoverable errors
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                // These are recoverable - will auto-restart
                return;
            }

            if (event.error === 'not-allowed') {
                this.options.onError?.('Microphone access denied. Please allow microphone access.');
            } else if (event.error === 'network') {
                this.options.onError?.('Network error. Please check your connection.');
            } else {
                this.options.onError?.(event.error);
            }
        };

        this.recognition.onstart = () => {
            this.isListening = true;
            this.options.onStart?.();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.options.onEnd?.();

            // Auto-restart if still supposed to be listening
            if (this.options.continuous && this.recognition) {
                this.restartTimeout = setTimeout(() => {
                    if (this.recognition && !this.isListening) {
                        try {
                            this.recognition.start();
                        } catch {
                            // Already started or other error
                        }
                    }
                }, 100);
            }
        };

        return true;
    }

    /**
     * Check if Web Speech API is supported
     */
    static isSupported(): boolean {
        if (typeof window === 'undefined') return false;
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    /**
     * Get list of supported languages
     */
    static getSupportedLanguages(): { code: string; name: string }[] {
        return [
            { code: 'vi-VN', name: 'Tiếng Việt' },
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'zh-CN', name: '中文 (简体)' },
            { code: 'zh-TW', name: '中文 (繁體)' },
            { code: 'ja-JP', name: '日本語' },
            { code: 'ko-KR', name: '한국어' },
            { code: 'fr-FR', name: 'Français' },
            { code: 'de-DE', name: 'Deutsch' },
            { code: 'es-ES', name: 'Español' },
            { code: 'pt-BR', name: 'Português (Brasil)' },
            { code: 'ru-RU', name: 'Русский' },
            { code: 'th-TH', name: 'ไทย' },
        ];
    }

    /**
     * Start speech recognition
     */
    start(): boolean {
        if (!this.recognition) {
            const initialized = this.initRecognition();
            if (!initialized) return false;
        }

        if (this.isListening) {
            return true;
        }

        try {
            this.recognition!.start();
            return true;
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            return false;
        }
    }

    /**
     * Stop speech recognition
     */
    stop(): void {
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = null;
        }

        if (this.recognition && this.isListening) {
            // Temporarily disable auto-restart
            const originalContinuous = this.options.continuous;
            this.options.continuous = false;

            this.recognition.stop();

            // Restore setting after stop
            setTimeout(() => {
                this.options.continuous = originalContinuous;
            }, 200);
        }
    }

    /**
     * Change recognition language
     */
    setLanguage(language: string): void {
        this.options.language = language;
        if (this.recognition) {
            this.recognition.lang = language;

            // Restart if currently listening
            if (this.isListening) {
                this.stop();
                setTimeout(() => this.start(), 100);
            }
        }
    }

    /**
     * Check if currently listening
     */
    getIsListening(): boolean {
        return this.isListening;
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.stop();
        this.recognition = null;
    }
}

// Singleton instance for easy use
let speechToTextInstance: SpeechToTextService | null = null;

export function getSpeechToText(options?: SpeechToTextOptions): SpeechToTextService {
    if (!speechToTextInstance) {
        speechToTextInstance = new SpeechToTextService(options);
    }
    return speechToTextInstance;
}

export function disposeSpeechToText(): void {
    if (speechToTextInstance) {
        speechToTextInstance.dispose();
        speechToTextInstance = null;
    }
}
