// Master Room Registry & Metadata
// Configured according to venue room specification:
// - B101 to B109 (Wing B)
// - V101 to V108 (Wing V)
// - H101 to H110 (Wing H)
// - D101 to D104 (Wing D - Standard)
// - D105 to D106 (Wing D - 6-Pax Dorms, separated by guest name)
// - S101 (Suite S)

export const ROOM_WINGS = [
  { id: "ALL", label: "All Rooms", color: "amber" },
  { id: "B", label: "Wing B (B101–B109)", color: "blue" },
  { id: "V", label: "Wing V (V101–V108)", color: "purple" },
  { id: "H", label: "Wing H (H101–H110)", color: "emerald" },
  { id: "D", label: "Wing D (D101–D106)", color: "orange" },
  { id: "S", label: "Suite S (S101)", color: "rose" },
];

export const ROOMS = [
  // Wing B: B101 - B109
  { number: "B101", wing: "B", type: "BeachFront Deluxe", isDorm: false },
  { number: "B102", wing: "B", type: "BeachFront Deluxe", isDorm: false },
  { number: "B103", wing: "B", type: "BeachFront Deluxe", isDorm: false },
  { number: "B104", wing: "B", type: "BeachFront Deluxe", isDorm: false },
  { number: "B105", wing: "B", type: "BeachFront Deluxe", isDorm: false },
  { number: "B106", wing: "B", type: "BeachFront Chalet", isDorm: false },
  { number: "B107", wing: "B", type: "BeachFront Chalet", isDorm: false },
  { number: "B108", wing: "B", type: "BeachFront Chalet", isDorm: false },
  { number: "B109", wing: "B", type: "BeachFront Chalet", isDorm: false },

  // Wing V: V101 - V108
  { number: "V101", wing: "V", type: "Villa", isDorm: false },
  { number: "V102", wing: "V", type: "Villa", isDorm: false },
  { number: "V103", wing: "V", type: "Villa", isDorm: false },
  { number: "V104", wing: "V", type: "Villa", isDorm: false },
  { number: "V105", wing: "V", type: "Villa", isDorm: false },
  { number: "V106", wing: "V", type: "Villa", isDorm: false },
  { number: "V107", wing: "V", type: "Villa", isDorm: false },
  { number: "V108", wing: "V", type: "Villa", isDorm: false },

  // Wing H: H101 - H110
  { number: "H101", wing: "H", type: "Bayview Chalet", isDorm: false },
  { number: "H102", wing: "H", type: "Bayview Chalet", isDorm: false },
  { number: "H103", wing: "H", type: "Bayview Chalet", isDorm: false },
  { number: "H104", wing: "H", type: "Bayview Chalet", isDorm: false },
  { number: "H105", wing: "H", type: "Bayview Chalet", isDorm: false },
  { number: "H106", wing: "H", type: "Bayview Chalet", isDorm: false },
  { number: "H107", wing: "H", type: "Bayview Chalet", isDorm: false },
  { number: "H108", wing: "H", type: "Bayview Chalet", isDorm: false },
  { number: "H109", wing: "H", type: "Bayview Chalet", isDorm: false },
  { number: "H110", wing: "H", type: "Bayview Chalet", isDorm: false },

  // Wing D: D101 - D104 (Standard)
  { number: "D101", wing: "D", type: "Standard Room", isDorm: false },
  { number: "D102", wing: "D", type: "Standard Room", isDorm: false },
  { number: "D103", wing: "D", type: "Standard Room", isDorm: false },
  { number: "D104", wing: "D", type: "Standard Room", isDorm: false },

  // Wing D: D105 & D106 (6-Pax Dorms, separated by guest name)
  {
    number: "D105",
    wing: "D",
    type: "Dorm (6 Pax)",
    isDorm: true,
    maxPax: 6,
    description: "6-Pax Shared Dormitory (Separated by Guest/Bed Name)",
  },
  {
    number: "D106",
    wing: "D",
    type: "Dorm (6 Pax)",
    isDorm: true,
    maxPax: 6,
    description: "6-Pax Shared Dormitory (Separated by Guest/Bed Name)",
  },

  // Suite S: S101
  { number: "S101", wing: "S", type: "SeaView Villa", isDorm: false },
];

export const getRoomByNumber = (roomNumber) => {
  if (!roomNumber) return null;
  const normalized = roomNumber.toUpperCase().trim();
  return (
    ROOMS.find((r) => r.number === normalized) || {
      number: normalized,
      wing: normalized[0] || "OTHER",
      type: "Custom Room",
      isDorm: ["D105", "D106"].includes(normalized),
    }
  );
};

export const isDormRoom = (roomNumber) => {
  if (!roomNumber) return false;
  return ["D105", "D106"].includes(roomNumber.toUpperCase().trim());
};
