/**
 * Demo seed — creates today's stations / shifts / templates / submissions
 * so the Staff dashboard shows a current shift, the Supervisor dashboard
 * shows one Submitted (pending) + one Approved entry, and the Admin
 * Overview shows real KPIs.
 *
 * Idempotent: re-running won't create duplicates.
 *   node prisma/seedDemo.js
 */

const prisma = require("../src/config/prisma");

async function getOrCreateStation({ name, code, description }) {
  return prisma.station.upsert({
    where: { code },
    update: {},
    create: { name, code, description },
  });
}

async function getOrCreateShift({ stationId, name, startTime, endTime }) {
  const existing = await prisma.shift.findFirst({
    where: { stationId, name },
  });
  if (existing) return existing;
  return prisma.shift.create({
    data: { stationId, name, startTime, endTime, timezone: "Asia/Kolkata" },
  });
}

async function getOrCreateTemplate({ stationId, title, items }) {
  const existing = await prisma.checklistTemplate.findFirst({
    where: { stationId, title },
    include: { items: { orderBy: { displayOrder: "asc" } } },
  });
  if (existing) return existing;
  return prisma.checklistTemplate.create({
    data: {
      stationId,
      title,
      version: 1,
      isActive: true,
      items: {
        create: items.map((label, idx) => ({
          label: label.text,
          isMandatory: label.mandatory,
          displayOrder: idx,
          inputType: "boolean",
        })),
      },
    },
    include: { items: { orderBy: { displayOrder: "asc" } } },
  });
}

async function getOrCreateAssignment({ shiftId, userId, assignmentRole, assignmentDate }) {
  return prisma.shiftAssignment.upsert({
    where: {
      shiftId_userId_assignmentDate_assignmentRole: {
        shiftId,
        userId,
        assignmentDate,
        assignmentRole,
      },
    },
    update: {},
    create: { shiftId, userId, assignmentRole, assignmentDate },
  });
}

async function ensureSubmission({
  station,
  shift,
  template,
  staff,
  submissionDate,
  status,
  supervisor,
  staffRemark,
  supervisorComment,
}) {
  const existing = await prisma.checklistSubmission.findFirst({
    where: {
      stationId: station.id,
      shiftId: shift.id,
      staffId: staff.id,
      submissionDate,
    },
  });
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const submission = await tx.checklistSubmission.create({
      data: {
        stationId: station.id,
        shiftId: shift.id,
        templateId: template.id,
        staffId: staff.id,
        submissionDate,
        status,
        staffRemark,
        submittedAt: new Date(),
        supervisorId: status === "approved" ? supervisor?.id : null,
        supervisorComment: status === "approved" ? supervisorComment : null,
        verifiedAt: status === "approved" ? new Date() : null,
      },
    });

    await tx.checklistSubmissionItem.createMany({
      data: template.items.map((item) => ({
        submissionId: submission.id,
        templateItemId: item.id,
        completed: true,
        remark: null,
      })),
    });

    return submission;
  });
}

async function main() {
  const staff = await prisma.user.findUnique({ where: { email: "staff@example.com" } });
  const supervisor = await prisma.user.findUnique({ where: { email: "supervisor@example.com" } });

  if (!staff || !supervisor) {
    throw new Error(
      "Run the base `npm run seed` first — staff@example.com and supervisor@example.com must exist."
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Stations
  const stationA = await getOrCreateStation({
    name: "Platform A",
    code: "PLT-A",
    description: "Main passenger platform — primary cleaning zone.",
  });
  const stationB = await getOrCreateStation({
    name: "Concourse B",
    code: "CON-B",
    description: "Central concourse and waiting area.",
  });
  const stationC = await getOrCreateStation({
    name: "Service Bay C",
    code: "SVC-C",
    description: "Back-of-house maintenance bay.",
  });

  // 2. Shifts (wide window so demo is always 'active')
  const shiftA = await getOrCreateShift({
    stationId: stationA.id,
    name: "Day Shift",
    startTime: "00:01",
    endTime: "23:59",
  });
  const shiftB = await getOrCreateShift({
    stationId: stationB.id,
    name: "Day Shift",
    startTime: "00:01",
    endTime: "23:59",
  });
  const shiftC = await getOrCreateShift({
    stationId: stationC.id,
    name: "Morning Shift",
    startTime: "06:00",
    endTime: "14:00",
  });

  // 3. Templates
  const templateA = await getOrCreateTemplate({
    stationId: stationA.id,
    title: "Platform A — Daily Checklist",
    items: [
      { text: "Sweep platform floor", mandatory: true },
      { text: "Empty waste bins", mandatory: true },
      { text: "Sanitise railings & handrails", mandatory: true },
      { text: "Clean platform signage", mandatory: false },
      { text: "Refill hand sanitiser dispensers", mandatory: false },
      { text: "Inspect platform tiles for damage", mandatory: false },
    ],
  });

  const templateB = await getOrCreateTemplate({
    stationId: stationB.id,
    title: "Concourse B — Daily Checklist",
    items: [
      { text: "Mop concourse floor", mandatory: true },
      { text: "Sanitise public seating", mandatory: true },
      { text: "Clean restrooms", mandatory: true },
      { text: "Empty waste bins", mandatory: true },
      { text: "Polish entrance doors", mandatory: false },
      { text: "Wipe down ticket counters", mandatory: false },
    ],
  });

  const templateC = await getOrCreateTemplate({
    stationId: stationC.id,
    title: "Service Bay C — Morning Checklist",
    items: [
      { text: "Sweep workshop floor", mandatory: true },
      { text: "Check fire extinguisher seals", mandatory: true },
      { text: "Wipe down workbenches", mandatory: false },
      { text: "Restock cleaning supplies", mandatory: false },
    ],
  });

  // 4. Assignments — Cleaning Staff + Supervisor on every shift today
  for (const shift of [shiftA, shiftB, shiftC]) {
    await getOrCreateAssignment({
      shiftId: shift.id,
      userId: staff.id,
      assignmentRole: "staff",
      assignmentDate: today,
    });
    await getOrCreateAssignment({
      shiftId: shift.id,
      userId: supervisor.id,
      assignmentRole: "supervisor",
      assignmentDate: today,
    });
  }

  // 5. Submissions — one Submitted (pending), one Approved
  await ensureSubmission({
    station: stationB,
    shift: shiftB,
    template: templateB,
    staff,
    submissionDate: today,
    status: "submitted",
    staffRemark: "All concourse cleaning tasks completed for the morning rush.",
  });

  await ensureSubmission({
    station: stationC,
    shift: shiftC,
    template: templateC,
    staff,
    submissionDate: today,
    status: "approved",
    supervisor,
    staffRemark: "Workshop fully serviced and stocked.",
    supervisorComment: "All items verified — well done.",
  });

  // Print a short summary
  const counts = await prisma.checklistSubmission.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  // eslint-disable-next-line no-console
  console.log("\n✓ Demo data seeded");
  // eslint-disable-next-line no-console
  console.log("  Stations:", await prisma.station.count());
  // eslint-disable-next-line no-console
  console.log("  Shifts:  ", await prisma.shift.count());
  // eslint-disable-next-line no-console
  console.log("  Assignments today:", await prisma.shiftAssignment.count({ where: { assignmentDate: today } }));
  // eslint-disable-next-line no-console
  console.log("  Submissions by status:");
  counts.forEach((c) => console.log(`    ${c.status}: ${c._count._all}`));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
