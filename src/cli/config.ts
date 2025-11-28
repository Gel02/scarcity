/**
 * Configuration management for CLI
 *
 * Manages network settings (Witness, Freebird, HyperToken, Tor)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface ScarcityConfig {
  version: string;
  witness: {
    gatewayUrl: string;
    networkId: string;
  };
  freebird: {
    issuerEndpoints: string[];
    verifierUrl: string;
  };
  hypertoken: {
    relayUrl: string;
  };
  tor: {
    enabled: boolean;
    proxyHost: string;
    proxyPort: number;
  };
}

export const DEFAULT_CONFIG: ScarcityConfig = {
  version: '1.0',
  witness: {
    gatewayUrl: 'http://localhost:8080',
    networkId: 'scarcity-testnet'
  },
  freebird: {
    issuerEndpoints: ['http://localhost:8081'],
    verifierUrl: 'http://localhost:8082'
  },
  hypertoken: {
    relayUrl: 'ws://localhost:3000'
  },
  tor: {
    enabled: false,
    proxyHost: 'localhost',
    proxyPort: 9050
  }
};

export class ConfigManager {
  private configPath: string;
  private config: ScarcityConfig;

  constructor(customPath?: string) {
    this.configPath = customPath || join(homedir(), '.scarcity', 'config.json');
    this.ensureConfigDir();
    this.config = this.loadConfig();
  }

  /**
   * Ensure config directory exists
   */
  private ensureConfigDir(): void {
    const dir = join(homedir(), '.scarcity');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Load config from disk
   */
  private loadConfig(): ScarcityConfig {
    if (!existsSync(this.configPath)) {
      return { ...DEFAULT_CONFIG };
    }

    try {
      const data = readFileSync(this.configPath, 'utf-8');
      const loaded = JSON.parse(data);

      // Merge with defaults to handle new config keys
      return {
        ...DEFAULT_CONFIG,
        ...loaded,
        witness: { ...DEFAULT_CONFIG.witness, ...loaded.witness },
        freebird: { ...DEFAULT_CONFIG.freebird, ...loaded.freebird },
        hypertoken: { ...DEFAULT_CONFIG.hypertoken, ...loaded.hypertoken },
        tor: { ...DEFAULT_CONFIG.tor, ...loaded.tor }
      };
    } catch (error) {
      console.warn('Failed to load config, using defaults');
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save config to disk
   */
  private saveConfig(): void {
    const data = JSON.stringify(this.config, null, 2);
    writeFileSync(this.configPath, data, 'utf-8');
  }

  /**
   * Get entire config
   */
  getAll(): ScarcityConfig {
    return { ...this.config };
  }

  /**
   * Get config value by key path (e.g., 'witness.gatewayUrl')
   */
  get(keyPath: string): any {
    const keys = keyPath.split('.');
    let value: any = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set config value by key path
   */
  set(keyPath: string, value: any): void {
    const keys = keyPath.split('.');
    const lastKey = keys.pop()!;
    let target: any = this.config;

    // Navigate to the parent object
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    // Set the value
    target[lastKey] = value;
    this.saveConfig();
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }

  /**
   * Get Witness adapter config
   */
  getWitnessConfig() {
    return {
      gatewayUrl: this.config.witness.gatewayUrl,
      networkId: this.config.witness.networkId
    };
  }

  /**
   * Get Freebird adapter config
   */
  getFreebirdConfig() {
    return {
      issuerEndpoints: this.config.freebird.issuerEndpoints,
      verifierUrl: this.config.freebird.verifierUrl,
      tor: this.config.tor.enabled ? {
        proxyHost: this.config.tor.proxyHost,
        proxyPort: this.config.tor.proxyPort
      } : undefined
    };
  }

  /**
   * Get HyperToken adapter config
   */
  getHyperTokenConfig() {
    return {
      relayUrl: this.config.hypertoken.relayUrl
    };
  }

  /**
   * Get Tor config
   */
  getTorConfig() {
    return this.config.tor.enabled ? {
      proxyHost: this.config.tor.proxyHost,
      proxyPort: this.config.tor.proxyPort
    } : undefined;
  }
}
