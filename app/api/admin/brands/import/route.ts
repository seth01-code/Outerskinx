import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Brand from "../../../../models/Brand";
import { getSession } from "../../../../lib/auth";
import * as XLSX from "xlsx";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Sheet is empty" }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const row of rows) {
      const name = (row["name"] || "").trim();

      if (!name) {
        results.skipped++;
        results.errors.push("Row skipped — name is required");
        continue;
      }

      const slug = slugify(name);

      const payload = {
        name,
        slug,
        country: (row["country"] || "").trim() || undefined,
        description: (row["description"] || "").trim() || undefined,
        logo: (row["logo"] || "").trim() || undefined,
        isActive: String(row["is_active"]).trim() === "1",
      };

      const existing = await Brand.findOne({ slug });
      if (existing) {
        await Brand.findByIdAndUpdate(existing._id, { $set: payload });
        results.updated++;
      } else {
        await Brand.create(payload);
        results.created++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Brand import error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
