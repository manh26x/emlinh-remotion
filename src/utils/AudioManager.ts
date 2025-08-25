/**
 * AudioManager - Quản lý audio cho avatar lip-sync
 * Cung cấp các phương thức để quản lý audio element
 */

class AudioManager {
  private static instance: AudioManager;
  private audioElement: HTMLAudioElement | null = null;

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Lấy audio element hiện tại hoặc tạo mới nếu chưa tồn tại
   */
  getAudioElement(): HTMLAudioElement {
    if (!this.audioElement) {
      // Trong môi trường browser
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        this.audioElement = new Audio();
      } else {
        // Trong môi trường Remotion/SSR, tạo mock object
        this.audioElement = {
          paused: true,
          currentTime: 0,
          pause: () => {},
          play: () => Promise.resolve(),
          addEventListener: () => {},
          removeEventListener: () => {},
        } as unknown as HTMLAudioElement;
      }
    }
    return this.audioElement;
  }

  /**
   * Phát audio từ URL hoặc dữ liệu Blob
   */
  playAudio(audioSource: string | Blob): Promise<void> {
    const audio = this.getAudioElement();
    
    return new Promise((resolve, reject) => {
      const handleSuccess = () => {
        audio.removeEventListener('canplaythrough', handleSuccess);
        audio.removeEventListener('error', handleError);
        audio.play().catch(reject);
        resolve();
      };

      const handleError = (error: Event) => {
        audio.removeEventListener('canplaythrough', handleSuccess);
        audio.removeEventListener('error', handleError);
        reject(error);
      };

      audio.addEventListener('canplaythrough', handleSuccess);
      audio.addEventListener('error', handleError);

      if (typeof audioSource === 'string') {
        audio.src = audioSource;
      } else if (audioSource instanceof Blob) {
        audio.src = URL.createObjectURL(audioSource);
      }

      audio.load();
    });
  }

  /**
   * Dừng audio đang phát
   */
  stopAudio(): void {
    const audio = this.getAudioElement();
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
}

// Export single instance
export default AudioManager.getInstance();
