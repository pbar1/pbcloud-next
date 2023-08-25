import { Construct } from "constructs";
import { Chart, ChartProps, Helm } from "cdk8s";
import * as path from "path";

export class ExternalDNS extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = {}) {
    super(scope, id, props);

    const chartDir = path.join(__dirname, "..", "helm", "external-dns");
    new Helm(this, "external-dns", {
      chart: chartDir,
    });
  }
}
