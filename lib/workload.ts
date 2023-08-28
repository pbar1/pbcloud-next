import { Construct } from "constructs";
import * as k8s from "../imports/k8s";
import * as path from "path";
import { Chart } from "cdk8s";

export function container(image: string, name?: string): k8s.Container {
  // Given an image like "ghcr.io/example/img:latest", return "img"
  if (name === undefined) {
    name = path.basename(image);
    name = name.split(":")[0];
  }

  return { name, image };
}

export function env(name: string, value: string): k8s.EnvVar {
  return { name, value };
}

export function envSec(name: string, secret: string, key: string): k8s.EnvVar {
  return {
    name,
    valueFrom: { secretKeyRef: { name: secret, key } },
  };
}

export function port(
  port: number,
  protocol?: string,
  name?: string
): k8s.ContainerPort {
  return {
    containerPort: port,
    protocol,
    name,
  };
}

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
