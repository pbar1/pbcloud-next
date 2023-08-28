import * as k8s from "../imports/k8s";
import * as path from "path";

/**
 * Given an image like "ghcr.io/example/img:latest", return "img".
 * @param image Container image.
 */
export function nameFromImage(image: string): string {
  return path.basename(image).split(":")[0];
}

/**
 * Convenience function for creating a Kubernetes container environment
 * variable from a name-value pair.
 * @param name Environment variable name.
 * @param value Environment variable value.
 */
export function env(name: string, value: string): k8s.EnvVar {
  return { name, value };
}

/**
 * Convenience function for creating a Kubernetes container environment
 * variable from a Kubernetes secret key.
 * @param name Environment variable name.
 * @param secret Kubernetes secret name.
 * @param key Kubernetes secret key containing environment variable value.
 */
export function envSec(name: string, secret: string, key: string): k8s.EnvVar {
  return {
    name,
    valueFrom: { secretKeyRef: { name: secret, key } },
  };
}

/**
 * Convenience function for creating a Kubernetes container port from the given
 * values.
 * @param port Port number.
 * @param protocol Port protocol.
 * @param name Port name.
 * @returns
 */
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

/**
 * Convenience function for creating a Kubernetes volume and volume mount of
 * type `hostPath`.
 * @param name Volume name.
 * @param hostPath Path on the host.
 * @param mountPath Path within the container.
 * @param readOnly Whether to mount the path as read-only.
 * @returns A tuple containing the volume and volume mount.
 */
export function hostPath(
  name: string,
  hostPath: string,
  mountPath: string,
  readOnly?: boolean
): [k8s.Volume, k8s.VolumeMount] {
  return [
    { name, hostPath: { path: hostPath } },
    { name, mountPath, readOnly },
  ];
}
