import { ContainerBuilder, WorkloadBuilder } from "./workload";
import { env, hostPath } from "./helpers";

declare module "./workload" {
  interface ContainerBuilder {
    asLinuxServerWorkload(): WorkloadBuilder;
  }

  interface WorkloadBuilder {
    withDownloadsMount(): WorkloadBuilder;
    withTvMount(): WorkloadBuilder;
    withMoviesMount(): WorkloadBuilder;
    withAudiobooksMount(): WorkloadBuilder;
  }
}

ContainerBuilder.prototype.asLinuxServerWorkload =
  function (): WorkloadBuilder {
    const name = this.getName();
    return this.withEnv(env("TZ", "America/Los_Angeles"))
      .withEnv(env("PUID", "1000"))
      .withEnv(env("PGID", "100"))
      .asWorkload()
      .withExpose()
      .withVolumeAndMount(
        hostPath("config", `/data/config/${name}`, "/config")
      );
  };

WorkloadBuilder.prototype.withDownloadsMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(
    hostPath("downloads", "/data/torrents", "/downloads")
  );
};

WorkloadBuilder.prototype.withTvMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(hostPath("tv", "/data/media/tv", "/tv"));
};

WorkloadBuilder.prototype.withMoviesMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(
    hostPath("movies", "/data/media/movies", "/movies")
  );
};

WorkloadBuilder.prototype.withAudiobooksMount = function (): WorkloadBuilder {
  return this.withVolumeAndMount(
    hostPath("audiobooks", "/data/media/audiobooks", "/audiobooks")
  );
};
