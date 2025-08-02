export interface ExpectedComponent {
  component: string;
  category: string;
  description: string;
  required?: boolean;
  icaoRule?: string;
}

export const expectedComponentsData: ExpectedComponent[] = [
  // BASIC COMPONENTS
  {
    component: "callsign",
    category: "Basic",
    description: "Aircraft callsign (required in most communications)",
    icaoRule: "2.7.1"
  },
  {
    component: "aircraft_type",
    category: "Basic", 
    description: "Aircraft type (required on initial contact)",
    icaoRule: "2.7.1"
  },
  {
    component: "weight_category",
    category: "Basic",
    description: "HEAVY or SUPER designation (required if applicable)",
    icaoRule: "3.9.2"
  },
  {
    component: "stand_number",
    category: "Basic",
    description: "Parking stand number (for ground operations)"
  },
  {
    component: "atis_information",
    category: "Basic",
    description: "ATIS code letter (required on initial contact)",
    icaoRule: "3.7.1"
  },

  // CLEARANCE COMPONENTS
  {
    component: "departure_request",
    category: "Clearance",
    description: "IFR/VFR clearance request",
    icaoRule: "3.5.1"
  },
  {
    component: "destination",
    category: "Clearance",
    description: "Destination airport (required for clearances)"
  },
  {
    component: "flight_level",
    category: "Clearance",
    description: "Requested flight level (FL180 and above)",
    icaoRule: "3.2.1"
  },
  {
    component: "altitude",
    category: "Clearance",
    description: "Requested altitude (below FL180)",
    icaoRule: "3.2.1"
  },
  {
    component: "departure_runway",
    category: "Clearance",
    description: "Assigned departure runway"
  },
  {
    component: "sid",
    category: "Clearance",
    description: "Standard Instrument Departure"
  },
  {
    component: "squawk_code",
    category: "Clearance",
    description: "Transponder code",
    icaoRule: "2.4.1"
  },

  // INSTRUCTION ACKNOWLEDGMENTS
  {
    component: "readback_altitude",
    category: "Acknowledgment",
    description: "Readback of altitude/FL change (mandatory)",
    icaoRule: "3.9.1"
  },
  {
    component: "readback_heading",
    category: "Acknowledgment",
    description: "Readback of heading change (mandatory)",
    icaoRule: "3.9.1"
  },
  {
    component: "readback_frequency",
    category: "Acknowledgment",
    description: "Readback of frequency change (mandatory)",
    icaoRule: "3.9.1"
  },
  {
    component: "readback_runway",
    category: "Acknowledgment",
    description: "Readback of runway assignment (mandatory)",
    icaoRule: "3.9.1"
  },
  {
    component: "readback_clearance",
    category: "Acknowledgment",
    description: "Readback of route clearance (mandatory)",
    icaoRule: "3.9.1"
  },
  {
    component: "roger",
    category: "Acknowledgment",
    description: "Acknowledgment of receipt",
    icaoRule: "2.6.1"
  },
  {
    component: "wilco",
    category: "Acknowledgment",
    description: "Will comply with instruction",
    icaoRule: "2.6.4"
  },

  // POSITION/STATUS REPORTS
  {
    component: "current_position",
    category: "Position Report",
    description: "Current waypoint or location",
    icaoRule: "3.6.1"
  },
  {
    component: "current_level",
    category: "Position Report",
    description: "Current altitude or flight level",
    icaoRule: "3.6.1"
  },
  {
    component: "time_over_position",
    category: "Position Report",
    description: "Time over waypoint (non-radar)",
    icaoRule: "3.6.1"
  },
  {
    component: "next_waypoint",
    category: "Position Report",
    description: "Next position on route",
    icaoRule: "3.6.1"
  },
  {
    component: "estimate_next",
    category: "Position Report",
    description: "ETA at next waypoint",
    icaoRule: "3.6.1"
  },

  // STANDARD PHRASEOLOGY
  {
    component: "affirm",
    category: "Standard Phraseology",
    description: "Affirmative/Yes",
    icaoRule: "2.6.2"
  },
  {
    component: "negative",
    category: "Standard Phraseology",
    description: "Negative/No",
    icaoRule: "2.6.3"
  },
  {
    component: "unable",
    category: "Standard Phraseology",
    description: "Cannot comply with instruction"
  },
  {
    component: "standby",
    category: "Standard Phraseology",
    description: "Wait for further instructions"
  },
  {
    component: "correction",
    category: "Standard Phraseology",
    description: "Correcting previous transmission"
  },
  {
    component: "say_again",
    category: "Standard Phraseology",
    description: "Request repetition"
  },

  // EMERGENCY COMPONENTS
  {
    component: "mayday",
    category: "Emergency",
    description: "Distress call (repeat 3 times)",
    icaoRule: "3.8.1"
  },
  {
    component: "pan_pan",
    category: "Emergency",
    description: "Urgency call (repeat 3 times)",
    icaoRule: "3.8.2"
  },
  {
    component: "nature_of_emergency",
    category: "Emergency",
    description: "Description of emergency",
    icaoRule: "3.8.1"
  },
  {
    component: "intentions",
    category: "Emergency",
    description: "Pilot's intended actions",
    icaoRule: "3.8.1"
  },
  {
    component: "souls_on_board",
    category: "Emergency",
    description: "Number of people on aircraft"
  },
  {
    component: "fuel_remaining",
    category: "Emergency",
    description: "Fuel endurance in hours/minutes"
  },

  // NUMBERS AND VALUES
  {
    component: "heading_three_digits",
    category: "Numbers",
    description: "Heading with three digits",
    icaoRule: "3.1.1"
  },
  {
    component: "altitude_feet",
    category: "Numbers",
    description: "Altitude in feet (below FL180)",
    icaoRule: "3.2.1"
  },
  {
    component: "flight_level_value",
    category: "Numbers",
    description: "Flight level (FL180 and above)",
    icaoRule: "3.2.2"
  },
  {
    component: "speed_knots",
    category: "Numbers",
    description: "Airspeed in knots"
  },
  {
    component: "qnh_setting",
    category: "Numbers",
    description: "Altimeter setting"
  },
  {
    component: "frequency_decimal",
    category: "Numbers",
    description: "Radio frequency with DECIMAL",
    icaoRule: "2.4.2"
  }
];

export const getComponentsByCategory = (category: string): ExpectedComponent[] => {
  return expectedComponentsData.filter(comp => comp.category === category);
};

export const getComponentByName = (name: string): ExpectedComponent | undefined => {
  return expectedComponentsData.find(comp => comp.component === name);
};