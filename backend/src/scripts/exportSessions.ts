import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

type ExportRecord = {
  id: string;
  userId: string | null;
  label: string;
  content: string;
  wordCount: number;
  timingSummary: {
    totalKeystrokes: number;
    avgHoldMs: number | null;
    avgGapMs: number | null;
  };
  pasteSummary: {
    totalEvents: number;
    totalChars: number;
  };
  revisionCount: number;
  saveHistory: string[];
  createdAt: string;
  updatedAt: string;
};

type Options = {
  out: string;
  format: "jsonl" | "csv";
  limit: number;
  label: string | null;
  labelField: string;
};

const parseArgs = (args: string[]) => {
  const options: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (!next || next.startsWith("--")) {
        options[key] = true;
      } else {
        options[key] = next;
        i += 1;
      }
    }
  }
  return options;
};

const printHelp = () => {
  console.log("Usage: tsx src/scripts/exportSessions.ts [options]");
  console.log("Options:");
  console.log("  --out <path>         Output file path (default: exports/sessions.jsonl)");
  console.log("  --format <jsonl|csv>  Output format (default: jsonl)");
  console.log("  --limit <number>      Limit number of sessions exported");
  console.log("  --label <value>       Override label for all rows");
  console.log("  --labelField <name>   Field name in MongoDB to read label (default: label)");
};

const normalizeFormat = (value: string) => {
  const lower = value.toLowerCase();
  if (lower === "csv") {
    return "csv";
  }
  return "jsonl";
};

const buildOptions = (raw: Record<string, string | boolean>): Options => {
  const out = typeof raw.out === "string" ? raw.out : "exports/sessions.jsonl";
  const format = normalizeFormat(typeof raw.format === "string" ? raw.format : "jsonl");
  const limit = typeof raw.limit === "string" ? Number.parseInt(raw.limit, 10) : 0;
  const label = typeof raw.label === "string" ? raw.label : null;
  const labelField = typeof raw.labelField === "string" ? raw.labelField : "label";

  return {
    out,
    format,
    limit: Number.isFinite(limit) ? Math.max(0, limit) : 0,
    label,
    labelField
  };
};

const escapeCsv = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const toHex = (value: unknown) => {
  if (value instanceof ObjectId) {
    return value.toHexString();
  }
  return typeof value === "string" ? value : null;
};

const buildExportRecord = (
  doc: Record<string, unknown>,
  labelOverride: string | null,
  labelField: string
): ExportRecord => {
  const labelValue = labelOverride ?? (doc[labelField] as string | undefined) ?? "unknown";
  const timing = (doc.timingSummary as Record<string, unknown>) ?? {};
  const paste = (doc.pasteSummary as Record<string, unknown>) ?? {};
  const saveHistory = Array.isArray(doc.saveHistory)
    ? (doc.saveHistory as string[])
    : [];

  return {
    id: toHex(doc._id) ?? "",
    userId: toHex(doc.userId),
    label: labelValue,
    content: (doc.content as string) ?? "",
    wordCount: Number(doc.wordCount ?? 0),
    timingSummary: {
      totalKeystrokes: Number(timing.totalKeystrokes ?? 0),
      avgHoldMs: timing.avgHoldMs === null ? null : Number(timing.avgHoldMs ?? 0),
      avgGapMs: timing.avgGapMs === null ? null : Number(timing.avgGapMs ?? 0)
    },
    pasteSummary: {
      totalEvents: Number(paste.totalEvents ?? 0),
      totalChars: Number(paste.totalChars ?? 0)
    },
    revisionCount: Number(doc.revisionCount ?? 1),
    saveHistory,
    createdAt: (doc.createdAt as string) ?? "",
    updatedAt: (doc.updatedAt as string) ?? ""
  };
};

const writeJsonl = (filePath: string, records: ExportRecord[]) => {
  const lines = records.map((record) => JSON.stringify(record));
  const output = lines.length ? `${lines.join("\n")}\n` : "";
  fs.writeFileSync(filePath, output, "utf8");
};

const writeCsv = (filePath: string, records: ExportRecord[]) => {
  const header = [
    "id",
    "user_id",
    "label",
    "content",
    "word_count",
    "timing_total_keystrokes",
    "timing_avg_hold_ms",
    "timing_avg_gap_ms",
    "paste_total_events",
    "paste_total_chars",
    "revision_count",
    "save_history_count",
    "save_history",
    "created_at",
    "updated_at"
  ];

  const rows = records.map((record) => [
    record.id,
    record.userId ?? "",
    record.label,
    record.content,
    record.wordCount,
    record.timingSummary.totalKeystrokes,
    record.timingSummary.avgHoldMs ?? "",
    record.timingSummary.avgGapMs ?? "",
    record.pasteSummary.totalEvents,
    record.pasteSummary.totalChars,
    record.revisionCount,
    record.saveHistory.length,
    JSON.stringify(record.saveHistory),
    record.createdAt,
    record.updatedAt
  ]);

  const lines = [header.join(",")]
    .concat(rows.map((row) => row.map(escapeCsv).join(",")))
    .join("\n");

  fs.writeFileSync(filePath, `${lines}\n`, "utf8");
};

const run = async () => {
  const rawArgs = parseArgs(process.argv.slice(2));
  if (rawArgs.help) {
    printHelp();
    process.exit(0);
  }

  const options = buildOptions(rawArgs);
  const mongoUri = process.env.MONGO_URI ?? "mongodb://localhost:27017/vi-notes";
  const client = new MongoClient(mongoUri);

  await client.connect();
  const db = client.db();
  const collection = db.collection("writingSessions");

  const cursor = collection.find({}, { sort: { updatedAt: -1 } });
  if (options.limit > 0) {
    cursor.limit(options.limit);
  }

  const docs = await cursor.toArray();
  const records = docs.map((doc) => buildExportRecord(doc, options.label, options.labelField));

  const outputPath = path.resolve(options.out);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  if (options.format === "csv") {
    writeCsv(outputPath, records);
  } else {
    writeJsonl(outputPath, records);
  }

  await client.close();

  console.log(`Exported ${records.length} sessions to ${outputPath}`);
};

run().catch((error) => {
  console.error("Failed to export sessions", error);
  process.exit(1);
});
