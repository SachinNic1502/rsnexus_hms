# Pravah MediCloud HMS

## Daily Operational Flow (Hospital Management System)

### Version

1.0

---

# 1. Hospital Opening

## Step 1 – Super Admin / Hospital Admin

* Login to the system
* View Dashboard
* Check today's appointments
* Check admitted patients
* Check available beds
* Review pending bills
* Review doctor availability

---

# 2. Reception Workflow

### Patient Registration

#### New Patient

* Click **New Patient**
* Enter patient details
* Mobile Number
* Name
* Gender
* Date of Birth / Age
* Address
* Blood Group
* Emergency Contact

System generates:

* Patient ID (UHID)
* Patient Card

#### Existing Patient

* Search by:

  * UHID
  * Mobile Number
  * Patient Name

Open existing profile.

---

# 3. Appointment Booking

Reception books an appointment.

Select:

* Department
* Doctor
* Date
* Time
* Consultation Type (New / Follow-up)

System generates:

* Appointment Number
* Token Number

Status:

* Scheduled

---

# 4. Patient Check-In

When patient arrives:

Reception clicks:

**Check In**

Status changes:

Waiting

↓

Doctor Queue

Doctor receives notification.

---

# 5. Doctor Consultation

Doctor opens today's patient list.

Doctor can view:

* Previous Visits
* Medical History
* Allergies
* Current Medicines
* Lab Reports

Doctor records:

* Chief Complaint
* Symptoms
* Diagnosis
* Vitals
* Clinical Notes

Doctor decides:

### Option A

Prescription Only

OR

### Option B

Lab Test Required

OR

### Option C

Need Admission (IPD)

---

# 6. Prescription

Doctor adds:

Medicine

Dose

Frequency

Duration

Instructions

Prescription is saved and printable.

---

# 7. Lab Request (Optional)

Doctor orders:

* Blood Test
* Urine Test
* X-Ray
* CT Scan
* MRI

Patient visits laboratory.

Lab uploads report.

Doctor reviews results.

---

# 8. Billing (OPD)

Reception generates bill.

Includes:

* Registration Fee
* Consultation Fee
* Lab Charges
* Other Charges

Receive payment.

Generate Invoice.

Print Receipt.

Status:

Paid

---

# 9. OPD Visit Completed

Status:

Completed

Patient may book follow-up if required.

---

# 10. IPD Admission Workflow

If admission is required:

Doctor clicks:

Admit Patient

Reception receives admission request.

Reception:

* Select Ward
* Select Room
* Assign Bed
* Assign Admission Number

Status:

Admitted

---

# 11. During IPD Stay

Daily activities:

Doctor:

* Daily Rounds
* Progress Notes
* Prescription Updates
* Treatment Plan

Nurse:

* Record Vitals
* Administer Medicines
* Update Nursing Notes

Reception:

* Add Service Charges
* Update Room Charges

---

# 12. Additional Services During IPD

Patient may receive:

* Laboratory Tests
* Radiology
* Pharmacy Medicines
* Operation Theatre Services
* ICU Care
* Physiotherapy

All charges are automatically added to the patient's bill.

---

# 13. Discharge Process

Doctor prepares:

* Discharge Summary
* Final Diagnosis
* Discharge Medicines
* Follow-up Date

Reception reviews pending charges.

Final bill is generated.

Patient completes payment.

Status:

Discharged

Bed status changes to:

Available

---

# 14. End of Day

Hospital Admin reviews:

* Total OPD Patients
* Total IPD Admissions
* Total Discharges
* Revenue Collected
* Pending Payments
* Bed Occupancy
* Doctor Performance

Generate daily reports.

Backup database.

Logout.

---

# Main Navigation Menu

### Dashboard

### Patients

* New Patient
* Patient List
* Medical Records

### Appointments

* Book Appointment
* Calendar
* Doctor Schedule

### OPD

* Today's Patients
* Consultation
* Follow-up

### IPD

* Admissions
* Bed Management
* Ward Management
* Discharge

### Billing

* Generate Invoice
* Payments
* Receipts

### Doctors

* Doctor List
* Schedule

### Reports

* Daily Report
* Monthly Report
* Revenue Report

### Settings

* Users
* Roles
* Departments
* Hospital Information

---

# Daily Workflow Summary

Hospital Opens

↓

Reception Registers Patient

↓

Appointment Booked

↓

Patient Check-In

↓

Doctor Consultation

↓

Prescription / Lab Test / Admission Decision

↓

Billing

↓

Patient Leaves (OPD)

OR

↓

IPD Admission

↓

Treatment

↓

Discharge

↓

Final Billing

↓

Daily Reports

↓

Hospital Closes
