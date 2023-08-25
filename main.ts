import { Construct } from "constructs";
import { App, Chart, ChartProps } from "cdk8s";
import { WebService } from "./lib/web-service";
import { ExternalDNS } from "./lib/external-dns";

export class MyChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = {}) {
    super(scope, id, props);

    // define resources here
    new WebService(this, "hello-k8s", {
      image: "paulbouwer/hello-kubernetes:1.7",
    });
  }
}

const app = new App();

new MyChart(app, "hello");
new ExternalDNS(app, "external-dns");

app.synth();
