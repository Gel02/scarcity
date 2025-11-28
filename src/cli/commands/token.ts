/**
 * Token command - Token operations
 */

import { Command } from '../command.js';
import { WalletManager } from '../wallet.js';
import { TokenStorage } from '../token-store.js';
import { ConfigManager } from '../config.js';
import { InfrastructureManager } from '../infrastructure.js';
import { ScarbuckToken, Crypto } from '../../index.js';

export class TokenCommand extends Command {
  constructor() {
    super('token', 'Token operations (mint, transfer, split, merge)');
  }

  async execute(args: string[]): Promise<void> {
    const { positional, options } = this.parseArgs(args);

    if (options.help || options.h) {
      this.showHelp();
      return;
    }

    const subcommand = positional[0];

    if (!subcommand) {
      this.showHelp();
      return;
    }

    const walletManager = new WalletManager();
    const tokenStorage = new TokenStorage();
    const configManager = new ConfigManager();
    const infraManager = new InfrastructureManager(configManager);

    try {
      switch (subcommand) {
        case 'mint':
          await this.mint(walletManager, tokenStorage, infraManager, options);
          break;

        case 'transfer':
          await this.transfer(walletManager, tokenStorage, infraManager, positional, options);
          break;

        case 'receive':
          await this.receive(walletManager, tokenStorage, infraManager, positional, options);
          break;

        case 'list':
          await this.list(walletManager, tokenStorage, options);
          break;

        case 'show':
          await this.show(tokenStorage, positional, options);
          break;

        case 'balance':
          await this.balance(walletManager, tokenStorage, options);
          break;

        default:
          console.error(`Unknown subcommand: ${subcommand}`);
          this.showHelp();
          process.exit(1);
      }
    } finally {
      await infraManager.cleanup();
    }
  }

