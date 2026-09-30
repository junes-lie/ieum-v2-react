export function estimatePitch(samples, sampleRate, suppliedRms) {
  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]
  const rms = Number.isFinite(suppliedRms) ? suppliedRms : Math.sqrt(sum / samples.length)
  if (rms < 0.0015) return { hz:0, confidence:0, reason:'low-signal', rms }

  const minLag = Math.max(2, Math.floor(sampleRate / 1050))
  const maxLag = Math.min(Math.floor(sampleRate / 65), Math.floor(samples.length * 0.46))
  let mean = 0
  for (let i = 0; i < samples.length; i += 2) mean += samples[i]
  mean /= Math.ceil(samples.length / 2)
  const scores = new Float32Array(maxLag + 1)
  let bestScore = -1
  for (let lag = minLag; lag <= maxLag; lag++) {
    let correlation = 0, energy = 0
    for (let i = 0; i < samples.length - lag; i += 4) {
      const a = samples[i] - mean
      const b = samples[i + lag] - mean
      correlation += a * b
      energy += a * a + b * b
    }
    const score = energy > 1e-12 ? (2 * correlation) / energy : 0
    scores[lag] = score
    if (score > bestScore) bestScore = score
  }

  const required = Math.max(0.28, bestScore * 0.82)
  let bestLag = 0
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (scores[lag] >= required && scores[lag] >= scores[lag - 1] && scores[lag] > scores[lag + 1]) {
      bestLag = lag
      break
    }
  }
  if (!bestLag || bestScore < 0.28) return { hz:0, confidence:Math.max(0,bestScore), reason:'no-periodicity', rms }
  const left = scores[bestLag - 1]
  const center = scores[bestLag]
  const right = scores[bestLag + 1]
  const denominator = left - 2 * center + right
  const offset = Math.abs(denominator) > 1e-8 ? 0.5 * (left - right) / denominator : 0
  const refinedLag = bestLag + Math.max(-1,Math.min(1,offset))
  return { hz:sampleRate / refinedLag, confidence:center, reason:'detected', rms }
}
