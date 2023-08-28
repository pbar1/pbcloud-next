import { App } from "cdk8s";
import { container } from "./lib/workload";
import { env, envSec, port, hostPath } from "./lib/helpers";

const app = new App();

container("ghcr.io/linuxserver/sonarr:latest")
  .withEnv(env("PUID", "1000"))
  .withEnv(env("PGID", "100"))
  .withEnv(env("TZ", "America/Los_Angeles"))
  .withEnv(envSec("SUPERSEC", "teej", "spin"))
  .withPort(port(8989))
  .asWorkload(app, "dummy")
  .withNamespace("recess")
  .withVolumeAndMount(hostPath("config", "/data/config/sonarr", "/config"))
  .withExpose()
  .build();

app.synth();
