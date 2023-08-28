import { Construct } from "constructs";
import * as k8s from "../imports/k8s";
import * as helpers from "./helpers";
import { Chart } from "cdk8s";
import { Writable } from "type-fest";

// ----------------------------------------------------------------------------

/**
 * Creates a new container builder.
 * @param image Container image.
 * @param name Container name. If not set, defaults to the basename of the image.
 * @returns
 */
export function container(image: string, name?: string): ContainerBuilder {
  return new ContainerBuilder(image, name);
}

export class ContainerBuilder {
  private container: Writable<k8s.Container>;

  constructor(image: string, name?: string) {
    name = name ?? helpers.nameFromImage(image);
    this.container = { name, image };
  }

  withEnv(env: k8s.EnvVar) {
    if (!this.container.env) {
      this.container.env = [];
    }
    this.container.env.push(env);
    return this;
  }

  withPort(port: k8s.ContainerPort) {
    if (!this.container.ports) {
      this.container.ports = [];
    }
    this.container.ports.push(port);
    return this;
  }

  asWorkload(scope: Construct, id: string): WorkloadBuilder {
    return new WorkloadBuilder(scope, id).withContainer(this.container);
  }

  build(): k8s.Container {
    return this.container;
  }
}

// ----------------------------------------------------------------------------

export enum WorkloadType {
  Deployment,
  StatefulSet,
  DaemonSet,
}

export interface WorkloadProps {
  name?: string;
  namespace?: string;
  workloadType?: WorkloadType;
  expose?: boolean;
  containers?: k8s.Container[];
}

export class WorkloadBuilder {
  private scope: Construct;
  private id: string;
  private props: WorkloadProps;

  constructor(scope: Construct, id: string) {
    this.scope = scope;
    this.id = id;
    this.props = {};
  }

  withName(name: string) {
    this.props.name = name;
    return this;
  }

  withNamespace(namespace: string) {
    this.props.namespace = namespace;
    return this;
  }

  withWorkloadType(workloadType: WorkloadType) {
    this.props.workloadType = workloadType;
    return this;
  }

  withExpose() {
    this.props.expose = true;
    return this;
  }

  withContainer(container: k8s.Container) {
    if (!this.props.containers) {
      this.props.containers = [];
    }
    this.props.containers.push(container);
    return this;
  }

  build(): Workload {
    return new Workload(this.scope, this.id, this.props);
  }
}

export class Workload extends Chart {
  constructor(scope: Construct, id: string, props: WorkloadProps) {
    super(scope, id);

    if (!props.containers || props.containers.length < 1) {
      throw new Error("must have at least 1 container");
    }

    const name = props.name ?? id;
    const namespace = props.namespace;
    const workloadType = props.workloadType ?? WorkloadType.Deployment;
    const expose = props.expose ?? false;
    const containers = props.containers;
    const selectorLabels = { app: name };

    if (workloadType === WorkloadType.Deployment) {
      new k8s.Deployment(this, "deployment", {
        metadata: { name, namespace },
        spec: {
          selector: { matchLabels: selectorLabels },
          template: {
            // TODO: fill in
            spec: { containers },
          },
        },
      });
    } else if (workloadType === WorkloadType.StatefulSet) {
      throw new Error("statefulset not implemented");
    } else if (workloadType === WorkloadType.DaemonSet) {
      throw new Error("daemonset not implemented");
    }

    if (expose) {
      let servicePorts: k8s.ServicePort[] = [];
      containers.forEach((ctr) => {
        ctr.ports?.forEach((port) =>
          servicePorts.push({
            name: port.name,
            protocol: port.protocol,
            port: port.containerPort,
          })
        );
      });

      new k8s.Service(this, "service", {
        metadata: { name, namespace },
        spec: {
          selector: selectorLabels,
          ports: servicePorts,
        },
      });
    }
  }
}
