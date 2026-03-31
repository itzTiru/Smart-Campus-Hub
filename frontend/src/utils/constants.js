export const BOOKING_STATUS = {
  PENDING: { label: 'Pending', color: 'yellow', bgClass: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Approved', color: 'green', bgClass: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejected', color: 'red', bgClass: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelled', color: 'gray', bgClass: 'bg-gray-100 text-gray-800' },
};

export const TICKET_STATUS = {
  OPEN: { label: 'Open', color: 'blue', bgClass: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'yellow', bgClass: 'bg-yellow-100 text-yellow-800' },
  RESOLVED: { label: 'Resolved', color: 'green', bgClass: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Closed', color: 'gray', bgClass: 'bg-gray-100 text-gray-800' },
  REJECTED: { label: 'Rejected', color: 'red', bgClass: 'bg-red-100 text-red-800' },
};

export const PRIORITY = {
  LOW: { label: 'Low', color: 'green', bgClass: 'bg-green-100 text-green-800' },
  MEDIUM: { label: 'Medium', color: 'yellow', bgClass: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'High', color: 'orange', bgClass: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: 'Critical', color: 'red', bgClass: 'bg-red-100 text-red-800' },
};

export const RESOURCE_TYPES = [
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'PROJECTOR', label: 'Projector' },
  { value: 'CAMERA', label: 'Camera' },
  { value: 'EQUIPMENT_OTHER', label: 'Other Equipment' },
];

export const RESOURCE_STATUS = {
  ACTIVE: { label: 'Active', bgClass: 'bg-green-100 text-green-800' },
  OUT_OF_SERVICE: { label: 'Out of Service', bgClass: 'bg-red-100 text-red-800' },
};

export const TICKET_CATEGORIES = [
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'IT_EQUIPMENT', label: 'IT Equipment' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];
