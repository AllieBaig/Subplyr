
import { initDB } from '../db';

export interface IntegrityReport {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'critical';
  checks: {
    storage: boolean;
    database: boolean;
    audio: boolean;
    pwa: boolean;
    memory: boolean;
  };
  errors: string[];
}

class SafetyChecker {
  private static report: IntegrityReport = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      storage: false,
      database: false,
      audio: false,
      pwa: false,
      memory: true,
    },
    errors: []
  };

  static async runFullDiagnostics(): Promise<IntegrityReport> {
    console.log('[Safety] Starting full diagnostics...');
    
    // 1. Storage Check
    try {
      localStorage.setItem('safety_check', 'ok');
      localStorage.removeItem('safety_check');
      this.report.checks.storage = true;
    } catch (e) {
      this.addError('LocalStorage inaccessible - persistent settings may fail');
    }

    // 2. Database Check
    try {
      await initDB();
      this.report.checks.database = true;
    } catch (e) {
      this.addError('IndexedDB failed to initialize track storage');
    }

    // 3. Audio Support Check
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) throw new Error('No AudioContext');
      
      const testAudio = new Audio();
      if (!testAudio.canPlayType) throw new Error('HTMLAudioElement broken');
      
      this.report.checks.audio = true;
    } catch (e) {
      this.addError('Critical: Browser does not support required audio APIs');
    }

    // 4. PWA/Worker Check
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        this.report.checks.pwa = !!registration;
      } catch (e) {
        this.addError('Service worker check failed');
      }
    }

    // Determine final status
    if (this.report.errors.length > 5) this.report.status = 'critical';
    else if (this.report.errors.length > 0) this.report.status = 'degraded';

    console.log('[Safety] Diagnostics complete:', this.report.status);
    return this.report;
  }

  private static addError(msg: string) {
    this.report.errors.push(msg);
    console.warn(`[Safety] ${msg}`);
  }

  static getReport() {
    return this.report;
  }

  static validateAudioElement(el: HTMLAudioElement | null, context: string): boolean {
    if (!el) {
      console.error(`[Safety] ${context}: Audio element is null`);
      return false;
    }
    if (el.error) {
      console.error(`[Safety] ${context}: Audio element error state:`, el.error);
      return false;
    }
    return true;
  }
}

export default SafetyChecker;
