/**
 * The cel filter, defined once and referenced from CSS as url(#cel).
 *
 * Anime shading keeps a surface's colour and bands only its light. So the
 * photo is first smoothed (texture is what a painter leaves out) and gently
 * flattened, then its brightness is snapped to three steps (lit, mid and
 * shadow) and multiplied back over the colour. Snapping each channel on its
 * own instead breaks a noisy photo into blotches of the wrong hue. Finally
 * the main edges are found on a softened copy and drawn over as thin ink.
 *
 * Static images only: it runs when they are first drawn, not every frame.
 */
export function CelFilter() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <filter id="cel" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="smooth" />
        <feComponentTransfer in="smooth" result="flat">
          <feFuncR type="discrete" tableValues="0.03 0.14 0.26 0.38 0.5 0.62 0.74 0.86 0.97" />
          <feFuncG type="discrete" tableValues="0.03 0.14 0.26 0.38 0.5 0.62 0.74 0.86 0.97" />
          <feFuncB type="discrete" tableValues="0.04 0.15 0.27 0.39 0.51 0.63 0.75 0.87 0.98" />
        </feComponentTransfer>
        <feColorMatrix
          in="smooth"
          type="matrix"
          values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"
          result="luma"
        />
        {/* Light in three flat steps: shadow, mid, lit. */}
        <feComponentTransfer in="luma" result="shade">
          <feFuncR type="discrete" tableValues="0.62 0.84 1 1.12" />
          <feFuncG type="discrete" tableValues="0.62 0.84 1 1.12" />
          <feFuncB type="discrete" tableValues="0.66 0.86 1 1.1" />
        </feComponentTransfer>
        <feBlend in="flat" in2="shade" mode="multiply" result="toned" />
        <feGaussianBlur in="luma" stdDeviation="1.4" result="soft" />
        <feConvolveMatrix
          in="soft"
          order="3"
          kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
          preserveAlpha="true"
          result="edges"
        />
        {/* Edge strength becomes the alpha of a near-black ink line; the
            threshold keeps fine texture from being outlined. */}
        <feColorMatrix
          in="edges"
          type="matrix"
          values="0 0 0 0 0.05  0 0 0 0 0.04  0 0 0 0 0.08  5 0 0 0 -0.32"
          result="ink"
        />
        <feComposite in="ink" in2="toned" operator="over" />
      </filter>
    </svg>
  );
}
