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

	it("rejects Telegram webhook requests with missing or incorrect secrets", async () => {
		for (const provided of [null, "wrong_webhook_secret"]) {
			const headers = new Headers({ "Content-Type": "application/json" });
			if (provided) headers.set("X-Telegram-Bot-Api-Secret-Token", provided);
			const request = new Request("http://example.com/", {
				method: "POST",
				headers,
				body: "{}",
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, {
				TELEGRAM_WEBHOOK_SECRET: "test_webhook_secret",
			}, ctx);
			expect(response.status).toBe(401);
		}
	});

	it("fails closed when the Worker webhook secret is missing", async () => {
		const request = new Request("http://example.com/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{}",
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, {}, ctx);
		expect(response.status).toBe(503);
	});

	it("accepts Telegram webhook requests with the configured secret", async () => {
		const request = new Request("http://example.com/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Telegram-Bot-Api-Secret-Token": "test_webhook_secret",
			},
			body: "{}",
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, {
			TELEGRAM_WEBHOOK_SECRET: "test_webhook_secret",
		}, ctx);
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("OK");
	});

	it("does not expose legacy Telegram administration endpoints", async () => {
		for (const path of ["/setup-webhook", "/register-commands"]) {
			const ctx = createExecutionContext();
			const response = await worker.fetch(
				new Request(`http://example.com${path}`),
				env,
				ctx,
			);
			expect(response.status).toBe(404);
		}
	});
});
