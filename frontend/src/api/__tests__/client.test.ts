import { describe, it, expect, beforeEach, afterEach } from "vitest";
import HttpClient from "../client";
import {
  mockFetch,
  mockFetchNoContent,
  mockFetchNetworkError,
  restoreFetch,
} from "@/test/mockFetch";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  restoreFetch();
});

describe("HttpClient", () => {
  const client = new HttpClient("http://test-api/api/v1");

  describe("GET", () => {
    it("faz GET e retorna JSON", async () => {
      mockFetch({ status: 200, body: { id: "123", name: "test" } });
      const result = await client.get<{ id: string; name: string }>(
        "/canvases",
      );
      expect(result).toEqual({ id: "123", name: "test" });
    });

    it("envia token JWT no header Authorization", async () => {
      localStorage.setItem("cloudbuilder-auth-token", "my-jwt-token");
      let capturedHeaders: Record<string, string> = {};
      mockFetch({ status: 200, body: {} });
      // Override mock to capture headers
      globalThis.fetch = async (
        _url: string | URL | Request,
        init?: RequestInit,
      ) => {
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };
      await client.get("/canvases");
      expect(capturedHeaders["Authorization"]).toBe("Bearer my-jwt-token");
    });

    it("envia X-Tenant-Id quando presente no localStorage", async () => {
      localStorage.setItem("cloudbuilder-active-tenant-id", "tenant-42");
      let capturedHeaders: Record<string, string> = {};
      globalThis.fetch = async (
        _url: string | URL | Request,
        init?: RequestInit,
      ) => {
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };
      await client.get("/canvases");
      expect(capturedHeaders["X-Tenant-Id"]).toBe("tenant-42");
    });

    it("trata 401 limpando tokens", async () => {
      localStorage.setItem("cloudbuilder-auth-token", "expired-token");
      mockFetch({
        status: 401,
        body: {
          status: 401,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
        },
      });
      await expect(client.get("/canvases")).rejects.toThrow();
      expect(localStorage.getItem("cloudbuilder-auth-token")).toBeNull();
    });

    it("trata 204 No Content", async () => {
      mockFetchNoContent();
      const result = await client.get<void>("/canvases/123");
      expect(result).toBeUndefined();
    });

    it("trata erro de rede", async () => {
      mockFetchNetworkError();
      await expect(client.get("/canvases")).rejects.toMatchObject({
        status: 0,
      });
    });

    it("trata erro 400 com mensagem", async () => {
      mockFetch({
        status: 400,
        body: {
          status: 400,
          message: "Bad request",
          timestamp: new Date().toISOString(),
        },
      });
      await expect(client.get("/canvases")).rejects.toMatchObject({
        status: 400,
        message: "Bad request",
      });
    });

    it("pula autenticação com skipAuth", async () => {
      localStorage.setItem("cloudbuilder-auth-token", "should-not-send");
      let capturedHeaders: Record<string, string> = {};
      globalThis.fetch = async (
        _url: string | URL | Request,
        init?: RequestInit,
      ) => {
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };
      await client.get("/health", { skipAuth: true });
      expect(capturedHeaders["Authorization"]).toBeUndefined();
    });
  });

  describe("POST", () => {
    it("faz POST com body JSON", async () => {
      let capturedBody: string | undefined;
      globalThis.fetch = async (
        _url: string | URL | Request,
        init?: RequestInit,
      ) => {
        capturedBody = init?.body as string;
        return new Response(JSON.stringify({ id: "new-1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };
      const result = await client.post<{ id: string }>("/canvases", {
        name: "Meu Design",
      });
      expect(result).toEqual({ id: "new-1" });
      expect(capturedBody).toBe(JSON.stringify({ name: "Meu Design" }));
    });
  });

  describe("PUT", () => {
    it("faz PUT com body JSON", async () => {
      mockFetch({ status: 200, body: { id: "123", name: "Atualizado" } });
      const result = await client.put<{ id: string; name: string }>(
        "/canvases/123",
        { name: "Atualizado" },
      );
      expect(result.name).toBe("Atualizado");
    });
  });

  describe("DELETE", () => {
    it("faz DELETE sem body", async () => {
      mockFetch({ status: 204 });
      const result = await client.delete("/canvases/123");
      expect(result).toBeUndefined();
    });
  });
});
