/**
 * Infrastructure initialization for CLI
 *
 * Initializes Witness, Freebird, HyperToken, and Gossip based on config
 */

import {
  FreebirdAdapter,
  WitnessAdapter,
  HyperTokenAdapter,
  NullifierGossip,
  configureTor
} from '../index.js';
import { ConfigManager } from './config.js';

export interface Infrastructure {
  freebird: FreebirdAdapter;
  witness: WitnessAdapter;
  hypertoken: HyperTokenAdapter;
  gossip: NullifierGossip;
}

export class InfrastructureManager {
  private config: ConfigManager;
  private infrastructure?: Infrastructure;

  constructor(config?: ConfigManager) {
    this.config = config || new ConfigManager();
  }

  /**
   * Initialize infrastructure
   */
  async initialize(): Promise<Infrastructure> {
    if (this.infrastructure) {
      return this.infrastructure;
    }

    // Configure Tor if enabled
    const torConfig = this.config.getTorConfig();
    if (torConfig) {
      configureTor(torConfig);
    }

    // Initialize Freebird
    const freebird = new FreebirdAdapter(this.config.getFreebirdConfig());

    // Initialize Witness
    const witness = new WitnessAdapter(this.config.getWitnessConfig());

    // Initialize HyperToken
    const hypertoken = new HyperTokenAdapter(this.config.getHyperTokenConfig());

    try {
      await hypertoken.connect();
    } catch (error) {
      console.warn('Warning: Failed to connect to HyperToken relay. Token operations may have limited gossip capability.');
      console.warn('You can still use the CLI, but double-spend detection will rely solely on Witness.');
    }

    // Initialize Gossip network
    const gossip = new NullifierGossip({ witness });

    // Add peers from HyperToken
    try {
      for (let i = 0; i < 3; i++) {
        const peer = hypertoken.createPeer(`cli-peer-${i}`);
        gossip.addPeer(peer);
      }
    } catch (error) {
      // Ignore peer creation errors
    }

    this.infrastructure = {
      freebird,
      witness,
      hypertoken,
      gossip
    };

    return this.infrastructure;
  }

  /**
   * Cleanup infrastructure
   */
  async cleanup(): Promise<void> {
    if (this.infrastructure) {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
        const disconnectPromise = this.infrastructure.hypertoken.disconnect();

        await Promise.race([disconnectPromise, timeoutPromise]);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get current infrastructure (throws if not initialized)
   */
  get(): Infrastructure {
    if (!this.infrastructure) {
      throw new Error('Infrastructure not initialized. Call initialize() first.');
    }
    return this.infrastructure;
  }
}
