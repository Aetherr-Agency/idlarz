// Audio manager for handling game sound effects
class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, HTMLAudioElement>;
  private loadedSounds: Map<string, boolean>;

  private constructor() {
    this.sounds = new Map();
    this.loadedSounds = new Map();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public loadSound(key: string, path: string, volume: number = 0.3): void {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;

    audio.addEventListener('canplaythrough', () => {
      this.loadedSounds.set(key, true);
    });

    audio.addEventListener('error', (e) => {
      console.error(`Error loading sound ${key}:`, e);
      this.loadedSounds.set(key, false);
    });

    audio.src = path;
    this.sounds.set(key, audio);
    this.loadedSounds.set(key, false);
  }

  public playSound(key: string): void {
    const audio = this.sounds.get(key);
    const isLoaded = this.loadedSounds.get(key);

    if (audio && isLoaded) {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.currentTime = 0;
          })
          .catch(error => {
            if (error.name === 'NotAllowedError') {
              console.info('Audio playback requires user interaction first');
            } else {
              console.error(`Error playing sound ${key}:`, error);
            }
          });
      }
    }
  }

  public isLoaded(key: string): boolean {
    return this.loadedSounds.get(key) || false;
  }
}

export const audioManager = AudioManager.getInstance();

// Initialize game sounds
if (typeof window !== 'undefined') {
  audioManager.loadSound('purchase', '/purchase.mp3');
  audioManager.loadSound('wrong', '/wrong.mp3');
}

export default audioManager;
