import { App } from "cdk8s";
import { container } from "./lib/workload";
import { env, port } from "./lib/helpers";

const app = new App();

container("ghcr.io/linuxserver/sonarr:latest")
  .withEnv(env("PUID", "1000"))
  .withEnv(env("PGID", "100"))
  .withEnv(env("TZ", "America/Los_Angeles"))
  .withPort(port(8989))
  .asWorkload(app, "dummy")
  .withNamespace("recess")
  .build();

app.synth();
