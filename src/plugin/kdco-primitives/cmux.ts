/**
 * cmux environment detection and workflow utilities.
 *
 * Detects whether cmux is available for programmatic terminal control
 * via workspace ID or explicit socket configuration.
 */

import { z } from "zod"

/** Validates cmux environment detection */
const cmuxEnvSchema = z.object({
	CMUX_WORKSPACE_ID: z.string().optional(),
	CMUX_SURFACE_ID: z.string().optional(),
	CMUX_SOCKET_PATH: z.string().optional(),
	CMUX_SOCKET_MODE: z.string().optional(),
})

/** cmux context resolved from environment */
export interface CmuxContext {
	workspaceID: string | undefined
	surfaceID: string | undefined
	socketPath: string | undefined
	socketMode: string | undefined
}

/** cmux environment variables */
export interface CmuxEnvironment {
	CMUX_WORKSPACE_ID?: string
	CMUX_SURFACE_ID?: string
	CMUX_SOCKET_PATH?: string
	CMUX_SOCKET_MODE?: string
}

/** Function type for resolving executable paths */
export type ResolveExecutable = (executable: string) => string | null

function normalizeCmuxValue(value: string | undefined): string | undefined {
	const trimmed = value?.trim()
	return trimmed ? trimmed : undefined
}

/** Detect cmux context from environment variables */
export function detectCmuxContext(env: Record<string, string | undefined> = process.env): CmuxContext {
	const parsed = cmuxEnvSchema.parse(env)
	return {
		workspaceID: normalizeCmuxValue(parsed.CMUX_WORKSPACE_ID),
		surfaceID: normalizeCmuxValue(parsed.CMUX_SURFACE_ID),
		socketPath: normalizeCmuxValue(parsed.CMUX_SOCKET_PATH),
		socketMode: normalizeCmuxValue(parsed.CMUX_SOCKET_MODE),
	}
}

/** Check if cmux workflow can be used (executable present + context available) */
export function canUseCmuxWorkflow(
	env: Record<string, string | undefined> = process.env,
	resolveExecutable: ResolveExecutable = (command) => Bun.which(command),
	cmuxExecutable = "cmux",
): boolean {
	if (!resolveExecutable(cmuxExecutable)) {
		return false
	}

	const context = detectCmuxContext(env)
	if (context.workspaceID) {
		return true
	}

	const socketModeAllowsExternalControl = context.socketMode?.toLowerCase() === "allowall"
	return Boolean(context.socketPath && socketModeAllowsExternalControl)
}
