import { fireEvent, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import LiveRegion from "../../components/common/LiveRegion";
import ToggleGroup from "../../components/common/ToggleGroup";
import GhostDownloadButton from "../../components/ui/timeTrial/GhostDownloadButton";

describe("LiveRegion", () => {
    it("is a polite, atomic status region", () => {
        render(() => <LiveRegion message="12 racers found." />);

        const region = screen.getByRole("status");
        expect(region).toHaveAttribute("aria-live", "polite");
        expect(region).toHaveAttribute("aria-atomic", "true");
        expect(region).toHaveTextContent("12 racers found.");
    });

    it("stays mounted and updates its text when the message changes", () => {
        const [message, setMessage] = createSignal("");
        render(() => <LiveRegion message={message()} />);

        const region = screen.getByRole("status");
        expect(region).toBeEmptyDOMElement();

        setMessage("3 races found.");
        expect(screen.getByRole("status")).toBe(region);
        expect(region).toHaveTextContent("3 races found.");
    });
});

describe("ToggleGroup", () => {
    const options = [
        { value: "all", label: "All" },
        { value: "karts", label: "Karts" },
    ];

    it("exposes the selected option with aria-pressed", () => {
        render(() => <ToggleGroup value="karts" onChange={() => {}} options={options} />);

        expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
            "aria-pressed",
            "false",
        );
        expect(screen.getByRole("button", { name: "Karts" })).toHaveAttribute(
            "aria-pressed",
            "true",
        );
    });

    it("names the group when given a label", () => {
        render(() => (
            <ToggleGroup label="Vehicle type" value="all" onChange={() => {}} options={options} />
        ));

        expect(screen.getByRole("group", { name: "Vehicle type" })).toBeInTheDocument();
    });

    it("adds no group role without a label", () => {
        render(() => <ToggleGroup value="all" onChange={() => {}} options={options} />);

        expect(screen.queryByRole("group")).not.toBeInTheDocument();
    });
});

describe("GhostDownloadButton", () => {
    it("downloads when a ghost is available", () => {
        const onDownload = vi.fn();
        render(() => <GhostDownloadButton available submissionId={1} onDownload={onDownload} />);

        const button = screen.getByRole("button", { name: "Download ghost" });
        expect(button).not.toHaveAttribute("aria-disabled", "true");
        fireEvent.click(button);
        expect(onDownload).toHaveBeenCalledOnce();
    });

    it("stays focusable and explains why it is unavailable without relying on title", () => {
        const onDownload = vi.fn();
        render(() => (
            <GhostDownloadButton available={false} submissionId={7} onDownload={onDownload} />
        ));

        const button = screen.getByRole("button", { name: "Download ghost" });
        // aria-disabled, not disabled: a disabled button leaves the tab order, so keyboard and
        // screen reader users would never reach the reason.
        expect(button).not.toBeDisabled();
        expect(button).toHaveAttribute("aria-disabled", "true");
        expect(button).not.toHaveAttribute("title");
        expect(button).toHaveAccessibleDescription("Ghost file not available for this submission");

        fireEvent.click(button);
        expect(onDownload).not.toHaveBeenCalled();
    });

    it("keeps the full-width variant's visible label as its name", () => {
        render(() => (
            <GhostDownloadButton
                variant="block"
                available={false}
                submissionId={2}
                onDownload={() => {}}
            />
        ));

        const button = screen.getByRole("button", { name: "Download Ghost" });
        expect(button).toHaveAccessibleDescription("Ghost file not available for this submission");
    });
});
