import { PrismaClient, UserRole, WardType, RoomType } from "@prisma/client"
import { hashSync } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Clearing existing data...")

  // Delete in reverse order of dependencies
  await prisma.dailyRound.deleteMany()
  await prisma.prescriptionMedicine.deleteMany()
  await prisma.prescription.deleteMany()
  await prisma.consultation.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.labReport.deleteMany()
  await prisma.labOrderTest.deleteMany()
  await prisma.labOrder.deleteMany()
  await prisma.admission.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.bed.deleteMany()
  await prisma.room.deleteMany()
  await prisma.ward.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()
  await prisma.medicine.deleteMany()
  await prisma.labTest.deleteMany()
  await prisma.service.deleteMany()

  console.log("Database cleared!")

  const passwordHash = hashSync("password", 10)

  // ─── Admin User (required for login) ────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@rsnexus.com" },
    update: {},
    create: {
      email: "admin@rsnexus.com",
      name: "Admin",
      role: UserRole.super_admin,
      passwordHash,
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // ─── Departments ───────────────────────────────────────
  const deptData = [
    { name: "Cardiology", description: "Heart and cardiovascular system" },
    { name: "Neurology", description: "Nervous system disorders" },
    { name: "Orthopedics", description: "Bones, joints, and muscles" },
    { name: "Pediatrics", description: "Children healthcare" },
    { name: "General Medicine", description: "General medical conditions" },
    { name: "Dermatology", description: "Skin conditions" },
    { name: "Ophthalmology", description: "Eye care" },
    { name: "ENT", description: "Ear, Nose, and Throat" },
    { name: "General Surgery", description: "Surgical procedures" },
    { name: "Emergency", description: "Emergency medicine" },
  ]

  const departments = []
  for (const d of deptData) {
    const dept = await prisma.department.create({ data: d })
    departments.push(dept)
  }
  console.log(`Created ${departments.length} departments`)

  // ─── Wards ─────────────────────────────────────────────
  const wardData = [
    { name: "ICU", type: WardType.icu, floor: 1 },
    { name: "General Ward", type: WardType.general, floor: 2 },
    { name: "Private Ward", type: WardType.private, floor: 3 },
  ]

  const wards = []
  for (const w of wardData) {
    const ward = await prisma.ward.create({ data: w })
    wards.push(ward)
  }
  console.log(`Created ${wards.length} wards`)

  // ─── Rooms & Beds ──────────────────────────────────────
  const roomData = [
    { wardId: wards[0].id, roomNumber: "ICU-101", type: RoomType.private, bedCount: 2, chargesPerDay: 5000, beds: ["A1", "A2"] },
    { wardId: wards[0].id, roomNumber: "ICU-102", type: RoomType.private, bedCount: 2, chargesPerDay: 5000, beds: ["B1", "B2"] },
    { wardId: wards[1].id, roomNumber: "GEN-201", type: RoomType.general, bedCount: 4, chargesPerDay: 1500, beds: ["A1", "A2", "A3", "A4"] },
    { wardId: wards[1].id, roomNumber: "GEN-202", type: RoomType.general, bedCount: 4, chargesPerDay: 1500, beds: ["B1", "B2", "B3", "B4"] },
    { wardId: wards[2].id, roomNumber: "PVT-301", type: RoomType.private, bedCount: 1, chargesPerDay: 3500, beds: ["A1"] },
    { wardId: wards[2].id, roomNumber: "PVT-302", type: RoomType.private, bedCount: 1, chargesPerDay: 3500, beds: ["B1"] },
  ]

  let bedCount = 0
  for (const r of roomData) {
    const room = await prisma.room.create({
      data: { wardId: r.wardId, roomNumber: r.roomNumber, type: r.type, bedCount: r.bedCount, chargesPerDay: r.chargesPerDay },
    })
    for (const bedNum of r.beds) {
      await prisma.bed.create({
        data: { roomId: room.id, bedNumber: bedNum, status: "available" },
      })
      bedCount++
    }
  }
  console.log(`Created ${roomData.length} rooms, ${bedCount} beds`)

  // ─── Medicines ─────────────────────────────────────────
  const medicineData = [
    { name: "Paracetamol", genericName: "Acetaminophen", category: "Analgesic", stock: 500, unit: "tablet", price: 2 },
    { name: "Amoxicillin", genericName: "Amoxicillin", category: "Antibiotic", stock: 200, unit: "capsule", price: 8 },
    { name: "Amlodipine", genericName: "Amlodipine Besylate", category: "Antihypertensive", stock: 300, unit: "tablet", price: 5 },
    { name: "Metformin", genericName: "Metformin HCl", category: "Antidiabetic", stock: 250, unit: "tablet", price: 4 },
    { name: "Omeprazole", genericName: "Omeprazole", category: "Proton Pump Inhibitor", stock: 150, unit: "capsule", price: 6 },
    { name: "Losartan", genericName: "Losartan Potassium", category: "Antihypertensive", stock: 200, unit: "tablet", price: 7 },
    { name: "Atorvastatin", genericName: "Atorvastatin Calcium", category: "Statin", stock: 180, unit: "tablet", price: 10 },
    { name: "Cetirizine", genericName: "Cetirizine HCl", category: "Antihistamine", stock: 400, unit: "tablet", price: 3 },
  ]

  for (const m of medicineData) {
    await prisma.medicine.create({ data: m })
  }
  console.log(`Created ${medicineData.length} medicines`)

  // ─── Lab Tests ─────────────────────────────────────────
  const labTestData = [
    { name: "Complete Blood Count", category: "Hematology", price: 500, description: "CBC includes RBC, WBC, platelet count" },
    { name: "Lipid Profile", category: "Biochemistry", price: 800, description: "Cholesterol, triglycerides, HDL, LDL" },
    { name: "Thyroid Function Test", category: "Biochemistry", price: 1200, description: "T3, T4, TSH levels" },
    { name: "X-Ray Chest", category: "Radiology", price: 1500, description: "Chest X-ray PA view" },
    { name: "ECG", category: "Cardiology", price: 600, description: "Electrocardiogram" },
    { name: "Urine Routine", category: "Pathology", price: 300, description: "Urine analysis" },
    { name: "Blood Sugar Fasting", category: "Biochemistry", price: 200, description: "Fasting blood glucose" },
    { name: "Blood Sugar PP", category: "Biochemistry", price: 200, description: "Post-prandial blood glucose" },
    { name: "HbA1c", category: "Biochemistry", price: 500, description: "Glycated hemoglobin" },
    { name: "Liver Function Test", category: "Biochemistry", price: 1000, description: "SGOT, SGPT, bilirubin, albumin" },
  ]

  for (const t of labTestData) {
    await prisma.labTest.create({ data: t })
  }
  console.log(`Created ${labTestData.length} lab tests`)

  // ─── Services ──────────────────────────────────────────
  const serviceData = [
    { name: "Consultation Fee", category: "OPD", price: 500, description: "Doctor consultation charges" },
    { name: "ECG", category: "Diagnostic", price: 600 },
    { name: "X-Ray", category: "Diagnostic", price: 1500 },
    { name: "Ultrasound", category: "Diagnostic", price: 2000 },
    { name: "Injection", category: "Procedure", price: 100 },
    { name: "IV Fluid", category: "Procedure", price: 200 },
    { name: "Minor Surgery", category: "Surgery", price: 5000 },
    { name: "Major Surgery", category: "Surgery", price: 25000 },
  ]

  for (const s of serviceData) {
    await prisma.service.create({ data: s })
  }
  console.log(`Created ${serviceData.length} services`)

  console.log("\nSeeding completed!")
  console.log("Login with: admin@rsnexus.com / <password from .env>")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
