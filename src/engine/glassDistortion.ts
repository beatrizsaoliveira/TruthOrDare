// ── Physics-Based Liquid Glass Displacement Map ──
// Generates per-surface displacement maps based on Snell's-law refraction
// for a convex glass bezel, following the approach described in
// https://kube.io/blog/liquid-glass-css-svg/
//
// Two SVG filters are maintained:
//   #glass-distortion-dock  — pill-shaped floating dock (updated on resize)
//   #glass-distortion-panel — modals and menus (objectBoundingBox — scales to
//                             any panel size automatically)
//
// For Chromium browsers the filter is promoted into backdrop-filter via
// CSS @supports, applying refraction to the crisp background before
// blurring — matching how real glass works.

const GlassDistortion = {
    // Index of refraction of the glass (1.45 ≈ borosilicate / optical glass)
    IOR: 1.45,

    // Controls how steeply the convex surface rises from the outer edge.
    // Higher = more refraction.
    GLASS_THICKNESS: 0.72,

    // Bezel width relative to min(element_size) / 2.
    // Clamped against the corner radius so it never spills into the flat face.
    BEZEL_FRACTION: 0.38,

    // ── Signed-distance function for a rounded rectangle ──
    // Returns the distance from pixel (px,py) to the nearest boundary edge.
    // Positive  → pixel is inside the shape.
    // Negative  → pixel is outside.
    _innerDist(
        px: number,
        py: number,
        cx: number,
        cy: number,
        hw: number,
        hh: number,
        r: number
    ): number {
        const qx = Math.abs(px - cx) - (hw - r);
        const qy = Math.abs(py - cy) - (hh - r);
        const outer =
            Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
            Math.min(Math.max(qx, qy), 0) -
            r;
        return -outer; // positive inside
    },

    // ── Generate a 1×1 neutral displacement map data URL ──
    // Used as the placeholder until the first real map is computed.
    _neutralDataUrl(): string {
        const c = document.createElement('canvas');
        c.width = 2;
        c.height = 2;
        const ctx = c.getContext('2d')!;
        const id = ctx.createImageData(2, 2);
        for (let i = 0; i < 16; i += 4) {
            id.data[i] = id.data[i + 1] = id.data[i + 2] = 128;
            id.data[i + 3] = 255;
        }
        ctx.putImageData(id, 0, 0);
        return c.toDataURL('image/png');
    },

    // ── Build displacement map ──
    // Returns { dataUrl, scale (pixels), width, height }
    build(
        width: number,
        height: number,
        borderRadius: number
    ): { dataUrl: string; scale: number; width: number; height: number } {
        const W = Math.max(Math.ceil(width), 2);
        const H = Math.max(Math.ceil(height), 2);
        const R = Math.min(borderRadius, Math.min(W, H) / 2);
        const cx = W / 2;
        const cy = H / 2;
        const bezelW = Math.min(
            Math.min(W, H) * this.BEZEL_FRACTION * 0.5,
            R * 0.85
        );

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
        const imgData = ctx.createImageData(W, H);
        const d = imgData.data;

        const mags = new Float32Array(W * H);
        const dxArr = new Float32Array(W * H);
        const dyArr = new Float32Array(W * H);
        let maxMag = 0;

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const px = x + 0.5;
                const py = y + 0.5;
                const dist = this._innerDist(px, py, cx, cy, W / 2, H / 2, R);
                const i = y * W + x;

                if (dist <= 0 || dist >= bezelW) continue;

                const t = dist / bezelW;
                const slope =
                    (this.GLASS_THICKNESS * 0.5) / Math.sqrt(t + 0.001);
                const sinT1 = slope / Math.sqrt(1 + slope * slope);
                const cosT1 = Math.sqrt(Math.max(0, 1 - sinT1 * sinT1));
                const sinT2 = sinT1 / this.IOR;
                const cosT2 = Math.sqrt(Math.max(0, 1 - sinT2 * sinT2));
                const tanT1 = sinT1 / (cosT1 + 1e-9);
                const tanT2 = sinT2 / (cosT2 + 1e-9);
                const mag = Math.abs(tanT1 - tanT2) * bezelW;

                mags[i] = mag;
                if (mag > maxMag) maxMag = mag;

                const nx = cx - px;
                const ny = cy - py;
                const len = Math.hypot(nx, ny) + 1e-9;
                dxArr[i] = nx / len;
                dyArr[i] = ny / len;
            }
        }

        if (maxMag < 0.001) maxMag = 1;

        for (let i = 0; i < W * H; i++) {
            const idx = i * 4;
            const mag = mags[i] ?? 0;
            if (mag > 0) {
                const n = mag / maxMag;
                const dx = dxArr[i] ?? 0;
                const dy = dyArr[i] ?? 0;
                d[idx] = Math.min(
                    255,
                    Math.max(0, Math.trunc(128 + dx * n * 127 + 0.5))
                );
                d[idx + 1] = Math.min(
                    255,
                    Math.max(0, Math.trunc(128 + dy * n * 127 + 0.5))
                );
            } else {
                d[idx] = 128;
                d[idx + 1] = 128;
            }
            d[idx + 2] = 128;
            d[idx + 3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);
        return {
            dataUrl: canvas.toDataURL('image/png'),
            scale: maxMag,
            width: W,
            height: H,
        };
    },

    // ── Dock filter (pill) ──
    _applyToDock(w: number, h: number): void {
        const filter = document.getElementById('glass-distortion-dock');
        if (!filter) return;
        const feImg = filter.querySelector('feImage');
        const feDisp = filter.querySelector('feDisplacementMap');
        if (!feImg || !feDisp) return;

        const r = h / 2;
        const { dataUrl, scale } = this.build(w, h, r);
        feImg.setAttribute('href', dataUrl);
        feImg.setAttribute('width', String(Math.ceil(w)));
        feImg.setAttribute('height', String(Math.ceil(h)));
        feDisp.setAttribute('scale', scale.toFixed(2));
    },

    // ── Panel filter (modals + menus) ──
    _applyToPanel(): void {
        const filter = document.getElementById('glass-distortion-panel');
        if (!filter) return;
        const feImg = filter.querySelector('feImage');
        const feDisp = filter.querySelector('feDisplacementMap');
        if (!feImg || !feDisp) return;

        const { dataUrl, scale, width } = this.build(580, 500, 20);
        feImg.setAttribute('href', dataUrl);
        feDisp.setAttribute('scale', (scale / width).toFixed(4));
    },

    // ── Init: dock ──
    initDock(): void {
        const dock = document.querySelector('.glass-dock');
        if (!dock) return;

        const neutral = this._neutralDataUrl();
        const dockFilter = document.getElementById('glass-distortion-dock');
        if (dockFilter) {
            const fi = dockFilter.querySelector('feImage');
            const fd = dockFilter.querySelector('feDisplacementMap');
            if (fi) fi.setAttribute('href', neutral);
            if (fd) fd.setAttribute('scale', '0');
        }

        const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
            const { width, height } = entries[0]!.contentRect;
            if (width > 4 && height > 4) this._applyToDock(width, height);
        });
        ro.observe(dock);

        const rect = dock.getBoundingClientRect();
        if (rect.width > 4 && rect.height > 4)
            this._applyToDock(rect.width, rect.height);
    },

    // ── Init: panels ──
    initPanel(): void {
        const neutral = this._neutralDataUrl();
        const panelFilter = document.getElementById('glass-distortion-panel');
        if (panelFilter) {
            const fi = panelFilter.querySelector('feImage');
            const fd = panelFilter.querySelector('feDisplacementMap');
            if (fi) fi.setAttribute('href', neutral);
            if (fd) fd.setAttribute('scale', '0');
        }
        this._applyToPanel();
    },
};

export function initGlassDistortion(): void {
    GlassDistortion.initDock();
    GlassDistortion.initPanel();
}
