import { Testing } from "cdk8s";
import { WorkloadBuilder, container } from "./workload";

describe("Workload", () => {
  test("Basic", () => {
    const app = Testing.app();

    new WorkloadBuilder(app, "testing")
      .withContainer(container("example/img:latest"))
      .build();

    const results = app.synth();

    expect(results).toMatchSnapshot();
  });
});
