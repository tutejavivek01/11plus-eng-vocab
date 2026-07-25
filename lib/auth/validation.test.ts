import { describe, expect, it } from "vitest";
import { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from "./validation";

describe("isValidEmail", () => {
  it("accepts well-formed emails", () => {
    expect(isValidEmail("student@example.com")).toBe(true);
    expect(isValidEmail("a.b+c@sub.example.co.uk")).toBe(true);
  });

  it("rejects malformed or missing emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing-domain@")).toBe(false);
    expect(isValidEmail("@missing-local.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
  });
});

describe("isValidPassword", () => {
  it(`accepts passwords of exactly ${MIN_PASSWORD_LENGTH} characters`, () => {
    expect(isValidPassword("a".repeat(MIN_PASSWORD_LENGTH))).toBe(true);
  });

  it("rejects passwords one character under the minimum", () => {
    expect(isValidPassword("a".repeat(MIN_PASSWORD_LENGTH - 1))).toBe(false);
  });

  it("rejects empty or missing passwords", () => {
    expect(isValidPassword("")).toBe(false);
    expect(isValidPassword(undefined)).toBe(false);
    expect(isValidPassword(null)).toBe(false);
  });
});
