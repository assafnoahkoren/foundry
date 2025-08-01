export interface ICAORule {
  ruleCategory: string;
  ruleId: string;
  ruleName: string;
  ruleDescription: string;
  correctExample: string;
  incorrectExample: string;
}

export const icaoRules: ICAORule[] = [
  {
    ruleCategory: "Transmitting Techniques",
    ruleId: "2.2.1",
    ruleName: "Speaking Clarity",
    ruleDescription: "Speak clearly at 100 words per minute or slower with natural rhythm and pauses between phrases",
    correctExample: "CLIMB FLIGHT LEVEL TWO THREE ZERO, SPEEDBIRD ONE TWO THREE.",
    incorrectExample: "Climbtoflightleveltwentythreezero."
  },
  {
    ruleCategory: "Transmission of Letters",
    ruleId: "2.3.1",
    ruleName: "Phonetic Alphabet Usage",
    ruleDescription: "Use standard ICAO phonetic alphabet for all alphanumeric identifiers",
    correctExample: "SPEEDBIRD ONE TWO THREE ALFA",
    incorrectExample: "SPEEDBIRD ONE TWO THREE A"
  },
  {
    ruleCategory: "Transmission of Numbers",
    ruleId: "2.4.1",
    ruleName: "Number Pronunciation",
    ruleDescription: "Each digit is pronounced separately using ICAO standard pronunciation",
    correctExample: "SQUAWK FOUR SEVEN ZERO ONE",
    incorrectExample: "Squawk forty-seven oh one"
  },
  {
    ruleCategory: "Transmission of Numbers",
    ruleId: "2.4.2",
    ruleName: "Decimal Usage",
    ruleDescription: "Use 'DECIMAL' for frequency decimal points",
    correctExample: "CONTACT TOWER ONE ONE EIGHT DECIMAL TWO",
    incorrectExample: "Contact tower one eighteen point two"
  },
  {
    ruleCategory: "Transmission of Time",
    ruleId: "2.5.1",
    ruleName: "Time Format",
    ruleDescription: "Time is given using 4-digit UTC format, add 'ZULU' only if required",
    correctExample: "ZERO NINER FOUR FIVE ZULU",
    incorrectExample: "9:45 a.m."
  },
  {
    ruleCategory: "Standard Words and Phrases",
    ruleId: "2.6.1",
    ruleName: "Acknowledgment",
    ruleDescription: "Use 'ROGER' to acknowledge receipt and understanding",
    correctExample: "ROGER, DESCENDING TO FLIGHT LEVEL ONE EIGHT ZERO",
    incorrectExample: "OK, going down to 180"
  },
  {
    ruleCategory: "Standard Words and Phrases",
    ruleId: "2.6.2",
    ruleName: "Affirmative Response",
    ruleDescription: "Use 'AFFIRM' for yes",
    correctExample: "AFFIRM, WE HAVE THE RUNWAY IN SIGHT",
    incorrectExample: "Yes, we see the runway"
  },
  {
    ruleCategory: "Standard Words and Phrases",
    ruleId: "2.6.3",
    ruleName: "Negative Response",
    ruleDescription: "Use 'NEGATIVE' for no",
    correctExample: "NEGATIVE, UNABLE TO ACCEPT HIGHER ALTITUDE",
    incorrectExample: "No, we can't go higher"
  },
  {
    ruleCategory: "Standard Words and Phrases",
    ruleId: "2.6.4",
    ruleName: "Compliance Confirmation",
    ruleDescription: "Use 'WILCO' to indicate will comply",
    correctExample: "WILCO, SPEEDBIRD ONE TWO THREE",
    incorrectExample: "Will do"
  },
  {
    ruleCategory: "Call Signs",
    ruleId: "2.7.1",
    ruleName: "Initial Contact Call Sign",
    ruleDescription: "Always give full call sign initially with aircraft type and weight category on first contact",
    correctExample: "HEATHROW GROUND, SPEEDBIRD THREE SIX FIVE, A320 HEAVY.",
    incorrectExample: "Heathrow, Speedbird 365"
  },
  {
    ruleCategory: "Call Signs",
    ruleId: "2.7.2",
    ruleName: "Call Sign Abbreviation",
    ruleDescription: "Abbreviate call sign only after ATC authorizes it",
    correctExample: "SPEEDBIRD THREE SIX FIVE (full) then SPEEDBIRD FIVE (after authorization)",
    incorrectExample: "BA365 or just 365"
  },
  {
    ruleCategory: "Radiotelephony Procedures",
    ruleId: "2.8.1",
    ruleName: "Communication Structure",
    ruleDescription: "Identify station called, identify yourself, state message, repeat call sign if required",
    correctExample: "FRANKFURT TOWER, SPEEDBIRD ONE TWO THREE, READY FOR DEPARTURE.",
    incorrectExample: "Tower, ready to go"
  },
  {
    ruleCategory: "Reporting Headings",
    ruleId: "3.1.1",
    ruleName: "Heading Format",
    ruleDescription: "Use 'HEADING' followed by three-digit number with leading zeros",
    correctExample: "TURN LEFT HEADING ONE EIGHT ZERO",
    incorrectExample: "Turn to 180 degrees"
  },
  {
    ruleCategory: "Reporting Altitudes",
    ruleId: "3.2.1",
    ruleName: "Altitude vs Flight Level",
    ruleDescription: "Use 'ALTITUDE' below FL180, 'FLIGHT LEVEL' at or above FL180",
    correctExample: "MAINTAIN FLIGHT LEVEL TWO FOUR ZERO",
    incorrectExample: "Maintain two forty"
  },
  {
    ruleCategory: "Reporting Altitudes",
    ruleId: "3.2.2",
    ruleName: "Altitude Pronunciation",
    ruleDescription: "Say each digit individually for flight levels",
    correctExample: "FLIGHT LEVEL ONE EIGHT ZERO",
    incorrectExample: "Flight level one eighty"
  },
  {
    ruleCategory: "Climb and Descent",
    ruleId: "3.3.1",
    ruleName: "Vertical Movement Instructions",
    ruleDescription: "Use standard ICAO verbs: CLIMB, DESCEND, MAINTAIN with target level",
    correctExample: "CLIMB TO ALTITUDE SIX THOUSAND",
    incorrectExample: "Go up to six thousand"
  },
  {
    ruleCategory: "Communication Flow",
    ruleId: "3.4.1",
    ruleName: "Standard Sequence",
    ruleDescription: "Follow sequence: Station called, Aircraft ID, Message, Optional repeat call sign",
    correctExample: "TEL AVIV TOWER, ELAL FOUR FIVE SEVEN, READY FOR TAKEOFF",
    incorrectExample: "Tel Aviv, 457 ready"
  },
  {
    ruleCategory: "Departure Communications",
    ruleId: "3.5.1",
    ruleName: "Initial Clearance Request",
    ruleDescription: "Include aircraft type, weight category, stand, ATIS, and request on first contact",
    correctExample: "BEN GURION CLEARANCE, ELAL FOUR FIVE SEVEN, B787 HEAVY, STAND TWENTY ONE, INFORMATION BRAVO, REQUEST IFR CLEARANCE TO LONDON",
    incorrectExample: "Clearance, EL AL 457, need clearance to London"
  },
  {
    ruleCategory: "Enroute Communications",
    ruleId: "3.6.1",
    ruleName: "Position Reporting",
    ruleDescription: "Report position with time, level, and next estimate in non-radar airspace",
    correctExample: "AT NIKAS AT ONE TWO TWO ZERO, FLIGHT LEVEL THREE SIX ZERO, ESTIMATING ROLIS AT ONE TWO FIVE ZERO",
    incorrectExample: "Passing NIKAS now, we'll get to ROLIS in half an hour"
  },
  {
    ruleCategory: "Arrival Communications",
    ruleId: "3.7.1",
    ruleName: "Approach Initial Contact",
    ruleDescription: "Report current level and ATIS information when contacting approach",
    correctExample: "FRANKFURT APPROACH, SPEEDBIRD ONE TWO THREE, FLIGHT LEVEL TWO THREE ZERO, WITH INFORMATION HOTEL",
    incorrectExample: "Frankfurt approach, 123, level 230, we got the weather"
  },
  {
    ruleCategory: "Emergency Communications",
    ruleId: "3.8.1",
    ruleName: "Distress Call",
    ruleDescription: "Use 'MAYDAY' three times for distress, provide position, nature, intentions",
    correctExample: "MAYDAY MAYDAY MAYDAY, SPEEDBIRD ONE TWO THREE, ENGINE FAILURE, POSITION NORTH OF GENEVA, DESCENDING TO FLIGHT LEVEL ONE EIGHT ZERO",
    incorrectExample: "Emergency! We have an engine failure!"
  },
  {
    ruleCategory: "Emergency Communications",
    ruleId: "3.8.2",
    ruleName: "Urgency Call",
    ruleDescription: "Use 'PAN PAN' three times for urgency situations",
    correctExample: "PAN PAN PAN, SPEEDBIRD ONE TWO THREE, FLIGHT LEVEL THREE ONE ZERO, REPORTING LOW FUEL, REQUESTING PRIORITY LANDING",
    incorrectExample: "We're running low on fuel, need to land soon"
  },
  {
    ruleCategory: "Readback Requirements",
    ruleId: "3.9.1",
    ruleName: "Clearance Readback",
    ruleDescription: "Always read back clearances including altitude, heading, and frequency changes",
    correctExample: "DESCENDING TO FLIGHT LEVEL TWO ZERO ZERO, SPEEDBIRD ONE TWO THREE",
    incorrectExample: "OK" or no readback
  },
  {
    ruleCategory: "Heavy Aircraft",
    ruleId: "3.9.2",
    ruleName: "Heavy Designation",
    ruleDescription: "Always include 'HEAVY' in call sign for aircraft over 136,000 kg",
    correctExample: "SPEEDBIRD ONE TWO THREE HEAVY",
    incorrectExample: "SPEEDBIRD ONE TWO THREE"
  }
];