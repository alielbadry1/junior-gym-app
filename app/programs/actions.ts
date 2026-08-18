"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { excelBufferToRows, readCell, type ImportState } from "@/lib/excel";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type TrainerAssignmentInput = { trainerId: string; commission: number };

function parseTrainerAssignments(formData: FormData): TrainerAssignmentInput[] {
  const trainerIds = formData.getAll("trainer_party_id").map(String);
  const commissions = formData.getAll("commission_percent").map(String);

  const rows: TrainerAssignmentInput[] = [];
  trainerIds.forEach((trainerId, i) => {
    const commission = Number(commissions[i]);
    if (trainerId && !Number.isNaN(commission) && commission > 0) {
      rows.push({ trainerId, commission });
    }
  });
  return rows;
}

function buildProgramName(
  activityName: string,
  sessionCount: number | null,
  durationType: string | null,
  mainTrainerName: string | null
) {
  const middle = sessionCount ? `${sessionCount}سيشن` : durationType || "يومي";
  const parts = [activityName, middle];
  if (mainTrainerName) parts.push(mainTrainerName);
  return parts.join(" / ");
}

function readProgramFields(formData: FormData) {
  const activity_id = String(formData.get("activity_id") ?? "").trim();
  const cost_center_id =
    String(formData.get("cost_center_id") ?? "").trim() || null;
  const duration_type =
    String(formData.get("duration_type") ?? "").trim() || null;
  const sessionCountRaw = String(formData.get("session_count") ?? "").trim();
  const session_count = sessionCountRaw ? Number(sessionCountRaw) : null;
  const session_days = formData.getAll("session_days").map(String);
  const session_time =
    String(formData.get("session_time") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = Number(priceRaw);
  const active = formData.get("active") === "on";

  if (!activity_id) {
    throw new Error("لازم تختار النشاط");
  }
  if (!priceRaw || Number.isNaN(price) || price <= 0) {
    throw new Error("قيمة البرنامج مطلوبة ولازم تكون أكبر من صفر");
  }

  return {
    activity_id,
    cost_center_id,
    duration_type,
    session_count,
    session_days: session_days.length > 0 ? session_days : null,
    session_time,
    location,
    price,
    active,
  };
}

async function resolveProgramName(
  supabase: SupabaseClient,
  activityId: string,
  sessionCount: number | null,
  durationType: string | null,
  assignments: TrainerAssignmentInput[]
) {
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("name")
    .eq("id", activityId)
    .single();

  if (activityError || !activity) {
    throw new Error("النشاط المختار غير موجود");
  }

  let mainTrainerName: string | null = null;
  if (assignments.length > 0) {
    const { data: trainerParty } = await supabase
      .from("parties")
      .select("full_name")
      .eq("id", assignments[0].trainerId)
      .single();
    mainTrainerName = trainerParty?.full_name ?? null;
  }

  return buildProgramName(activity.name, sessionCount, durationType, mainTrainerName);
}

export async function createProgram(formData: FormData) {
  const supabase = await createClient();
  const fields = readProgramFields(formData);
  const assignments = parseTrainerAssignments(formData);

  const name = await resolveProgramName(
    supabase,
    fields.activity_id,
    fields.session_count,
    fields.duration_type,
    assignments
  );
  const price_per_session = fields.session_count
    ? Number((fields.price / fields.session_count).toFixed(2))
    : null;

  const { data: program, error: programError } = await supabase
    .from("programs")
    .insert({ ...fields, name, price_per_session })
    .select("id")
    .single();

  if (programError || !program) {
    throw new Error(programError?.message ?? "فشل إنشاء البرنامج");
  }

  if (assignments.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const { error: assignError } = await supabase
      .from("program_trainer_assignments")
      .insert(
        assignments.map((a) => ({
          program_id: program.id,
          trainer_party_id: a.trainerId,
          commission_percent: a.commission,
          starts_at: today,
        }))
      );
    if (assignError) {
      throw new Error(assignError.message);
    }
  }

  revalidatePath("/programs");
  redirect("/programs");
}

export async function updateProgram(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = readProgramFields(formData);
  const assignments = parseTrainerAssignments(formData);

  const name = await resolveProgramName(
    supabase,
    fields.activity_id,
    fields.session_count,
    fields.duration_type,
    assignments
  );
  const price_per_session = fields.session_count
    ? Number((fields.price / fields.session_count).toFixed(2))
    : null;

  const { error: programError } = await supabase
    .from("programs")
    .update({ ...fields, name, price_per_session })
    .eq("id", id);

  if (programError) {
    throw new Error(programError.message);
  }

  await syncTrainerAssignments(supabase, id, assignments);

  revalidatePath("/programs");
  redirect("/programs");
}

async function syncTrainerAssignments(
  supabase: SupabaseClient,
  programId: string,
  assignments: TrainerAssignmentInput[]
) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: current, error } = await supabase
    .from("program_trainer_assignments")
    .select("id, trainer_party_id, commission_percent")
    .eq("program_id", programId)
    .is("ends_at", null);

  if (error) {
    throw new Error(error.message);
  }

  const currentRows = current ?? [];
  const submittedByTrainer = new Map(
    assignments.map((a) => [a.trainerId, a.commission])
  );
  const currentTrainerIds = new Set(
    currentRows.map((r) => r.trainer_party_id as string)
  );

  const idsToClose: string[] = [];
  const rowsToInsert: { trainer_party_id: string; commission_percent: number }[] =
    [];

  for (const row of currentRows) {
    const trainerId = row.trainer_party_id as string;
    const submittedCommission = submittedByTrainer.get(trainerId);
    if (submittedCommission === undefined) {
      idsToClose.push(row.id);
    } else if (Number(submittedCommission) !== Number(row.commission_percent)) {
      idsToClose.push(row.id);
      rowsToInsert.push({
        trainer_party_id: trainerId,
        commission_percent: submittedCommission,
      });
    }
  }

  for (const a of assignments) {
    if (!currentTrainerIds.has(a.trainerId)) {
      rowsToInsert.push({
        trainer_party_id: a.trainerId,
        commission_percent: a.commission,
      });
    }
  }

  if (idsToClose.length > 0) {
    const { error: closeError } = await supabase
      .from("program_trainer_assignments")
      .update({ ends_at: today })
      .in("id", idsToClose);
    if (closeError) {
      throw new Error(closeError.message);
    }
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("program_trainer_assignments")
      .insert(
        rowsToInsert.map((r) => ({
          program_id: programId,
          trainer_party_id: r.trainer_party_id,
          commission_percent: r.commission_percent,
          starts_at: today,
        }))
      );
    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

async function findOrCreateDepartment(supabase: SupabaseClient, name: string) {
  const { data: existing } = await supabase
    .from("departments")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("departments")
    .insert({ name })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "فشل إنشاء القسم");
  return created.id as string;
}

