import { Construct } from "constructs";
import * as k8s from "../imports/k8s";
import * as helpers from "./helpers";
import { Chart } from "cdk8s";
import { WritableDeep } from "type-fest";

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

export interface WorkloadProps {
  name?: string;
  namespace?: string;
  workloadType?: WorkloadType;
  expose?: boolean;
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

  /**
   * Adds a volume and volume mount pair to the workload.
   * @param pair Tuple containing the volume and volume mount.
   * @param containerName Applies the volume mount to only this container.
   */
  withVolumeAndMount(
    pair: [k8s.Volume, k8s.VolumeMount],
    containerName?: string
  ) {
    let [volume, mount] = pair;

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

  build(scope: Construct, id: string): Workload {
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
    const expose = props.expose ?? false;
    const containers = props.containers;
    const volumes = props.volumes;
    const schedule = props.schedule;

    const metadata: k8s.ObjectMeta = { name, namespace };
    const selectorLabels = { workload: name };
    const podSpec: k8s.PodSpec = { containers, volumes };

    if (workloadType === WorkloadType.Pod) {
      new k8s.Pod(this, "pod", { metadata, spec: podSpec });
    } else if (workloadType === WorkloadType.ReplicaSet) {
      new k8s.ReplicaSet(this, "replicaset", {
        metadata,
        spec: {
          selector: { matchLabels: selectorLabels },
          template: { spec: podSpec },
        },
      });
    } else if (workloadType === WorkloadType.Deployment) {
      new k8s.Deployment(this, "deployment", {
        metadata,
        spec: {
          selector: { matchLabels: selectorLabels },
          template: { spec: podSpec },
        },
      });
    } else if (workloadType === WorkloadType.StatefulSet) {
      new k8s.StatefulSet(this, "statefulset", {
        metadata,
        spec: {
          selector: { matchLabels: selectorLabels },
          template: { spec: podSpec },
          serviceName: name,
        },
      });
    } else if (workloadType === WorkloadType.DaemonSet) {
      new k8s.DaemonSet(this, "daemonset", {
        metadata,
        spec: {
          selector: { matchLabels: selectorLabels },
          template: { spec: podSpec },
        },
      });
    } else if (workloadType === WorkloadType.Job) {
      new k8s.Job(this, "job", {
        metadata,
        spec: { template: { spec: podSpec } },
      });
    } else if (workloadType === WorkloadType.CronJob) {
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

    // StatefulSets require an associated Service
    if (expose || workloadType === WorkloadType.StatefulSet) {
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
        metadata,
        spec: {
          selector: selectorLabels,
          ports: servicePorts,
        },
      });
    }
  }
}
