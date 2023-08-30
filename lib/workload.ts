import { Construct } from "constructs";
import * as k8s from "../imports/k8s";
import * as helpers from "./helpers";
import { Chart } from "cdk8s";
import { WritableDeep } from "type-fest";

// TODO: Consider merging the ContainerBuilder and WorkloadBuilder back
// together now that ExposeType is now in the mix. It could work well if the
// type-state pattern is used to add some guards. The flow looks relatively
// fluent alredy: container->workload->expose. Actually in thinking about this
// now, they should all probably have their own builders and be chained
// fluently using `.as()` methods instead, to allow for merging in and creation
// of new expose types from scratch for example.

// Container ------------------------------------------------------------------

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
  private container: WritableDeep<k8s.Container>;

  constructor(image: string, name?: string) {
    name = name ?? helpers.nameFromImage(image);
    this.container = { name, image };
  }

  getName(): string {
    return this.container.name;
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

  asWorkload(workloadType = WorkloadType.Deployment): WorkloadBuilder {
    return new WorkloadBuilder()
      .withWorkloadType(workloadType)
      .withContainer(this.container)
      .withName(this.container.name);
  }

  build(): k8s.Container {
    return this.container;
  }
}

// Workload -------------------------------------------------------------------

export enum WorkloadType {
  Pod,
  ReplicaSet,
  Deployment,
  StatefulSet,
  DaemonSet,
  Job,
  CronJob,
}

export enum ExposeType {
  Service,
  Ingress,
  HttpProxy,
}

export interface WorkloadProps {
  name?: string;
  namespace?: string;
  workloadType?: WorkloadType;
  exposeType?: ExposeType;
  containers?: WritableDeep<k8s.Container>[];
  volumes?: WritableDeep<k8s.Volume>[];
  schedule?: string;
}

export class WorkloadBuilder {
  private props: WorkloadProps;

  constructor() {
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
    this.props.exposeType = ExposeType.Service;
    return this;
  }

  withContainer(container: k8s.Container) {
    if (!this.props.containers) {
      this.props.containers = [];
    }
    this.props.containers.push(container);
    return this;
  }

  /**
   * Adds a volume and volume mount pair to the workload.
   * @param pair Tuple containing the volume and volume mount.
   * @param containerName Applies the volume mount to only this container.
   */
  withVolumeAndMount(
    pair: [k8s.Volume, k8s.VolumeMount],
    containerName?: string,
  ) {
    const [volume, mount] = pair;

    if (!this.props.volumes) {
      this.props.volumes = [];
    }
    this.props.volumes.push(volume);

    if (!this.props.containers) {
      this.props.containers = [];
    }
    this.props.containers
      .filter((container) => !containerName ?? container.name === containerName)
      .forEach((container) => {
        if (!container.volumeMounts) {
          container.volumeMounts = [];
        }
        container.volumeMounts.push(mount);
      });

    return this;
  }

  withSchedule(schedule: string) {
    this.props.schedule = schedule;
    return this;
  }

  build(scope: Construct, id?: string): Workload {
    if (id === undefined) {
      if (this.props.name === undefined) {
        throw new Error("id must be passed if props.name has not been set");
      }
      id = this.props.name;
    }
    return new Workload(scope, id, this.props);
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
    const exposeType = props.exposeType;
    const containers = props.containers;
    const volumes = props.volumes;
    const schedule = props.schedule;

    const metadata: k8s.ObjectMeta = { name, namespace };
    const selectorLabels = { workload: name };
    const podSpec: k8s.PodSpec = { containers, volumes };

    if (workloadType === WorkloadType.Pod) {
      new k8s.Pod(this, "pod", { metadata, spec: podSpec });
    }

    if (workloadType === WorkloadType.ReplicaSet) {
      new k8s.ReplicaSet(this, "replicaset", {
        metadata,
        spec: {
          selector: { matchLabels: selectorLabels },
          template: { spec: podSpec },
        },
      });
    }

    if (workloadType === WorkloadType.Deployment) {
      new k8s.Deployment(this, "deployment", {
        metadata,
        spec: {
          selector: { matchLabels: selectorLabels },
          template: { spec: podSpec },
        },
      });
    }

    if (workloadType === WorkloadType.StatefulSet) {
      new k8s.StatefulSet(this, "statefulset", {
        metadata,
        spec: {
          selector: { matchLabels: selectorLabels },
          template: { spec: podSpec },
          serviceName: name,
        },
      });
    }

    if (workloadType === WorkloadType.DaemonSet) {
      new k8s.DaemonSet(this, "daemonset", {
        metadata,
        spec: {
          selector: { matchLabels: selectorLabels },
          template: { spec: podSpec },
        },
      });
    }

    if (workloadType === WorkloadType.Job) {
      new k8s.Job(this, "job", {
        metadata,
        spec: { template: { spec: podSpec } },
      });
    }

    if (workloadType === WorkloadType.CronJob) {
      if (!schedule) {
        throw new Error("must set schedule for for CronJob");
      }
      new k8s.CronJob(this, "cronjob", {
        metadata,
        spec: {
          jobTemplate: { spec: { template: { spec: podSpec } } },
          schedule,
        },
      });
    }

    // All expose types will at least need a Service
    // StatefulSets require an associated Service
    if (exposeType !== undefined || workloadType === WorkloadType.StatefulSet) {
      const servicePorts: k8s.ServicePort[] = [];
      containers.forEach((ctr) => {
        ctr.ports?.forEach((port) =>
          servicePorts.push({
            name: port.name,
            protocol: port.protocol,
            port: port.containerPort,
          }),
        );
      });

      new k8s.Service(this, "service", {
        metadata,
        spec: {
          selector: selectorLabels,
          ports: servicePorts,
        },
      });
    }

    if (exposeType === ExposeType.Ingress) {
      throw new Error("ingress not implemented");
    }

    if (exposeType === ExposeType.HttpProxy) {
      throw new Error("httpproxy not implemented");
    }
  }
}
