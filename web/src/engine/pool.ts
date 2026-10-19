// One Unforged pool running the real compiled contract on compact-runtime,
// inside the browser. Same circuits, same witnesses, same refusals as on
// chain; only the network is simulated.

import { createCircuitContext, createConstructorContext, type StateValue } from "@midnight-ntwrk/compact-runtime";
import * as Unforged21 from "../../../contract/src/managed/unforged/contract/index.js";
import * as Unforged28 from "../../../contract/src/managed/unforged28/contract/index.js";
import type { Ledger } from "../../../contract/src/managed/unforged/contract/index.js";

type ContractModule = typeof Unforged21;
const VARIANTS: Record<number, ContractModule> = { 21: Unforged21, 28: Unforged28 as unknown as ContractModule };
import { witnesses, type DeviceSecret, type PreparedAssertion, type UnforgedPrivateState } from "../../../contract/src/witnesses";
import { fromHex, random, toHex } from "./bytes";

export type CircuitName = "enroll" | "revoke" | "seal";

export type Disclosure = { label: string; value: string };

export class Pool {
  private state!: StateValue;
  private privateState: UnforgedPrivateState = {};
  private readonly contract: InstanceType<ContractModule["Contract"]>;
  private readonly coinPk = { bytes: random(32) };
  private readonly adminSecret = random(32);
  readonly address = toHex(random(32));

  private constructor(private readonly mod: ContractModule) {
    this.contract = new mod.Contract<UnforgedPrivateState>(witnesses as never);
  }

  /** `originLength` selects the compiled variant matching the WebAuthn origin. */
  static async deploy(minPoolSize: number, originLength: number): Promise<Pool> {
    const mod = VARIANTS[originLength];
    if (!mod) throw new Error(`No contract variant for ${originLength}-byte origins`);
    const pool = new Pool(mod);
    pool.privateState = { adminSecret: pool.adminSecret };
    const init = await pool.contract.initialState(
      createConstructorContext(pool.privateState, pool.coinPk as never),
      BigInt(minPoolSize),
    );
    pool.state = (init.currentContractState as any).data as StateValue;
    return pool;
  }

  get ledger(): Ledger {
    return this.mod.ledger(this.state);
  }

  now(): number {
    return Math.floor(Date.now() / 1000);
  }

  challengeFor(fingerprint: Uint8Array): Uint8Array {
    return this.mod.pureCircuits.sealChallenge({ bytes: fromHex(this.address) }, fingerprint);
  }

  commitmentOf(d: DeviceSecret): Uint8Array {
    return this.mod.pureCircuits.deviceCommitment(d.pk, d.salt, d.policy);
  }

  private async call(circuit: CircuitName, ...args: unknown[]) {
    const ctx = createCircuitContext<UnforgedPrivateState>({
      circuitId: circuit,
      contractAddress: this.address,
      coinPublicKeyOrZswapState: this.coinPk,
      contractState: this.state,
      privateState: this.privateState,
      time: this.now(),
    } as never);
    const r = await (this.contract.impureCircuits as any)[circuit](ctx, ...args);
    this.state = r.context.callContext.currentQueryContext.state;
  }

  /** Admin enrolls a device. Returns its leaf index (the admin's private record). */
  async enroll(d: DeviceSecret): Promise<number> {
    const index = Number(this.ledger.devices.firstFree());
    this.privateState = { adminSecret: this.adminSecret };
    await this.call("enroll", this.commitmentOf(d));
    return index;
  }

  async revoke(index: number): Promise<void> {
    this.privateState = { adminSecret: this.adminSecret };
    await this.call("revoke", BigInt(index));
  }

  /** Run the seal circuit with a device's private inputs. Throws the contract's refusal code. */
  async seal(d: DeviceSecret, assertion: PreparedAssertion, fingerprint: Uint8Array, takenAt = this.now() - 1): Promise<Disclosure[]> {
    this.privateState = { device: d, assertion };
    await this.call("seal", fingerprint, BigInt(takenAt));
    return [
      { label: "Photo fingerprint", value: toHex(fingerprint) },
      { label: "Capture time", value: new Date(takenAt * 1000).toISOString() },
      { label: "Pool epoch", value: String(this.ledger.epoch) },
      { label: "Merkle root used", value: "shared by every phone in the pool" },
    ];
  }

  lookup(fingerprint: Uint8Array) {
    const l = this.ledger;
    return l.seals.member(fingerprint) ? l.seals.lookup(fingerprint) : undefined;
  }
}

/** Map a contract refusal to the code shown in the UI. */
export function refusalCode(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  for (const code of ["ALREADY_SEALED", "NOT_ENROLLED", "BAD_SIGNATURE", "BAD_TIME", "POOL_TOO_SMALL", "NOT_ADMIN", "POOL_FULL"]) {
    if (m.includes(code)) return code;
  }
  if (/UP and UV/.test(m)) return "UV_REQUIRED";
  if (/RP mismatch/.test(m)) return "WRONG_WEBSITE";
  if (/different photo or pool/.test(m)) return "BAD_SIGNATURE";
  return "REFUSED";
}
