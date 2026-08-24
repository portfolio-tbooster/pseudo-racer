/** mm:ss.hh — the only format a lap time is ever read in. */
export function formatLap(seconds) {
  if (seconds === null || seconds === undefined) return '--:--.--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const h = Math.floor((seconds * 100) % 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(h).padStart(2, '0')}`;
}

const label = (ctx, x, y, text, size, color, align = 'left') => {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${size < 20 ? 600 : 700} ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.fillText(text, x, y);
};

export function drawHud(ctx, width, state) {
  const pad = Math.max(14, width * 0.022);
  const big = Math.max(20, Math.min(34, width * 0.032));
  const small = big * 0.44;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 6;

  label(ctx, pad, pad + small, 'LAP', small, 'rgba(255,255,255,0.65)');
  label(ctx, pad, pad + small + big, formatLap(state.lapTime), big, '#ffffff');

  label(ctx, pad, pad + small * 2 + big * 1.9, 'BEST', small, 'rgba(255,255,255,0.65)');
  label(ctx, pad, pad + small * 2 + big * 2.9, formatLap(state.best), big * 0.72, '#8fe3b0');

  label(ctx, width - pad, pad + small, 'SPEED', small, 'rgba(255,255,255,0.65)', 'right');
  label(ctx, width - pad, pad + small + big, String(Math.round(state.speed)), big, '#ffffff', 'right');
  label(ctx, width - pad, pad + small + big * 1.5, 'KM/H', small, 'rgba(255,255,255,0.65)', 'right');

  ctx.restore();
}
