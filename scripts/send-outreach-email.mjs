#!/usr/bin/env node
/**
 * Professor Outreach Email Sender
 *
 * Usage:
 *   node scripts/send-outreach-email.mjs <professor-id>
 *   node scripts/send-outreach-email.mjs us-008           # Send to John DeNero
 *   node scripts/send-outreach-email.mjs us-008 --dry-run  # Preview without sending
 *   node scripts/send-outreach-email.mjs --list            # List all pending professors
 */

import nodemailer from "nodemailer";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../docs/marketing/professor-outreach.json");

// ── Config ──────────────────────────────────────────────
const GMAIL_USER = "l89192164@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const SENDER_NAME = process.env.SENDER_NAME || "Sojeong Kim";
// ────────────────────────────────────────────────────────

function loadData() {
  return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
}

function saveData(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function buildEmailEN(prof) {
  const subject = `Free code execution visualizer for ${prof.course.split("(")[0].trim()} — would love your feedback`;

  const body = `Hi Professor ${prof.name.split(" ").pop()},

I built a free, open-source tool that visualizes code execution step by step — and I think it could help students in your ${prof.course} class at ${prof.university}. I know you're busy, so I'll keep this short.

${prof.hook}

What it does: Students step through code line by line and watch memory, variables, and call stacks update in real time.

Two modes: Lesson mode (guided curriculum) and Playground mode (students write their own code and see it visualized).

Live demo: https://codeinsight.online
GitHub: https://github.com/jammy0903/CodeInsight

It's completely free and MIT licensed. If you have a minute to check it out, I'd really appreciate any feedback — what's missing, what would make it actually useful in a classroom setting.

Thank you for taking the time to read this. I know how packed your schedule must be.

Best,
${SENDER_NAME}`;

  return { subject, body };
}

function buildEmailKR(prof) {
  const coursePart = prof.course ? `${prof.course} ` : "";
  const subject = `${coursePart}수업용 무료 코드 실행 시각화 도구 — 피드백 부탁드립니다`;

  const body = `${prof.name} 교수님 안녕하세요,

${prof.university}에서 ${prof.course || "컴퓨터공학 관련"} 수업을 담당하고 계신 것으로 알고 있습니다. 바쁘신 와중에 죄송하지만, 수업에 도움이 될 수 있을 것 같아 짧게 연락드립니다.

${prof.hook}

코드 실행 과정을 한 줄씩 단계별로 시각화하는 무료 오픈소스 도구(CodeInsight)를 만들었습니다.

레슨 모드(단계별 가이드 커리큘럼)와 플레이그라운드 모드(직접 코드 작성 후 시각화) 두 가지를 제공하며, 완전 무료(MIT 라이선스)입니다.

라이브 데모: https://codeinsight.online
GitHub: https://github.com/jammy0903/CodeInsight

혹시 한번 살펴보시고 부족한 점이나 개선할 부분이 있다면 피드백 주시면 정말 감사하겠습니다.

바쁘신 중에 읽어주셔서 감사합니다.

김소정 드림`;

  return { subject, body };
}

function buildEmail(prof) {
  return prof.country === "KR" ? buildEmailKR(prof) : buildEmailEN(prof);
}

function listPending(data) {
  const pending = data.professors.filter((p) => p.status === "pending");
  console.log(`\n Pending: ${pending.length} / ${data.professors.length}\n`);
  console.log("ID         | Country | University              | Name");
  console.log("-----------|---------|-------------------------|--------------------");
  for (const p of pending.slice(0, 30)) {
    console.log(
      `${p.id.padEnd(10)} | ${p.country.padEnd(7)} | ${p.university.padEnd(23)} | ${p.name}`
    );
  }
  if (pending.length > 30) {
    console.log(`... and ${pending.length - 30} more`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    listPending(loadData());
    return;
  }

  const profId = args[0];
  const dryRun = args.includes("--dry-run");

  if (!profId) {
    console.error("Usage: node send-outreach-email.mjs <professor-id> [--dry-run]");
    console.error("       node send-outreach-email.mjs --list");
    process.exit(1);
  }

  if (!GMAIL_APP_PASSWORD && !dryRun) {
    console.error("Error: GMAIL_APP_PASSWORD environment variable is required.");
    console.error("Generate one at: https://myaccount.google.com/apppasswords");
    console.error("Then run: GMAIL_APP_PASSWORD=xxxx node scripts/send-outreach-email.mjs " + profId);
    process.exit(1);
  }

  const data = loadData();
  const prof = data.professors.find((p) => p.id === profId);

  if (!prof) {
    console.error(`Professor not found: ${profId}`);
    process.exit(1);
  }

  if (prof.status === "sent") {
    console.error(`Already sent to ${prof.name} (${prof.email}). Skipping.`);
    process.exit(1);
  }

  const { subject, body } = buildEmail(prof);

  console.log("\n========== EMAIL PREVIEW ==========");
  console.log(`To:      ${prof.name} <${prof.email}>`);
  console.log(`From:    ${SENDER_NAME} <${GMAIL_USER}>`);
  console.log(`Subject: ${subject}`);
  console.log("-----------------------------------");
  console.log(body);
  console.log("===================================\n");

  if (dryRun) {
    console.log("[DRY RUN] Email not sent.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `${SENDER_NAME} <${GMAIL_USER}>`,
      to: `${prof.name} <${prof.email}>`,
      subject,
      text: body,
    });

    console.log(`Sent to ${prof.name} <${prof.email}>`);
    console.log(`Message ID: ${info.messageId}`);

    // Update status
    prof.status = "sent";
    prof.sentAt = new Date().toISOString();
    saveData(data);
    console.log(`Status updated to "sent" in professor-outreach.json`);
  } catch (err) {
    console.error("Failed to send:", err.message);
    process.exit(1);
  }
}

main();
