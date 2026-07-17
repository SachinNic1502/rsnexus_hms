"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  MapPin,
  Droplet,
  Loader2,
  Calendar,
  Clock,
  Stethoscope,
  Search,
  AlertCircle,
  Activity,
  Thermometer,
  Heart,
  Weight,
  Ruler,
} from "lucide-react";
import Link from "next/link";
import { patientSchema, appointmentSchema } from "@/lib/validations";
import { useToast } from "@/components/ui/toast";

async function safeFetchJson(url: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

interface PatientResult {
  id: string;
  uhid: string;
  name: string;
  mobile: string;
  gender?: string;
  age?: number | null;
}

function PatientRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  // Doctor to re-apply once the department's doctor list has loaded. Setting a
  // department resets the selected doctor, so when prefilling a returning
  // patient's last-visit doctor we stash it here and apply it after the list
  // arrives.
  const pendingDoctorIdRef = useRef<string | null>(null);
  // Consultation Type drives the form: "new" shows the new-patient form,
  // "follow_up" shows the existing-patient search. When a returning ("old")
  // patient is selected their saved record — demographics plus their last
  // visit's vitals, doctor and billing — is loaded from the database and shown
  // prefilled, so their details do not have to be re-entered.

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Existing-patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(
    null,
  );
  const [searchingPatients, setSearchingPatients] = useState(false);

  // Saved record for the selected (returning) patient, loaded from the
  // database so their existing details can be shown prefilled rather than
  // re-entered.
  const [existingDetails, setExistingDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New-patient registration fields (only used when no existing patient is selected)
  const [newPatient, setNewPatient] = useState({
    name: "",
    mobile: "",
    gender: "",
    dateOfBirth: "",
    age: "",
    address: "",
    bloodGroup: "",
    emergencyContact: "",
    emergencyContactNumber: "",
  });

  // Vitals
  const [vitals, setVitals] = useState({
    bloodPressure: "",
    oxygenSaturation: "",
    height: "",
    weight: "",
    temperature: "",
    pulse: "",
  });

  // Appointment / visit fields
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [visit, setVisit] = useState({
    departmentId: "",
    doctorId: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    consultationType: "new",
  });

  useEffect(() => {
    safeFetchJson("/api/departments").then(setDepartments);
  }, []);

  useEffect(() => {
    if (visit.departmentId) {
      safeFetchJson(`/api/doctors?departmentId=${visit.departmentId}`).then(
        setDoctors,
      );
      setVisit((prev) => ({ ...prev, doctorId: "" }));
    } else {
      setDoctors([]);
    }
  }, [visit.departmentId]);

  // Prefill from ?patientId=&uhid=&name= (e.g. "New Visit" link from Patient Detail page)
  useEffect(() => {
    const pid = searchParams.get("patientId");
    const uhid = searchParams.get("uhid");
    const name = searchParams.get("name");
    if (pid && uhid) {
      setSelectedPatient({ id: pid, uhid, name: name || "", mobile: "" });
      setPatientSearch(uhid);
      // A patient arriving prefilled is a returning patient — show the
      // follow-up / existing-patient view rather than the new-patient form.
      setVisit((prev) => ({ ...prev, consultationType: "follow_up" }));
    }
  }, [searchParams]);

  const selectedPatientId = selectedPatient?.id ?? null;
  const isScheduleFlow = Boolean(
    searchParams.get("patientId") && searchParams.get("uhid"),
  );

  useEffect(() => {
    if (patientSearch.length < 2 || selectedPatientId) {
      setPatientResults([]);
      return;
    }
    setSearchingPatients(true);
    const timeout = setTimeout(async () => {
      try {
        const [uhidResults, mobileResults, nameResults] = await Promise.all([
          safeFetchJson(
            `/api/patients?search=${patientSearch}&searchType=uhid`,
          ),
          safeFetchJson(
            `/api/patients?search=${patientSearch}&searchType=mobile`,
          ),
          safeFetchJson(
            `/api/patients?search=${patientSearch}&searchType=name`,
          ),
        ]);
        const merged: PatientResult[] = [
          ...uhidResults,
        ] as unknown as PatientResult[];
        [...mobileResults, ...nameResults].forEach((p: any) => {
          if (!merged.find((m) => m.id === p.id)) merged.push(p);
        });
        setPatientResults(merged.slice(0, 10));
      } catch {
        setPatientResults([]);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch, selectedPatientId]);

  // Load the full saved record for a returning patient so their existing
  // details can be shown prefilled from the database.
  useEffect(() => {
    if (!selectedPatientId) {
      setExistingDetails(null);
      return;
    }
    let cancelled = false;
    setLoadingDetails(true);
    fetch(`/api/patients/${selectedPatientId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setExistingDetails(data);
      })
      .catch(() => {
        if (!cancelled) setExistingDetails(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetails(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPatientId]);

  // Prefill vitals and the department/doctor from the returning patient's most
  // recent visit so the nurse does not have to re-enter them. Values remain
  // fully editable. Runs when the saved record finishes loading.
  useEffect(() => {
    if (!existingDetails) return;
    const lastConsultation = existingDetails.consultations?.[0];
    if (lastConsultation) {
      setVitals({
        bloodPressure: lastConsultation.bloodPressure ?? "",
        oxygenSaturation:
          lastConsultation.oxygenSaturation != null
            ? String(lastConsultation.oxygenSaturation)
            : "",
        height:
          lastConsultation.height != null
            ? String(lastConsultation.height)
            : "",
        weight:
          lastConsultation.weight != null
            ? String(lastConsultation.weight)
            : "",
        temperature:
          lastConsultation.temperature != null
            ? String(lastConsultation.temperature)
            : "",
        pulse:
          lastConsultation.pulse != null ? String(lastConsultation.pulse) : "",
      });
    }
    const lastAppointment = existingDetails.appointments?.[0];
    if (lastAppointment?.departmentId) {
      // Stash the last doctor; the department-change effect clears the doctor
      // selection and reloads the list, after which we re-apply it below.
      pendingDoctorIdRef.current = lastAppointment.doctorId ?? null;
      setVisit((prev) => ({
        ...prev,
        departmentId: lastAppointment.departmentId,
      }));
    }
  }, [existingDetails]);

  // Re-apply the stashed last-visit doctor once its department's doctor list
  // has finished loading.
  useEffect(() => {
    const pending = pendingDoctorIdRef.current;
    if (pending && doctors.some((d: any) => d.id === pending)) {
      setVisit((prev) => ({ ...prev, doctorId: pending }));
      pendingDoctorIdRef.current = null;
    }
  }, [doctors]);

  const selectPatient = (p: PatientResult) => {
    setSelectedPatient(p);
    setPatientSearch(p.uhid);
    setPatientResults([]);
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setPatientSearch("");
    setPatientResults([]);
  };

  // Switching between New and Follow-up resets any in-progress selection and
  // prefilled fields so each mode starts clean: "new" shows the new-patient
  // form, "follow_up" shows the existing-patient search.
  const handleConsultationTypeChange = (value: string) => {
    if (value === visit.consultationType) return;
    pendingDoctorIdRef.current = null;
    clearPatient();
    setNewPatient({
      name: "",
      mobile: "",
      gender: "",
      dateOfBirth: "",
      age: "",
      address: "",
      bloodGroup: "",
      emergencyContact: "",
      emergencyContactNumber: "",
    });
    setVitals({
      bloodPressure: "",
      oxygenSaturation: "",
      height: "",
      weight: "",
      temperature: "",
      pulse: "",
    });
    setVisit((prev) => ({
      ...prev,
      consultationType: value,
      departmentId: "",
      doctorId: "",
      time: "",
    }));
  };

  const watchDob = newPatient.dateOfBirth;
  useEffect(() => {
    if (watchDob) {
      const dob = new Date(watchDob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age >= 0 && age <= 150)
        setNewPatient((prev) => ({ ...prev, age: String(age) }));
    }
  }, [watchDob]);

  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
  ];

  const isVisitValid =
    visit.departmentId && visit.doctorId && visit.date && visit.time;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (visit.consultationType === "follow_up" && !selectedPatient) {
      const msg = "Please search and select the returning patient first";
      setError(msg);
      toast(msg, "error");
      return;
    }

    if (!selectedPatient) {
      const parsed = patientSchema.safeParse(newPatient);
      if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join(". ");
        setError(msg);
        toast(msg, "error");
        return;
      }
    }

    const appointmentCheck = appointmentSchema.safeParse({
      patientId: selectedPatient?.id || "pending",
      doctorId: visit.doctorId,
      departmentId: visit.departmentId,
      date: visit.date,
      time: visit.time,
      consultationType: visit.consultationType,
    });
    if (!appointmentCheck.success) {
      const msg = appointmentCheck.error.issues
        .map((i) => i.message)
        .join(". ");
      setError(msg);
      toast(msg, "error");
      return;
    }

    setLoading(true);
    try {
      let patientId = selectedPatient?.id;
      let patientUhid = selectedPatient?.uhid;

      if (!patientId) {
        const res = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newPatient,
            bloodGroup: newPatient.bloodGroup || null,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Failed to register patient");
        }
        const patient = await res.json();
        patientId = patient.id;
        patientUhid = patient.uhid;
      }

      const aptRes = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, ...visit }),
      });
      if (!aptRes.ok) {
        const d = await aptRes.json();
        throw new Error(d.error || "Failed to book appointment");
      }
      const appointment = await aptRes.json();

      const hasVitals = Object.values(vitals).some((v) => v !== "");
      if (hasVitals) {
        try {
          const vitalsRes = await fetch("/api/consultations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointmentId: appointment.id,
              patientId,
              doctorId: visit.doctorId,
              ...vitals,
            }),
          });
          if (!vitalsRes.ok) {
            const d = await vitalsRes.json().catch(() => ({}));
            toast(
              d.error || "Visit booked, but vitals could not be saved",
              "error",
            );
          }
        } catch {
          toast("Visit booked, but vitals could not be saved", "error");
        }
      }

      toast(
        `Visit created for ${patientUhid} — Token #${appointment.tokenNumber}`,
        "success",
      );
      router.push(`/patients/${patientId}`);
    } catch (err: any) {
      setError(err.message);
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/patients">
          <Button variant="ghost" className="mb-2 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isScheduleFlow
            ? "Schedule Visit"
            : "Patient Registration / Appointment"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isScheduleFlow
            ? "Select a department, doctor, and time slot to schedule the visit for this patient."
            : "Search an existing patient or register a new one, capture vitals, and book the visit"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Consultation Type — placed first because it decides the rest of the
            form: "New" registers a new patient, "Follow-up" searches for an
            existing (returning) patient and reuses their saved record. */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Consultation Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {[
                { value: "new", label: "New", desc: "First visit — register patient" },
                {
                  value: "follow_up",
                  label: "Follow-up",
                  desc: "Returning patient — search record",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleConsultationTypeChange(opt.value)}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${visit.consultationType === opt.value ? "bg-blue-50 border-blue-300 ring-1 ring-blue-200" : "bg-white border-gray-200 hover:border-gray-300"}`}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Search / Selection — only in Follow-up mode: search for an
            existing (returning) patient to reuse their saved record. */}
        {visit.consultationType === "follow_up" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <User className="h-4 w-4" /> Patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedPatient ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchRef}
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setSelectedPatient(null);
                    }}
                    placeholder="Search existing patient by Patient ID, name, or mobile..."
                    className="pl-10"
                  />
                  {searchingPatients && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
                {patientResults.length > 0 && (
                  <div className="border rounded-md shadow-sm max-h-52 overflow-auto divide-y">
                    {patientResults.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => selectPatient(p)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{p.name}</span>
                          <span className="text-xs text-gray-500 font-mono">
                            {p.uhid}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {p.mobile} &middot; {p.gender} &middot; Age{" "}
                          {p.age || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {patientSearch.length >= 2 &&
                  !searchingPatients &&
                  patientResults.length === 0 && (
                    <p className="text-sm text-gray-500 py-2">
                      No matching patient found — fill in the registration
                      details below to create a new patient.
                    </p>
                  )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3">
                <div>
                  <p className="font-medium text-sm">{selectedPatient.name}</p>
                  <p className="text-xs text-gray-600">
                    {selectedPatient.uhid}{" "}
                    {selectedPatient.mobile
                      ? `· ${selectedPatient.mobile}`
                      : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearPatient}
                  className="text-gray-500 hover:text-red-600"
                >
                  Change
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Existing Patient Record — for a returning ("old") patient the saved
            demographics are loaded from the database and shown prefilled here,
            so they do not have to be re-entered. */}
        {visit.consultationType === "follow_up" && selectedPatient && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <User className="h-4 w-4" /> Existing Patient Record
                <span className="ml-1 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 normal-case tracking-normal">
                  Prefilled from database
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDetails ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading saved
                  details…
                </div>
              ) : existingDetails ? (
                <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium">
                      {existingDetails.name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mobile Number</p>
                    <p className="text-sm font-medium">
                      {existingDetails.mobile || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="text-sm font-medium capitalize">
                      {existingDetails.gender || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="text-sm font-medium">
                      {existingDetails.age ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Blood Group</p>
                    <p className="text-sm font-medium">
                      {existingDetails.bloodGroup
                        ? existingDetails.bloodGroup.replace("_positive", "+").replace("_negative", "-")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Emergency Contact</p>
                    <p className="text-sm font-medium">
                      {existingDetails.emergencyContact
                        ? `${existingDetails.emergencyContact}${existingDetails.emergencyContactNumber ? ` (${existingDetails.emergencyContactNumber})` : ""}`
                        : "—"}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium">
                      {existingDetails.address || "—"}
                    </p>
                  </div>
                </div>

                {/* Last Visit — pulled from the patient's most recent
                    appointment, consultation (vitals) and invoice (billing /
                    payment). The vitals and doctor are also prefilled into the
                    editable fields below. */}
                {(() => {
                  const appt = existingDetails.appointments?.[0];
                  const cons = existingDetails.consultations?.[0];
                  const inv = existingDetails.invoices?.[0];
                  if (!appt && !cons && !inv) {
                    return (
                      <p className="text-xs text-gray-500 border-t pt-3">
                        No previous visit on record yet.
                      </p>
                    );
                  }
                  const paid = (inv?.payments || []).reduce(
                    (s: number, p: any) => s + (p.amount || 0),
                    0,
                  );
                  return (
                    <div className="border-t pt-3 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Last Visit
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="text-sm font-medium">
                            {appt?.date
                              ? new Date(appt.date).toLocaleDateString("en-IN")
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="text-sm font-medium">
                            {appt?.time || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Doctor</p>
                          <p className="text-sm font-medium">
                            {appt?.doctor?.user?.name
                              ? `Dr. ${appt.doctor.user.name}`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-medium">
                            {appt?.department?.name || "—"}
                          </p>
                        </div>
                      </div>
                      {cons && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Vitals (last recorded)
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {cons.bloodPressure && (
                              <span className="bg-gray-100 rounded px-2 py-0.5">
                                BP {cons.bloodPressure}
                              </span>
                            )}
                            {cons.pulse != null && (
                              <span className="bg-gray-100 rounded px-2 py-0.5">
                                Pulse {cons.pulse}
                              </span>
                            )}
                            {cons.temperature != null && (
                              <span className="bg-gray-100 rounded px-2 py-0.5">
                                Temp {cons.temperature}°F
                              </span>
                            )}
                            {cons.oxygenSaturation != null && (
                              <span className="bg-gray-100 rounded px-2 py-0.5">
                                SpO2 {cons.oxygenSaturation}%
                              </span>
                            )}
                            {cons.weight != null && (
                              <span className="bg-gray-100 rounded px-2 py-0.5">
                                Wt {cons.weight}kg
                              </span>
                            )}
                            {cons.height != null && (
                              <span className="bg-gray-100 rounded px-2 py-0.5">
                                Ht {cons.height}cm
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {inv && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Last Bill</p>
                            <p className="text-sm font-medium">
                              ₹{Number(inv.total || 0).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Paid</p>
                            <p className="text-sm font-medium">
                              ₹{paid.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Payment Status
                            </p>
                            <p className="text-sm font-medium capitalize">
                              {inv.status || "—"}
                            </p>
                          </div>
                        </div>
                      )}
                      <p className="text-[11px] text-gray-400">
                        Vitals and doctor from this visit have been prefilled
                        below — review and update as needed.
                      </p>
                    </div>
                  );
                })()}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">
                  Using this patient&apos;s saved record. Capture vitals and
                  book the visit below.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* New Patient Registration (only in New consultation mode) */}
        {visit.consultationType === "new" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                New Patient Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <User className="h-3 w-3" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input
                      value={newPatient.name}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, name: e.target.value })
                      }
                      placeholder="Patient's full name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Mobile Number *
                    </label>
                    <Input
                      value={newPatient.mobile}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, mobile: e.target.value })
                      }
                      type="tel"
                      placeholder="10-digit mobile"
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Gender *</label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, gender: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Date of Birth & Blood Group
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Date of Birth</label>
                    <Input
                      value={newPatient.dateOfBirth}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          dateOfBirth: e.target.value,
                        })
                      }
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Age (auto-calculated)
                    </label>
                    <Input
                      value={newPatient.age}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, age: e.target.value })
                      }
                      type="number"
                      placeholder="Age"
                      min="0"
                      max="150"
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Droplet className="h-3 w-3" /> Blood Group
                    </label>
                    <select
                      value={newPatient.bloodGroup}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          bloodGroup: e.target.value,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="A_positive">A+</option>
                      <option value="A_negative">A-</option>
                      <option value="B_positive">B+</option>
                      <option value="B_negative">B-</option>
                      <option value="AB_positive">AB+</option>
                      <option value="AB_negative">AB-</option>
                      <option value="O_positive">O+</option>
                      <option value="O_negative">O-</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Address
                </h3>
                <textarea
                  value={newPatient.address}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, address: e.target.value })
                  }
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Full address"
                />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Phone className="h-3 w-3" /> Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Contact Person
                    </label>
                    <Input
                      value={newPatient.emergencyContact}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          emergencyContact: e.target.value,
                        })
                      }
                      placeholder="Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Contact Number
                    </label>
                    <Input
                      value={newPatient.emergencyContactNumber}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          emergencyContactNumber: e.target.value,
                        })
                      }
                      type="tel"
                      placeholder="10-digit number"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vitals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Activity className="h-4 w-4" /> Vitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Heart className="h-3 w-3" /> Blood Pressure
                </label>
                <Input
                  value={vitals.bloodPressure}
                  onChange={(e) =>
                    setVitals({ ...vitals, bloodPressure: e.target.value })
                  }
                  placeholder="120/80"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">SpO2 (%)</label>
                <Input
                  type="number"
                  value={vitals.oxygenSaturation}
                  onChange={(e) =>
                    setVitals({ ...vitals, oxygenSaturation: e.target.value })
                  }
                  placeholder="98"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Height (cm)
                </label>
                <Input
                  type="number"
                  value={vitals.height}
                  onChange={(e) =>
                    setVitals({ ...vitals, height: e.target.value })
                  }
                  placeholder="170"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Weight className="h-3 w-3" /> Weight (kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={vitals.weight}
                  onChange={(e) =>
                    setVitals({ ...vitals, weight: e.target.value })
                  }
                  placeholder="70"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Thermometer className="h-3 w-3" /> Temp (°F)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) =>
                    setVitals({ ...vitals, temperature: e.target.value })
                  }
                  placeholder="98.6"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Pulse (bpm)</label>
                <Input
                  type="number"
                  value={vitals.pulse}
                  onChange={(e) =>
                    setVitals({ ...vitals, pulse: e.target.value })
                  }
                  placeholder="72"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Stethoscope className="h-4 w-4" /> Department & Doctor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Department *</label>
                <select
                  value={visit.departmentId}
                  onChange={(e) =>
                    setVisit({ ...visit, departmentId: e.target.value })
                  }
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select Department</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Doctor *</label>
                <select
                  value={visit.doctorId}
                  onChange={(e) =>
                    setVisit({ ...visit, doctorId: e.target.value })
                  }
                  required
                  disabled={!visit.departmentId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="">
                    {visit.departmentId
                      ? "Select Doctor"
                      : "Select department first"}
                  </option>
                  {doctors.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1 sm:w-72">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={visit.date}
                  onChange={(e) => setVisit({ ...visit, date: e.target.value })}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-1 sm:w-72">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Time (manual)
                </label>
                <Input
                  type="text"
                  value={visit.time}
                  onChange={(e) =>
                    setVisit({ ...visit, time: e.target.value })
                  }
                  placeholder="e.g. 05:00 PM"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time Slot *
              </label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {timeSlots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setVisit((prev) => ({ ...prev, time: s }))}
                    className={`px-2 py-1.5 text-xs rounded-md border transition-all ${visit.time === s ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white hover:bg-blue-50 border-gray-200 text-gray-700"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-2">
          <Link href="/patients">
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !isVisitValid} size="sm">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isScheduleFlow ? "Book Visit" : "Register"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function PatientRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <PatientRegistrationForm />
    </Suspense>
  );
}
