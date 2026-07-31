import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index.ts";

describe("Eukara worker", () => {
	it("returns the service status from the TypeScript entrypoint", async () => {
		const request = new Request("http://example.com");
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("Eukara is running");
	});

	it("returns the service status through the Worker integration binding", async () => {
		const response = await SELF.fetch("http://example.com");
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("Eukara is running");
	});
});