  private async mint(
    walletManager: WalletManager,
    tokenStorage: TokenStorage,
    infraManager: InfrastructureManager,
    options: any
  ): Promise<void> {
    const amount = this.requireOption(options, 'amount', 'amount');
    const walletName = options.wallet as string | undefined;

    try {
      // Get wallet
      const wallet = walletManager.getWallet(walletName);
      console.log(`Using wallet: ${wallet.name}`);

      // Parse amount
      const amountNum = parseInt(amount as string, 10);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Amount must be a positive number');
      }

      // Initialize infrastructure
      console.log('Initializing infrastructure...');
      const infra = await infraManager.initialize();

      // Mint token
      console.log(`Minting token for ${amountNum}...`);
      const token = ScarbuckToken.mint(
        amountNum,
        infra.freebird,
        infra.witness,
        infra.gossip
      );

      const metadata = token.getMetadata();

      // Store token
      tokenStorage.addToken({
        id: metadata.id,
        amount: metadata.amount,
        secretKey: Crypto.toHex((token as any).secret),
        wallet: wallet.name,
        created: Date.now(),
        spent: false,
        metadata: {
          type: 'minted'
        }
      });

      console.log('');
      console.log('✅ Token minted successfully!');
      console.log('');
      console.log(`Token ID: ${metadata.id}`);
      console.log(`Amount:   ${metadata.amount}`);
      console.log(`Wallet:   ${wallet.name}`);
      console.log('');
    } catch (error: any) {
      console.error(`Failed to mint token: ${error.message}`);
      process.exit(1);
    }
  }

  private async transfer(
    walletManager: WalletManager,
    tokenStorage: TokenStorage,
    infraManager: InfrastructureManager,
    positional: string[],
    options: any
  ): Promise<void> {
    const tokenId = this.requireArg(positional, 1, 'token-id');
    const recipientKey = this.requireArg(positional, 2, 'recipient-public-key');

    try {
      // Get token
      const storedToken = tokenStorage.getToken(tokenId);
      if (!storedToken) {
        throw new Error(`Token '${tokenId}' not found`);
      }

      if (storedToken.spent) {
        throw new Error('Token already spent');
      }

      console.log(`Transferring token ${tokenId}...`);

      // Initialize infrastructure
      console.log('Initializing infrastructure...');
      const infra = await infraManager.initialize();

      // Recreate token
      const secret = Crypto.fromHex(storedToken.secretKey);
      const token = new ScarbuckToken({
        id: storedToken.id,
        amount: storedToken.amount,
        secret,
        freebird: infra.freebird,
        witness: infra.witness,
        gossip: infra.gossip
      });

      // Transfer
      console.log('Creating transfer package...');
      const transferPkg = await token.transfer({
        bytes: Crypto.fromHex(recipientKey)
      });

      // Mark as spent
      tokenStorage.markSpent(tokenId);

      console.log('');
      console.log('✅ Token transferred successfully!');
      console.log('');
      console.log('Transfer package (send this to recipient):');
      console.log('');
      console.log(JSON.stringify({
        tokenId: transferPkg.tokenId,
        amount: transferPkg.amount,
        commitment: Crypto.toHex(transferPkg.commitment),
        nullifier: Crypto.toHex(transferPkg.nullifier),
        proof: transferPkg.proof,
        ownershipProof: transferPkg.ownershipProof ? Crypto.toHex(transferPkg.ownershipProof) : undefined
      }, null, 2));
      console.log('');
    } catch (error: any) {
      console.error(`Failed to transfer token: ${error.message}`);
      process.exit(1);
    }
  }

  private async receive(
    walletManager: WalletManager,
    tokenStorage: TokenStorage,
    infraManager: InfrastructureManager,
    positional: string[],
    options: any
  ): Promise<void> {
    const packageJson = this.requireOption(options, 'package', 'package');
    const walletName = options.wallet as string | undefined;

    try {
      // Get wallet
      const wallet = walletManager.getWallet(walletName);
      const recipientSecret = walletManager.getSecretKey(walletName);

      console.log(`Receiving to wallet: ${wallet.name}`);

      // Parse package
      let transferPkg: any;
      try {
        transferPkg = JSON.parse(packageJson as string);
      } catch (error) {
        throw new Error('Invalid transfer package JSON');
      }

      // Convert hex strings back to Uint8Array
      const pkg = {
        tokenId: transferPkg.tokenId,
        amount: transferPkg.amount,
        commitment: Crypto.fromHex(transferPkg.commitment),
        nullifier: Crypto.fromHex(transferPkg.nullifier),
        proof: transferPkg.proof,
        ownershipProof: transferPkg.ownershipProof ? Crypto.fromHex(transferPkg.ownershipProof) : undefined
      };

      // Initialize infrastructure
      console.log('Initializing infrastructure...');
      const infra = await infraManager.initialize();

      // Receive token
      console.log('Receiving token...');
      const receivedToken = await ScarbuckToken.receive(
        pkg,
        recipientSecret,
        infra.freebird,
        infra.witness,
        infra.gossip
      );

      const metadata = receivedToken.getMetadata();

      // Store token
      tokenStorage.addToken({
        id: metadata.id,
        amount: metadata.amount,
        secretKey: Crypto.toHex((receivedToken as any).secret),
        wallet: wallet.name,
        created: Date.now(),
        spent: false,
        metadata: {
          type: 'received'
        }
      });

      console.log('');
      console.log('✅ Token received successfully!');
      console.log('');
      console.log(`Token ID: ${metadata.id}`);
      console.log(`Amount:   ${metadata.amount}`);
      console.log(`Wallet:   ${wallet.name}`);
      console.log('');
    } catch (error: any) {
      console.error(`Failed to receive token: ${error.message}`);
      process.exit(1);
    }
  }

  private async list(
    walletManager: WalletManager,
    tokenStorage: TokenStorage,
    options: any
  ): Promise<void> {
    const walletName = options.wallet as string | undefined;
    const showSpent = options.spent === true;

    try {
      let tokens = tokenStorage.listTokens({
        wallet: walletName,
        spent: showSpent ? undefined : false
      });

      if (walletName) {
        console.log(`\nTokens for wallet: ${walletName}\n`);
      } else {
        console.log('\nAll tokens:\n');
      }

      if (tokens.length === 0) {
        console.log('No tokens found.');
        if (!showSpent) {
          console.log('Use --spent to show spent tokens.');
        }
        console.log('');
        return;
      }

      for (const token of tokens) {
        const status = token.spent ? '(spent)' : '(unspent)';
        const date = new Date(token.created).toLocaleString();

        console.log(`  ${token.id.substring(0, 16)}... ${status}`);
        console.log(`    Amount:  ${token.amount}`);
        console.log(`    Wallet:  ${token.wallet}`);
        console.log(`    Created: ${date}`);
        if (token.metadata?.type) {
          console.log(`    Type:    ${token.metadata.type}`);
        }
        console.log('');
      }

      // Show balance
      const balance = tokenStorage.getBalance(walletName || '');
      console.log(`Total balance: ${balance}`);
      console.log('');
    } catch (error: any) {
      console.error(`Failed to list tokens: ${error.message}`);
      process.exit(1);
    }
  }

  private async show(
    tokenStorage: TokenStorage,
    positional: string[],
    options: any
  ): Promise<void> {
    const tokenId = this.requireArg(positional, 1, 'token-id');

    try {
      const token = tokenStorage.getToken(tokenId);
      if (!token) {
        throw new Error(`Token '${tokenId}' not found`);
      }

      const status = token.spent ? 'Spent' : 'Unspent';
      const created = new Date(token.created).toLocaleString();
      const spentAt = token.spentAt ? new Date(token.spentAt).toLocaleString() : 'N/A';

      console.log('');
      console.log(`Token: ${token.id}`);
      console.log('');
      console.log(`Amount:  ${token.amount}`);
      console.log(`Wallet:  ${token.wallet}`);
      console.log(`Status:  ${status}`);
      console.log(`Created: ${created}`);
      if (token.spent) {
        console.log(`Spent:   ${spentAt}`);
      }
      if (token.metadata?.type) {
        console.log(`Type:    ${token.metadata.type}`);
      }
      console.log('');

      if (options.secret) {
        console.log('⚠️  SECRET KEY (keep safe!):');
        console.log(token.secretKey);
        console.log('');
      } else {
        console.log('Use --secret to show secret key');
        console.log('');
      }
    } catch (error: any) {
      console.error(`Failed to show token: ${error.message}`);
      process.exit(1);
    }
  }

  private async balance(
    walletManager: WalletManager,
    tokenStorage: TokenStorage,
    options: any
  ): Promise<void> {
    const walletName = options.wallet as string | undefined;

    try {
      const balance = tokenStorage.getBalance(walletName || '');
      const count = tokenStorage.getTokenCount(walletName, false);

      if (walletName) {
        const wallet = walletManager.getWallet(walletName);
        console.log(`\nWallet: ${wallet.name}`);
      } else {
        console.log('\nTotal balance (all wallets):');
      }

      console.log(`Balance: ${balance}`);
      console.log(`Tokens:  ${count} unspent`);
      console.log('');
    } catch (error: any) {
      console.error(`Failed to get balance: ${error.message}`);
      process.exit(1);
    }
  }

  showHelp(): void {
    console.log(`
USAGE:
  scar token <subcommand> [options]

SUBCOMMANDS:
  mint                          Mint a new token
  transfer <token-id> <to-key>  Transfer token to recipient
  receive                       Receive a transferred token
  list                          List all tokens
  show <token-id>               Show token details
  balance                       Show wallet balance

OPTIONS:
  --amount AMOUNT       Token amount (for mint)
  --wallet NAME         Wallet to use (default: default wallet)
  --package JSON        Transfer package JSON (for receive)
  --secret              Show secret key (for show)
  --spent               Include spent tokens (for list)
  -h, --help            Show this help message

EXAMPLES:
  # Mint a token
  scar token mint --amount 100

  # Mint to specific wallet
  scar token mint --amount 50 --wallet alice

  # Transfer a token
  scar token transfer abc123... 0x456def...

  # Receive a token
  scar token receive --package '{"tokenId":"abc","amount":100,...}'

  # List tokens
  scar token list

  # List tokens for specific wallet
  scar token list --wallet alice

  # Show token details
  scar token show abc123...

  # Get balance
  scar token balance
  scar token balance --wallet alice
`);
  }
}
