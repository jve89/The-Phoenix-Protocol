import fs from "fs";
import path from "path";
import sg from "@sendgrid/mail";

const to = process.env.ADMIN_EMAIL || process.env.TEST_TO;
const file = process.argv[2];
if (!to) throw new Error("Set ADMIN_EMAIL or TEST_TO");
if (!file) throw new Error("Usage: node test/send_template.js <path-to-html>");

sg.setApiKey(process.env.SENDGRID_API_KEY);

const html = fs.readFileSync(path.resolve(file), "utf8");
sg.send({
  to,
  from: "noreply@thephoenixprotocol.app",
  subject: `Phoenix trial preview: ${path.basename(file)}`,
  html,
}).then(() => console.log("sent:", file, "->", to))
  .catch((e) => { console.error(e.response?.body || e); process.exit(1); });
