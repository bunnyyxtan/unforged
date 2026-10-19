// One Unforged pool running the real compiled contract on compact-runtime,
// inside the browser. Same circuits, same witnesses, same refusals as on
// chain; only the network is simulated.

import { createCircuitContext, createConstructorContext, type StateValue } from "@midnight-ntwrk/compact-runtime";
import * as Unforged21 from "../../../contract/src/managed/unforged/contract/index.js";
import * as Unforged28 from "../../../contract/src/managed/unforged28/contract/index.js";
import * as Unforged31 from "../../../contract/src/managed/unforged31/contract/index.js";
import type { Ledger } from "../../../contract/src/managed/unforged/contract/index.js";

type ContractModule = typeof Unforged21;
const VARIANTS: Record<number, ContractModule> = { 21: Unforged21, 28: Unforged28 as unknown as ContractModule, 31: Unforged31 as unknown as ContractModule };
import { witnesses, type DeviceSecret, type PreparedAssertion, type UnforgedPrivateState } from "../../../contract/src/witnesses";
import { fromHex, random, toHex } from "./bytes";

export type CircuitName = "enroll" | "revoke" | "seal" | "addApprover" | "approve";

export type Disclosure = { label: string; value: string };

export class Pool {
  private state!: StateValue;
  private privateState: UnforgedPrivateState = {};
  private readonly contract: InstanceType<ContractModule["Contract"]>;
  private readonly coinPk = { bytes: random(32) };
  private readonly adminSecret = random(32);
  readonly address = toHex(random(32));
  /** Approver secrets. In production each approver holds only their own. */
  private approverSecrets: Uint8Array[] = [];

  private constructor(private readonly mod: ContractModule, readonly threshold: number) {
    this.contract = new mod.Contract<UnforgedPrivateState>(witnesses as never);
  }

  /** `originLength` selects the compiled variant matching the WebAuthn origin. */
  static async deploy(minPoolSize: number, originLength: number, threshold = 0, approvers = 0): Promise<Pool> {
    const mod = VARIANTS[originLength];
    if (!mod) throw new Error(`No contract variant for ${originLength}-byte origins`);
    const pool = new Pool(mod, threshold);
    pool.privateState = { adminSecret: pool.adminSecret };
    const init = await pool.contract.initialState(
      createConstructorContext(pool.privateState, pool.coinPk as never),
      BigInt(minPoolSize),
      BigInt(threshold),
    );
    pool.state = (init.currentContractState as any).data as StateValue;
    for (let i = 0; i < approvers; i++) {
      const secret = random(32);
      pool.privateState = { adminSecret: pool.adminSecret };
      await pool.call("addApprover", mod.pureCircuits.approverCommitment(secret));
      pool.approverSecrets.push(secret);
    }
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

  /**
   * Enroll a device. Under a threshold policy, `threshold` randomly chosen
   * approvers each run the anonymous approve circuit; otherwise the owner
   * enrolls directly. Returns the leaf index (the operator's private record).
   */
  async enroll(d: DeviceSecret): Promise<number> {
    const index = Number(this.ledger.devices.firstFree());
    const c = this.commitmentOf(d);
    if (this.threshold === 0) {
      this.privateState = { adminSecret: this.adminSecret };
      await this.call("enroll", c);
      return index;
    }
    const picks = [...this.approverSecrets].sort(() => Math.random() - 0.5).slice(0, this.threshold);
    for (const secret of picks) await this.approveAs(secret, c);
    return index;
  }

  /** One approval by approver `i` (or by an arbitrary secret, for refusal exercises). */
  async approve(c: Uint8Array, approver: number | Uint8Array): Promise<void> {
    await this.approveAs(typeof approver === "number" ? this.approverSecrets[approver] : approver, c);
  }

  private async approveAs(secret: Uint8Array, c: Uint8Array) {
    this.privateState = { approverSecret: secret };
    await this.call("approve", c);
  }

  /** The owner tries to enroll directly (refused under a threshold policy). */
  async ownerEnroll(c: Uint8Array): Promise<void> {
    this.privateState = { adminSecret: this.adminSecret };
    await this.call("enroll", c);
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
  for (const code of ["ALREADY_SEALED", "NOT_ENROLLED", "BAD_SIGNATURE", "BAD_TIME", "POOL_TOO_SMALL", "NOT_ADMIN", "POOL_FULL", "APPROVAL_REQUIRED", "ALREADY_APPROVED", "NOT_APPROVER", "NO_APPROVAL_POLICY", "APPROVERS_FULL"]) {
    if (m.includes(code)) return code;
  }
  if (/UP and UV/.test(m)) return "UV_REQUIRED";
  if (/RP mismatch/.test(m)) return "WRONG_WEBSITE";
  if (/different photo or pool/.test(m)) return "BAD_SIGNATURE";
  return "REFUSED";
}
