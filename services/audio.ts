/**
 * SoundManager - Web Audio APIによるシンセサイザー効果音
 * 外部ファイル不要で即座に効果音を生成・再生
 */

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;

  /**
   * 初回ユーザー操作時に呼び出す（ブラウザのAutoplay Policy対策）
   */
  init(): void {
    if (this.initialized) return;
    try {
      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.init();
    }
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * スワップ音 - 軽い「シュッ」
   */
  playSwap(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  /**
   * マッチ音 - コンボ数に応じてピッチが上がる「ポロン♪」
   */
  playMatch(comboCount: number = 0): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // 基準音を設定（C5 = 523Hz）、コンボごとに半音上げる
    const baseFreq = 523 * Math.pow(2, Math.min(comboCount, 12) / 12);
    const duration = 0.15;

    // メイン音
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + duration);

    // ハーモニー（5度上）
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime);
    gain2.gain.setValueAtTime(0.1, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration * 0.8,
    );
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + duration);
  }

  /**
   * 無効操作音 - 低い「ブッ」
   */
  playInvalid(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }

  /**
   * 勝利ファンファーレ - メジャーコードのアルペジオ
   */
  playWin(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // C Major arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const noteDuration = 0.15;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

      const startTime = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + noteDuration + 0.3,
      );

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + noteDuration + 0.35);
    });

    // 最後のキラキラ音
    setTimeout(() => {
      if (!ctx || !this.masterGain) return;
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = "triangle";
      shimmer.frequency.setValueAtTime(2093, ctx.currentTime);
      shimmerGain.gain.setValueAtTime(0.08, ctx.currentTime);
      shimmerGain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.3,
      );
      shimmer.connect(shimmerGain);
      shimmerGain.connect(this.masterGain);
      shimmer.start(ctx.currentTime);
      shimmer.stop(ctx.currentTime + 0.35);
    }, 500);
  }

  /**
    * フィーバー突入時のサイレン/ファンファーレ
    */
   playFeverStart(): void {
     const ctx = this.ensureContext();
     if (!ctx || !this.masterGain) return;
 
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
 
     osc.type = "sawtooth";
     osc.frequency.setValueAtTime(440, ctx.currentTime);
     osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.2);
     osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.4);
     osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.6);
     
     gain.gain.setValueAtTime(0.1, ctx.currentTime);
     gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.8);
 
     osc.connect(gain);
     gain.connect(this.masterGain);
     
     osc.start(ctx.currentTime);
     osc.stop(ctx.currentTime + 0.8);
   }
 
   /**
    * ボム爆発音
    */
   playBomb(): void {
     const ctx = this.ensureContext();
     if (!ctx || !this.masterGain) return;
 
     // 白色ノイズで爆発音
     const bufferSize = ctx.sampleRate * 0.5;
     const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < bufferSize; i++) {
         data[i] = Math.random() * 2 - 1;
     }
 
     const noise = ctx.createBufferSource();
     noise.buffer = buffer;
     
     const noiseGain = ctx.createGain();
     noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
     noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
     
     noise.connect(noiseGain);
     noiseGain.connect(this.masterGain);
     noise.start(ctx.currentTime);
   }

  /**
   * 大量消去時のドカン音
   */
  playBigClear(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // 低音のドカン
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  }
  /**
   * チクタク音 (残り10秒)
   */
  playTick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  /**
   * 警報音 (残り5秒)
   */
  playAlarm(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  /**
   * タイムアップ音
   */
  playTimeUp(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 1.0);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.0);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.0);
  }
}

// シングルトンとしてエクスポート
export const soundManager = new SoundManager();
