import { Testing } from "cdk8s";
import { container } from "./workload";

describe("Workload", () => {
  test("Basic", () => {
    const app = Testing.app();

    const chart = container("example.com/repo/image:tag")
      .asWorkload()
      .build(app);

    const results = Testing.synth(chart);

    expect(results).toMatchSnapshot();
  });
});
