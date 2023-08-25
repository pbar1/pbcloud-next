import { ExternalDNS } from "./lib/external-dns";
import { MyChart } from "./main";
import { Testing } from "cdk8s";

describe("Placeholder", () => {
  test("Empty", () => {
    const app = Testing.app();
    const chart = new MyChart(app, "test-chart");
    const results = Testing.synth(chart);
    expect(results).toMatchSnapshot();
  });

  // TODO: Move to be inline with external-dns lib
  test("ExternalDNS", () => {
    const app = Testing.app();
    const chart = new ExternalDNS(app, "test-chart");
    const results = Testing.synth(chart);
    expect(results).toMatchSnapshot();
  });
});
