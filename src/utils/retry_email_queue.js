// src/utils/retry_email_queue.js

const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./email');

const queuePath = path.join(__dirname, '../../logs/email_retry_failures.json');

function loadQueue() {
  try {
    const data = fs.readFileSync(queuePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[RETRY] Failed to load retry queue:', err.message);
    return [];
  }
}

function saveQueue(queue) {
  try {
    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
  } catch (err) {
    console.error('[RETRY] Failed to save retry queue:', err.message);
  }
}

function logFailure(email, subject, html) {
  const queue = loadQueue();

  // Avoid duplicates
  const alreadyQueued = queue.find(
    item => item.email === email && item.subject === subject
  );
  if (alreadyQueued) {
    console.warn(`[RETRY] Duplicate email not re-added to queue: ${email}`);
    return;
  }

  queue.push({ email, subject, html });
  saveQueue(queue);
  console.log(`[RETRY] Email failure logged for retry: ${email}`);
}

async function retryAllPendingEmails() {
  const queue = loadQueue();
  if (!queue.length) {
    console.log('[RETRY] No pending emails in retry queue.');
    return;
  }

  const remaining = [];

  for (const entry of queue) {
    try {
      await sendEmail(entry.email, entry.subject, entry.html);
      console.log(`[RETRY] ✅ Email successfully re-sent to ${entry.email}`);
    } catch (err) {
      console.error(`[RETRY] ❌ Failed to resend to ${entry.email}:`, err.message);
      remaining.push(entry); // requeue
    }
  }

  saveQueue(remaining);
  console.log(`[RETRY] Retry cycle complete. Remaining in queue: ${remaining.length}`);
}

module.exports = { logFailure, retryAllPendingEmails };
