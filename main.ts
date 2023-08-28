import { App } from "cdk8s";
import { WorkloadBuilder, container, env } from "./lib/workload";

const app = new App();

new WorkloadBuilder(app, "dummy")
  .withContainer(container("example/img:latest"))
  .withContainer(container("vault:alpine"))
  .withEnv(env("RECESS", "Teej <3 Spin"))
  .withExpose()
  .build();

app.synth();
