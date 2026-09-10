import "@testing-library/jest-dom/vitest";
import { cleanup } from "@solidjs/testing-library";
import { afterEach } from "vitest";

// Solid's testing library does not auto-clean between tests, so without this each render leaks
// its container into the next test's document.
afterEach(cleanup);
