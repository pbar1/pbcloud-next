import { App } from "cdk8s";
import { container } from "./lib/workload";
import { port, hostPath } from "./lib/helpers";
import "./lib/linuxserver-ext";

const app = new App();

container("ghcr.io/linuxserver/sonarr:latest")
  .withLinuxServerDefaults()
  .withPort(port(8989))
  .asWorkload()
  .withExpose()
  .withVolumeAndMount(hostPath("config", "/data/config/sonarr", "/config"))
  .withVolumeAndMount(hostPath("tv", "/data/media/tv", "/tv"))
  .withNamespace("media")
  .build(app, "sonarr");

app.synth();
