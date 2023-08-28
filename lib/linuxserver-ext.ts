import { ContainerBuilder } from "./workload";
import { env } from "./helpers";

declare module "./workload" {
  /**
   * Adds defaults that LinuxServer.io containers expect.
   */
  interface ContainerBuilder {
    withLinuxServerDefaults(): this;
  }
}

ContainerBuilder.prototype.withLinuxServerDefaults =
  function (): ContainerBuilder {
    this.withEnv(env("TZ", "America/Los_Angeles"))
      .withEnv(env("PUID", "1000"))
      .withEnv(env("PGID", "100"));
    return this;
  };
