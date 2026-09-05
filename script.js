// -----------------------------
// ABC Tutoring - Tutor Data
// -----------------------------

const tutors = [
  {
    id: 1,
    name: "Maya Chen",
    photo: "https://i.pravatar.cc/400?img=47",
    subjects: ["Math", "Physics"],
    grades: "Grades 6–12",
    rate: 45,
    availability: [
      "Monday, Sep 7 - 4:00 PM",
      "Monday, Sep 7 - 5:30 PM",
      "Wednesday, Sep 9 - 4:00 PM"
    ]
  },
  {
    id: 2,
    name: "Daniel Brooks",
    photo: "https://i.pravatar.cc/400?img=12",
    subjects: ["English", "History"],
    grades: "Grades 4–10",
    rate: 40,
    availability: [
      "Tuesday, Sep 8 - 3:30 PM",
      "Tuesday, Sep 8 - 5:00 PM",
      "Thursday, Sep 10 - 4:30 PM"
    ]
  },
  {
    id: 3,
    name: "Sofia Martinez",
    photo: "https://i.pravatar.cc/400?img=32",
    subjects: ["Biology", "Chemistry"],
    grades: "Grades 8–12",
    rate: 50,
    availability: [
      "Monday, Sep 7 - 6:00 PM",
      "Wednesday, Sep 9 - 5:00 PM",
      "Friday, Sep 11 - 4:00 PM"
    ]
  },
  {
    id: 4,
    name: "Ethan Williams",
    photo: "https://i.pravatar.cc/400?img=11",
    subjects: ["Math", "Computer Science"],
    grades: "Grades 7–12",
    rate: 48,
    availability: [
      "Tuesday, Sep 8 - 4:00 PM",
      "Thursday, Sep 10 - 5:30 PM",
      "Saturday, Sep 12 - 11:00 AM"
    ]
  }
];

let selectedTutor = null;
let bookingStartedTracked = false;

// -----------------------------
// Local Storage
// -----------------------------

function getBookedSlots() {
  return JSON.parse(localStorage.getItem("abcTutoringBookings")) || [];
}

function saveBooking(booking) {
  const bookings = getBookedSlots();
  bookings.push(booking);
  localStorage.setItem("abcTutoringBookings", JSON.stringify(bookings));
}

function isSlotBooked(tutorId, slot) {
  return getBookedSlots().some(
    booking =>
      booking.tutorId === tutorId &&
      booking.timeSlot === slot
  );
}

// -----------------------------
// Render Tutors
// -----------------------------

function renderTutors() {
  const tutorList = document.getElementById("tutor-list");

  tutorList.innerHTML = "";

  tutors.forEach(tutor => {
    const availableCount = tutor.availability.filter(
      slot => !isSlotBooked(tutor.id, slot)
    ).length;

    const card = document.createElement("div");
    card.className = "tutor-card";

    card.innerHTML = `
      <img src="${tutor.photo}" alt="${tutor.name}">
      <h3>${tutor.name}</h3>

      <p>
        <strong>Subjects:</strong>
        ${tutor.subjects.join(", ")}
      </p>

      <p>
        <strong>Grade Levels:</strong>
        ${tutor.grades}
      </p>

      <p>
        <strong>Rate:</strong>
        $${tutor.rate}/hour
      </p>

      <p>
        <strong>Availability:</strong>
        ${availableCount} time slot${availableCount !== 1 ? "s" : ""} available
      </p>

      <button
        class="primary-button"
        onclick="openBooking(${tutor.id})"
      >
        View & Book
      </button>
    `;

    tutorList.appendChild(card);
  });
}

// -----------------------------
// Open Booking
// -----------------------------

function openBooking(tutorId) {
  selectedTutor = tutors.find(tutor => tutor.id === tutorId);
  bookingStartedTracked = false;

  // POSTHOG EVENT: Tutor viewed
  if (window.posthog) {
    posthog.capture("tutor viewed", {
      tutor_name: selectedTutor.name,
      subjects: selectedTutor.subjects,
      grade_levels: selectedTutor.grades,
      hourly_rate: selectedTutor.rate
    });
  }

  document.getElementById(
    "selected-tutor"
  ).textContent =
    `${selectedTutor.name} • $${selectedTutor.rate}/hour`;

  // Subjects
  const subjectSelect = document.getElementById("subject");
  subjectSelect.innerHTML =
    '<option value="">Choose a subject</option>';

  selectedTutor.subjects.forEach(subject => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    subjectSelect.appendChild(option);
  });

  // Availability
  const timeSelect = document.getElementById("time-slot");

  timeSelect.innerHTML =
    '<option value="">Choose an available time</option>';

  const availableSlots = selectedTutor.availability.filter(
    slot => !isSlotBooked(selectedTutor.id, slot)
  );

  availableSlots.forEach(slot => {
    const option = document.createElement("option");
    option.value = slot;
    option.textContent = slot;
    timeSelect.appendChild(option);
  });

  if (availableSlots.length === 0) {
    const option = document.createElement("option");
    option.textContent = "No times currently available";
    option.disabled = true;
    timeSelect.appendChild(option);
  }

  document
    .getElementById("booking-modal")
    .classList.remove("hidden");
}

// -----------------------------
// Booking Started Analytics
// -----------------------------

document
  .getElementById("booking-form")
  .addEventListener("focusin", function () {

    if (!selectedTutor || bookingStartedTracked) {
      return;
    }

    bookingStartedTracked = true;

    // POSTHOG EVENT: Booking started
    if (window.posthog) {
      posthog.capture("booking started", {
        tutor_name: selectedTutor.name,
        hourly_rate: selectedTutor.rate
      });
    }
  });

// -----------------------------
// Complete Booking
// -----------------------------

document
  .getElementById("booking-form")
  .addEventListener("submit", function (event) {

    event.preventDefault();

    const parentName =
      document.getElementById("parent-name").value;

    const parentEmail =
      document.getElementById("parent-email").value;

    const studentName =
      document.getElementById("student-name").value;

    const studentGrade =
      document.getElementById("student-grade").value;

    const subject =
      document.getElementById("subject").value;

    const timeSlot =
      document.getElementById("time-slot").value;

    const booking = {
      tutorId: selectedTutor.id,
      tutorName: selectedTutor.name,
      parentName,
      parentEmail,
      studentName,
      studentGrade,
      subject,
      timeSlot
    };

    saveBooking(booking);

    // POSTHOG EVENT: Booking completed
    //
    // Important:
    // We intentionally do NOT send names or email addresses
    // to analytics.
    if (window.posthog) {
      posthog.capture("booking completed", {
        tutor_name: selectedTutor.name,
        subject: subject,
        student_grade: studentGrade,
        time_slot: timeSlot,
        hourly_rate: selectedTutor.rate
      });
    }

    document
      .getElementById("booking-modal")
      .classList.add("hidden");

    document
      .getElementById("confirmation")
      .classList.remove("hidden");

    document.getElementById("booking-form").reset();

    renderTutors();
  });

// -----------------------------
// Close Booking Modal
// -----------------------------

document
  .getElementById("close-modal")
  .addEventListener("click", function () {
    document
      .getElementById("booking-modal")
      .classList.add("hidden");
  });

// -----------------------------
// Close Confirmation
// -----------------------------

document
  .getElementById("close-confirmation")
  .addEventListener("click", function () {
    document
      .getElementById("confirmation")
      .classList.add("hidden");
  });

// -----------------------------
// Initial Page Load
// -----------------------------

renderTutors();