async function findOrCreateActivity(
  supabase: SupabaseClient,
  name: string,
  departmentId: string
) {
  const { data: existing } = await supabase
    .from("activities")
    .select("id")
    .eq("name", name)
    .eq("department_id", departmentId)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("activities")
    .insert({ name, department_id: departmentId })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "فشل إنشاء النشاط");
  return created.id as string;
}

async function findOrCreateTrainer(supabase: SupabaseClient, name: string) {
  const { data: existingRole } = await supabase
    .from("party_roles")
    .select("party_id, parties!inner(full_name)")
    .eq("role", "trainer")
    .eq("parties.full_name", name)
    .maybeSingle();
  if (existingRole) return existingRole.party_id as string;

  const { data: party, error: partyError } = await supabase
    .from("parties")
    .insert({ full_name: name })
    .select("id")
    .single();
  if (partyError || !party) {
    throw new Error(partyError?.message ?? `فشل إنشاء المدرب: ${name}`);
  }

  const { error: roleError } = await supabase.from("party_roles").insert({
    party_id: party.id,
    role: "trainer",
    status: "active",
    started_at: new Date().toISOString().slice(0, 10),
  });
  if (roleError) throw new Error(roleError.message);

  return party.id as string;
}

export async function importPrograms(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { status: "done", successCount: 0, errorCount: 1, errors: ["لازم تختار ملف إكسيل"] };
  }

  const rows = await excelBufferToRows(await file.arrayBuffer());
  const supabase = await createClient();

  const { data: costCenters } = await supabase.from("cost_centers").select("id, name");
  const costCenterIdByName = new Map((costCenters ?? []).map((c) => [c.name, c.id]));

  let successCount = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    try {
      const departmentName = readCell(row, "القسم الرئيسي", "department");
      const activityName = readCell(row, "النشاط", "activity");
      const priceRaw = readCell(row, "السعر", "price");
      const price = Number(priceRaw);

      if (!departmentName || !activityName) {
        errors.push(`صف ${rowNum}: القسم الرئيسي والنشاط مطلوبين`);
        continue;
      }
      if (!priceRaw || Number.isNaN(price) || price <= 0) {
        errors.push(`صف ${rowNum}: السعر مطلوب`);
        continue;
      }

      const departmentId = await findOrCreateDepartment(supabase, departmentName);
      const activityId = await findOrCreateActivity(supabase, activityName, departmentId);

      const sessionCountRaw = readCell(row, "عدد السيشن", "session_count");
      const session_count = sessionCountRaw ? Number(sessionCountRaw) : null;
      const duration_type = readCell(row, "نوع المدة", "duration_type") || null;
      const location = readCell(row, "الموقع", "location") || null;
      const costCenterName = readCell(row, "مركز التكلفة", "cost_center");
      const cost_center_id = costCenterName ? costCenterIdByName.get(costCenterName) ?? null : null;
      const sessionDaysRaw = readCell(row, "أيام التدريب", "session_days");
      const session_days = sessionDaysRaw
        ? sessionDaysRaw.split(/[،,]/).map((d) => d.trim()).filter(Boolean)
        : null;
      const session_time = readCell(row, "وقت التدريب", "session_time") || null;
      const providedName = readCell(row, "البرنامج", "name");

      const assignments: { trainerId: string; commission: number }[] = [];
      for (let n = 1; n <= 4; n++) {
        const trainerName = readCell(row, `المدرب ${n}`);
        const commissionRaw = readCell(row, `نسبة ${n}`);
        if (trainerName && commissionRaw) {
          const commission = Number(commissionRaw);
          if (!Number.isNaN(commission) && commission > 0) {
            const trainerId = await findOrCreateTrainer(supabase, trainerName);
            assignments.push({ trainerId, commission });
          }
        }
      }

      const name =
        providedName ||
        buildProgramName(
          activityName,
          session_count,
          duration_type,
          assignments.length > 0 ? readCell(row, "المدرب 1") : null
        );
      const price_per_session = session_count
        ? Number((price / session_count).toFixed(2))
        : null;

      const { data: program, error: programError } = await supabase
        .from("programs")
        .insert({
          activity_id: activityId,
          cost_center_id,
          name,
          session_count,
          duration_type,
          session_days,
          session_time,
          location,
          price,
          price_per_session,
          active: true,
        })
        .select("id")
        .single();

      if (programError || !program) {
        errors.push(`صف ${rowNum}: ${programError?.message ?? "فشل إنشاء البرنامج"}`);
        continue;
      }

      if (assignments.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const { error: assignError } = await supabase
          .from("program_trainer_assignments")
          .insert(
            assignments.map((a) => ({
              program_id: program.id,
              trainer_party_id: a.trainerId,
              commission_percent: a.commission,
              starts_at: today,
            }))
          );
        if (assignError) {
          errors.push(`صف ${rowNum}: البرنامج اتعمل لكن فشل تكليف المدربين: ${assignError.message}`);
        }
      }

      successCount++;
    } catch (err) {
      errors.push(`صف ${rowNum}: ${err instanceof Error ? err.message : "خطأ غير معروف"}`);
    }
  }

  revalidatePath("/programs");
  return { status: "done", successCount, errorCount: errors.length, errors };
}
