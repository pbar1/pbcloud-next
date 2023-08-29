import { App } from "cdk8s";
import { container } from "./lib/workload";
import { port } from "./lib/helpers";
import "./lib/linuxserver-ext";

const app = new App();

container("ghcr.io/linuxserver/sonarr:latest")
  .withPort(port(8989))
  .asLinuxServerWorkload()
  .withTorrentMount()
  .withTvMount()
  .withNamespace("media")
  .build(app);

container("ghcr.io/linuxserver/radarr:latest")
  .withPort(port(7878))
  .asLinuxServerWorkload()
  .withTorrentMount()
  .withMoviesMount()
  .withNamespace("media")
  .build(app);

container("ghcr.io/linuxserver/readarr:develop")
  .withPort(port(8787))
  .asLinuxServerWorkload()
  .withTorrentMount()
  .withAudiobooksMount()
  .withNamespace("media")
  .build(app);

app.synth();
