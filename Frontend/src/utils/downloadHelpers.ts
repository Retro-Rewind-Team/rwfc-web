/** Triggers a browser file download for a given Blob. */
export function triggerBlobDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Deferred: revoking in the same tick as click() cancels the download in some browsers, which
    // read the blob asynchronously after the navigation has started.
    setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

/** Returns the standard ghost file name for a given finish time display string. */
export function ghostFilename(finishTimeDisplay: string): string {
    return `${finishTimeDisplay.replace(":", "m").replace(".", "s")}.rkg`;
}
