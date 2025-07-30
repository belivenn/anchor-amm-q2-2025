import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Amm } from "../target/types/amm";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { Commitment, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
const commitment: Commitment = "confirmed";


describe("amm", () => {

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Amm as Program<Amm>;

  const connection = provider.connection;

  const seed = new BN(500);

  const payer = provider.wallet as NodeWallet;

  let mintX: PublicKey;
  let mintY: PublicKey;

  let vaultX: PublicKey;
  let vaultY: PublicKey;

  let userAtaX: PublicKey;
  let userAtaY: PublicKey;

  let userLp: PublicKey;

  let config = PublicKey.findProgramAddressSync([
    Buffer.from("config"), 
    seed.toBuffer("le", 8)], 
    program.programId)
  [0];

  let mintLp = PublicKey.findProgramAddressSync([
    Buffer.from("lp"), 
    config.toBuffer()], 
    program.programId)
  [0];
  
  it("create mints, derive TAs !", async () => {

  mintX = await createMint(
    connection,
    payer.payer,
    provider.publicKey,
    provider.publicKey,
    6,
  );

  mintY = await createMint(
    connection,
    payer.payer,
    provider.publicKey,
    provider.publicKey,
    6,
  );

  vaultX = await getAssociatedTokenAddressSync(mintX, config, true);
  vaultY = await getAssociatedTokenAddressSync(mintY, config, true);

  userLp = await getAssociatedTokenAddressSync(mintLp, provider.publicKey);

  userAtaX = (await getOrCreateAssociatedTokenAccount(
    connection,
    payer.payer,
    mintX,
    provider.publicKey,
  )).address;

  userAtaY = (await getOrCreateAssociatedTokenAccount(
    connection,
    payer.payer,
    mintY,
    provider.publicKey,
  )).address; 

  let mintXTx = await mintTo(
    connection,
    payer.payer,
    mintX,
    userAtaX,
    provider.publicKey,
    100_000_000
  );

  let mintYTx = await mintTo(
    connection,
    payer.payer,
    mintY,
    userAtaY,
    provider.publicKey,
    100_000_000
  );

  });


  it("Initialize!", async () => {

    const tx = await program.methods.initialize(
      seed,
      500,
      provider.publicKey,

    ).accountsPartial({
      initializer: provider.publicKey,
      mintX: mintX,
      mintY: mintY,
      mintLp: mintLp,
      vaultX: vaultX,
      vaultY: vaultY,
      config: config,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();


  });
  it("Deposit!", async () => {
    const tx = await program.methods.deposit(
      new BN(1000_000_000),
      new BN(5_000_000),
      new BN(5_000_000),
    ).accountsPartial({
      user: provider.publicKey,
      mintX,
      mintY,
      config,
      mintLp,
      vaultX,
      vaultY,
      userX: userAtaX,
      userY: userAtaY,
      userLp,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  });

  xit("swap!", async () => {
    const tx = await program.methods.swap(
      true,
      new BN(2_000_000),
      new BN(1_000_000),
    ).accountsPartial({
      user: provider.publicKey,
      mintX,
      mintY,
      userX: userAtaX,
      userY: userAtaY,
      vaultX,
      vaultY,
      config,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      systemProgram: SystemProgram.programId,      
    })
    .rpc();    


  });

  it("withdraw!", async () => {

    const tx = await program.methods.withdraw(
      new BN(1000_000_000),
      new BN(5_000_000),
      new BN(5_000_000),
    ).accountsPartial({
      user: provider.publicKey,
      mintX,
      mintY,
      config,
      mintLp,
      vaultX,
      vaultY,
      userX: userAtaX,
      userY: userAtaY,
      userLp,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      systemProgram: SystemProgram.programId,      
    })
    .rpc();   

  });
});
