/**
 * The cel filter, defined once and referenced from CSS as url(#cel).
 *
 * Two passes over a photograph. Colour is posterised to five flat tones per
 * channel, which is what turns soft skin and fabric into painted bands. Then
 * the edges are found on a slightly softened luminance copy and drawn back
 * over the top as thin ink lines, so only the shapes that matter get an
 * outline and the texture of the photo does not.
 *
 * Static images only: it runs when they are first drawn, not every frame.
 */
export function CelFilter() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <filter id="cel" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feComponentTransfer in="SourceGraphic" result="flat">
          <feFuncR type="discrete" tableValues="0.04 0.22 0.42 0.62 0.82 0.97" />
          <feFuncG type="discrete" tableValues="0.04 0.22 0.42 0.62 0.82 0.97" />
          <feFuncB type="discrete" tableValues="0.06 0.24 0.44 0.64 0.84 0.98" />
        </feComponentTransfer>
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"
          result="luma"
        />
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
        <feComposite in="ink" in2="flat" operator="over" />
      </filter>
    </svg>
  );
}
