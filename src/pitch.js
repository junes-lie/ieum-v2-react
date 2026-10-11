export const PITCH_ANALYSIS_VERSION = 'normalized-difference-v1'

export function estimatePitch(samples, sampleRate, suppliedRms) {
  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]
  const rms = Number.isFinite(suppliedRms) ? suppliedRms : Math.sqrt(sum / samples.length)
  if (rms < 0.0015) return { hz:0, confidence:0, reason:'low-signal', rms }

  const minLag = Math.max(2, Math.floor(sampleRate / 1050))
  const maxLag = Math.min(Math.floor(sampleRate / 65), Math.floor(samples.length * 0.46))
  // Cumulative normalized differences reject aperiodic input before choosing
  // a lag; the former relative correlation peak admitted breath/noise pitches.
  // YIN reference: https://pubmed.ncbi.nlm.nih.gov/12002874/
  const scores = new Float64Array(maxLag + 1)
  const windowLength = samples.length - maxLag
  let cumulative = 0
  for (let lag = 1; lag <= maxLag; lag++) {
    let difference = 0
    for (let i = 0; i < windowLength; i += 2) {
      const delta = samples[i] - samples[i + lag]
      difference += delta * delta
    }
    cumulative += difference
    scores[lag] = cumulative > 1e-12 ? difference * lag / cumulative : 1
  }

  let bestLag = 0
  for (let lag = minLag; lag < maxLag; lag++) {
    if (scores[lag] < 0.15) {
      while (lag + 1 < maxLag && scores[lag + 1] < scores[lag]) lag++
      bestLag = lag
      break
    }
  }
  if (!bestLag) return { hz:0, confidence:Math.max(0,1-Math.min(...scores.subarray(minLag))), reason:'no-periodicity', rms }
  const left = scores[bestLag - 1]
  const center = scores[bestLag]
  const right = scores[bestLag + 1]
  const denominator = left - 2 * center + right
  const offset = Math.abs(denominator) > 1e-8 ? 0.5 * (left - right) / denominator : 0
  const refinedLag = bestLag + Math.max(-1,Math.min(1,offset))
  return { hz:sampleRate / refinedLag, confidence:1-center, reason:'detected', rms }
}
