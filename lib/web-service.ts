import { Construct } from "constructs";
import { Names } from "cdk8s";
import { Deployment, Service, IntOrString } from "../imports/k8s";

export interface WebServiceProps {
  /**
   * The container image to use for this service.
   */
  readonly image: string;

  /**
   * Number of replicas.
   *
   * @default 1
   */
  readonly replicas?: number;

  /**
   * External port.
   *
   * @default 80
   */
  readonly port?: number;

  /**
   * Internal port.
   *
   * @default 8080
   */
  readonly containerPort?: number;

  /**
   * Service type.
   *
   * @default "ClusterIP"
   */
  readonly serviceType?: string;
}

export class WebService extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceProps) {
    super(scope, id);

    const port = props.port || 80;
    const containerPort = props.containerPort || 8080;
    const serviceType = props.serviceType || "ClusterIP";
    const label = { app: Names.toDnsLabel(this) };
    const replicas = props.replicas ?? 1;

    new Service(this, "service", {
      spec: {
        type: serviceType,
        ports: [{ port, targetPort: IntOrString.fromNumber(containerPort) }],
        selector: label,
      },
    });

    new Deployment(this, "deployment", {
      spec: {
        replicas,
        selector: {
          matchLabels: label,
        },
        template: {
          metadata: { labels: label },
          spec: {
            containers: [
              {
                name: "app",
                image: props.image,
                ports: [{ containerPort }],
              },
            ],
          },
        },
      },
    });
  }
}
