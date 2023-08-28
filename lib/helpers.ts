import * as k8s from "../imports/k8s";

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
