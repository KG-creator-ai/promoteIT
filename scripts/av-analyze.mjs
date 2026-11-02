#!/usr/bin/env node
/**
 * av-analyze.mjs — local AV facts for an exported artifact (SPEC-021).
 *
 *   node scripts/av-analyze.mjs [artifact] [--json] [--out file] [--assert]
 *
 * Facts: per-stream codec / duration / bitrate / channels / sample rate, audio
 * peak / RMS / clipping / silence, A/V drift, black-frame and freeze-frame
 * counts — each bound to the artifact's sha256 prefix.
 *
 * D11 rules:
 *   - no artifact            -> "AV-ARTIFACTS-ABSENT" and exit 0 (CI-safe)
 *   - artifact but no ffmpeg -> loud failure, non-zero exit (never a silent skip)
 *
 * Nothing is uploaded and the artifact is never modified.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execFileSync, execFile } from 'child_process';
import { fileURLToPath } from 'url';
import {
  analyzePcm,
  assessAvFacts,
  computeAvDrift,
  DEFAULT_FPS,
} from '../src/lib/avMetricsCore.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTIFACT_DIR = path.join(root, 'audit-artifacts');

function parseArgs(argv) {
  const out = { artifact: null, json: false, out: null, assert: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--assert') out.assert = true;
    else if (a === '--out') out.out = argv[++i];
    else if (!a.startsWith('--') && !out.artifact) out.artifact = a;
  }
  return out;
}

function findArtifact(explicit) {
  if (explicit) return path.resolve(root, explicit);
  if (!fs.existsSync(ARTIFACT_DIR)) return null;
  const media = fs
    .readdirSync(ARTIFACT_DIR)
    .filter(f => /\.(webm|mp4|mkv|mov)$/i.test(f))
    .map(f => path.join(ARTIFACT_DIR, f))
    .map(f => ({ f, m: fs.statSync(f).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return media.length ? media[0].f : null;
}

function resolveTool(name, envName) {
  const fromEnv = process.env[envName];
  if (fromEnv) {
    // An explicit path must exist — otherwise the run must fail loudly.
    if (!fs.existsSync(fromEnv)) return null;
    try {
      execFileSync(fromEnv, ['-version'], { stdio: 'ignore' });
      return fromEnv;
    } catch {
      return null;
    }
  }
  const candidates = [
    name,
    path.join(os.homedir(), '.local', 'ffmpeg', 'bin', name),
    path.join(os.homedir(), '.local', 'ffmpeg', name),
    path.join('/usr/local/bin', name),
    path.join('/usr/bin', name),
  ];
  for (const c of candidates) {
    try {
      if (c === name) {
        execFileSync(name, ['-version'], { stdio: 'ignore' });
        return name;
      }
      if (fs.existsSync(c)) return c;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { maxBuffer: 512 * 1024 * 1024, ...opts });
}

function probeStreams(ffprobe, file) {
  const raw = run(ffprobe, [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    file,
  ]).toString();
  return JSON.parse(raw);
}

function parseRate(value) {
  if (!value) return 0;
  const parts = String(value).split('/');
  const num = Number(parts[0]);
  const den = parts.length > 1 ? Number(parts[1]) : 1;
  return den ? num / den : num;
}

function streamFacts(probe) {
  const streams = probe.streams || [];
  const video = streams.find(s => s.codec_type === 'video');
  const audio = streams.find(s => s.codec_type === 'audio');
  const formatDuration = Number(probe.format?.duration || 0);
  const toFacts = (s, kind) => {
    if (!s) return null;
    const durationSec = Number(s.duration || formatDuration || 0);
    const bitrate = Number(s.bit_rate || 0);
    const facts = {
      codec: s.codec_name || 'unknown',
      durationSec: Number(durationSec.toFixed(6)),
      bitrate,
    };
    if (kind === 'audio') {
      facts.channels = s.channels || 0;
      facts.sampleRate = Number(s.sample_rate || 0);
    } else {
      facts.width = s.width || 0;
      facts.height = s.height || 0;
      facts.fps = Number(parseRate(s.avg_frame_rate || s.r_frame_rate || 0).toFixed(3)) || DEFAULT_FPS;
    }
    return facts;
  };
  return { video: toFacts(video, 'video'), audio: toFacts(audio, 'audio') };
}

function decodeAudioPcm(ffmpeg, file) {
  const buf = run(ffmpeg, ['-v', 'error', '-i', file, '-vn', '-f', 'f32le', '-ac', '1', '-ar', '48000', '-']);
  const samples = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
  return { samples, sampleRate: 48000 };
}

function detectVideoEvents(ffmpeg, file) {
  const args = [
    '-hide_banner',
    '-i', file,
    '-vf', 'blackdetect=d=0.2:pix_th=0.10,freezedetect=n=-60dB:d=0.5',
    '-an',
    '-f', 'null',
    '-',
  ];
  let stderr = '';
  try {
    execFileSync(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
  } catch (e) {
    stderr = String(e.stderr || '');
  }
  return stderr;
}

function countEvents(log, kind) {
  const pattern = new RegExp(`${kind}_start:\\s*([0-9.]+)`, 'g');
  const matches = [...log.matchAll(pattern)];
  return matches.length;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const artifact = findArtifact(args.artifact);

  if (!artifact || !fs.existsSync(artifact)) {
    console.log(`AV-ARTIFACTS-ABSENT: no AV artifact to analyse (${artifact ? path.relative(root, artifact) : 'no media in audit-artifacts/'})`);
    process.exit(0);
  }

  const ffprobe = resolveTool('ffprobe', 'AV_ANALYZE_FFPROBE');
  const ffmpeg = resolveTool('ffmpeg', 'AV_ANALYZE_FFMPEG');
  if (!ffprobe || !ffmpeg) {
    console.error(
      `AV-ANALYZE-TOOL-MISSING: ${[!ffprobe && 'ffprobe', !ffmpeg && 'ffmpeg'].filter(Boolean).join(' and ')} not found. ` +
        'The artifact exists, so the facts CANNOT be produced — refusing to report a silent skip.',
    );
    process.exit(2);
  }

  const probe = probeStreams(ffprobe, artifact);
  const streams = streamFacts(probe);
  const pcm = decodeAudioPcm(ffmpeg, artifact);
  // The drift is measured against the DECODED audio (what a listener actually
  // hears), not the container duration, which can be padded.
  const audio = analyzePcm(pcm.samples, pcm.sampleRate);
  const log = detectVideoEvents(ffmpeg, artifact);
  const blackFrameCount = countEvents(log, 'black');
  const freezeFrameCount = countEvents(log, 'freeze');
  const videoDuration = streams.video?.durationSec || 0;
  const drift = computeAvDrift(videoDuration, audio.durationSec, streams.video?.fps || DEFAULT_FPS);

  const bytes = fs.statSync(artifact).size;
  const digest = sha256(artifact);
  const facts = {
    artifact: { path: path.relative(root, artifact), sha256: digest.slice(0, 16), bytes },
    streams,
    audio,
    av: drift,
    video: {
      blackFrameCount,
      blackFrameRatio: videoDuration > 0 ? Number((blackFrameCount / Math.max(1, videoDuration * (streams.video?.fps || DEFAULT_FPS))).toFixed(6)) : 0,
      freezeFrameCount,
    },
    verdict: { pass: false, reasons: [] },
  };
  facts.verdict = assessAvFacts(facts);

  // stdout is the machine-readable facts; the human summary goes to stderr.
  const json = JSON.stringify(facts, null, 2);
  if (args.out) {
    fs.writeFileSync(path.resolve(root, args.out), json + '\n');
    console.log(`AV-FACTS-WRITTEN: ${path.relative(root, path.resolve(root, args.out))}`);
  } else {
    console.log(json);
  }
  console.error(`AV-FACTS-VERDICT: ${facts.verdict.pass ? 'PASS' : 'FAIL'}`);
  for (const r of facts.verdict.reasons) console.error(`AV-FACTS-REASON: ${r}`);

  if (args.assert && !facts.verdict.pass) process.exit(3);
  process.exit(0);
}

main();
