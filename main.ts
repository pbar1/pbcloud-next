import { App } from "cdk8s";
import { container } from "./lib/workload";
import { port } from "./lib/helpers";
import "./lib/linuxserver-ext";

const app = new App();

container("ghcr.io/linuxserver/prowlarr:latest")
  .withPort(port(9696))
  .asLinuxServerWorkload()
  .withNamespace("media")
  .build(app);

container("ghcr.io/linuxserver/sonarr:latest")
  .withPort(port(8989))
  .asLinuxServerWorkload()
  .withDownloadsMount()
  .withTvMount()
  .withNamespace("media")
  .build(app);

container("ghcr.io/linuxserver/radarr:latest")
  .withPort(port(7878))
  .asLinuxServerWorkload()
  .withDownloadsMount()
  .withMoviesMount()
  .withNamespace("media")
  .build(app);

container("ghcr.io/linuxserver/readarr:develop")
  .withPort(port(8787))
  .asLinuxServerWorkload()
  .withDownloadsMount()
  .withAudiobooksMount()
  .withNamespace("media")
  .build(app);

container("ghcr.io/linuxserver/bazarr:latest")
  .withPort(port(6767))
  .asLinuxServerWorkload()
  .withTvMount()
  .withMoviesMount()
  .withNamespace("media")
  .build(app);

app.synth();
