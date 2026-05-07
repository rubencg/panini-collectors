export const TEAMS = [
  // Group A
  { code: "MEX", name: "Mexico",          group: "A", colors: ["#006847", "#ffffff", "#ce1126"] },
  { code: "RSA", name: "South Africa",    group: "A", colors: ["#007a4d", "#ffb612", "#de3831"] },
  { code: "KOR", name: "Korea Republic",  group: "A", colors: ["#ffffff", "#cd2e3a", "#0047a0"] },
  { code: "CZE", name: "Czechia",         group: "A", colors: ["#11457e", "#ffffff", "#d7141a"] },
  // Group B
  { code: "CAN", name: "Canada",              group: "B", colors: ["#ff0000", "#ffffff", "#ff0000"] },
  { code: "BIH", name: "Bosnia-Herzegovina",  group: "B", colors: ["#002395", "#ffcc00", "#002395"] },
  { code: "QAT", name: "Qatar",               group: "B", colors: ["#8a1538", "#ffffff", "#8a1538"] },
  { code: "SUI", name: "Switzerland",         group: "B", colors: ["#da291c", "#ffffff", "#da291c"] },
  // Group C
  { code: "BRA", name: "Brazil",     group: "C", colors: ["#009c3b", "#ffdf00", "#002776"] },
  { code: "MAR", name: "Morocco",    group: "C", colors: ["#c1272d", "#006233", "#c1272d"] },
  { code: "HAI", name: "Haiti",      group: "C", colors: ["#00209f", "#ffffff", "#d21034"] },
  { code: "SCO", name: "Scotland",   group: "C", colors: ["#0065bf", "#ffffff", "#0065bf"] },
  // Group D
  { code: "USA", name: "USA",        group: "D", colors: ["#3c3b6e", "#ffffff", "#b22234"] },
  { code: "PAR", name: "Paraguay",   group: "D", colors: ["#d52b1e", "#ffffff", "#0038a8"] },
  { code: "AUS", name: "Australia",  group: "D", colors: ["#00843d", "#ffcd00", "#00843d"] },
  { code: "TUR", name: "Turkiye",    group: "D", colors: ["#e30a17", "#ffffff", "#e30a17"] },
  // Group E
  { code: "GER", name: "Germany",       group: "E", colors: ["#000000", "#dd0000", "#ffce00"] },
  { code: "CUW", name: "Curacao",       group: "E", colors: ["#002b7f", "#fcd116", "#002b7f"] },
  { code: "CIV", name: "Cote d'Ivoire", group: "E", colors: ["#ff8200", "#ffffff", "#009e60"] },
  { code: "ECU", name: "Ecuador",       group: "E", colors: ["#ffdd00", "#0072ce", "#ef3340"] },
  // Group F
  { code: "NED", name: "Netherlands", group: "F", colors: ["#ae1c28", "#ffffff", "#21468b"] },
  { code: "JPN", name: "Japan",       group: "F", colors: ["#ffffff", "#bc002d", "#ffffff"] },
  { code: "SWE", name: "Sweden",      group: "F", colors: ["#006aa7", "#fecc00", "#006aa7"] },
  { code: "TUN", name: "Tunisia",     group: "F", colors: ["#e70013", "#ffffff", "#e70013"] },
  // Group G
  { code: "BEL", name: "Belgium",     group: "G", colors: ["#000000", "#fae042", "#ed2939"] },
  { code: "EGY", name: "Egypt",       group: "G", colors: ["#ce1126", "#ffffff", "#000000"] },
  { code: "IRN", name: "IR Iran",     group: "G", colors: ["#239f40", "#ffffff", "#da0000"] },
  { code: "NZL", name: "New Zealand", group: "G", colors: ["#012169", "#ffffff", "#c8102e"] },
  // Group H
  { code: "ESP", name: "Spain",        group: "H", colors: ["#aa151b", "#f1bf00", "#aa151b"] },
  { code: "CPV", name: "Cabo Verde",   group: "H", colors: ["#003893", "#ffffff", "#cf2027"] },
  { code: "KSA", name: "Saudi Arabia", group: "H", colors: ["#006c35", "#ffffff", "#006c35"] },
  { code: "URU", name: "Uruguay",      group: "H", colors: ["#7fb3d5", "#ffffff", "#0a3d62"] },
  // Group I
  { code: "FRA", name: "France",   group: "I", colors: ["#0055a4", "#ffffff", "#ef4135"] },
  { code: "SEN", name: "Senegal",  group: "I", colors: ["#00853f", "#fdef42", "#e31b23"] },
  { code: "IRQ", name: "Iraq",     group: "I", colors: ["#ce1126", "#ffffff", "#000000"] },
  { code: "NOR", name: "Norway",   group: "I", colors: ["#ef2b2d", "#ffffff", "#002868"] },
  // Group J
  { code: "ARG", name: "Argentina", group: "J", colors: ["#75aadb", "#ffffff", "#75aadb"] },
  { code: "ALG", name: "Algeria",   group: "J", colors: ["#006233", "#ffffff", "#d21034"] },
  { code: "AUT", name: "Austria",   group: "J", colors: ["#ed2939", "#ffffff", "#ed2939"] },
  { code: "JOR", name: "Jordan",    group: "J", colors: ["#000000", "#ffffff", "#007a3d"] },
  // Group K
  { code: "POR", name: "Portugal",   group: "K", colors: ["#006600", "#ffd700", "#ff0000"] },
  { code: "COD", name: "Congo DR",   group: "K", colors: ["#007fff", "#fcd116", "#ce1021"] },
  { code: "UZB", name: "Uzbekistan", group: "K", colors: ["#0099b5", "#ffffff", "#1eb53a"] },
  { code: "COL", name: "Colombia",   group: "K", colors: ["#fcd116", "#003893", "#ce1126"] },
  // Group L
  { code: "ENG", name: "England",  group: "L", colors: ["#ffffff", "#cf142b", "#ffffff"] },
  { code: "CRO", name: "Croatia",  group: "L", colors: ["#ff0000", "#ffffff", "#171796"] },
  { code: "GHA", name: "Ghana",    group: "L", colors: ["#ce1126", "#fcd116", "#006b3f"] },
  { code: "PAN", name: "Panama",   group: "L", colors: ["#005293", "#ffffff", "#d21034"] },
]

export const PEOPLE = ["Ivan", "Ruy", "Giovanni", "Ruben", "Andres"]
export const STICKERS_PER_TEAM = 12
export const FWC_COUNT = 9

export function stickerLabelFor(team, idx) {
  if (idx === 0) return "Logo"
  return `Player ${String(idx).padStart(2, "0")}`
}

export function buildAllStickers() {
  const list = []
  for (let i = 1; i <= FWC_COUNT; i++) {
    list.push({ id: `FWC-${i}`, group: "FWC", code: "FWC", num: i, label: null })
  }
  for (const t of TEAMS) {
    for (let i = 0; i < STICKERS_PER_TEAM; i++) {
      list.push({
        id: `${t.code}-${i}`,
        group: t.code,
        code: t.code,
        num: i,
        label: stickerLabelFor(t, i),
      })
    }
  }
  return list
}

export const ALL_STICKERS = buildAllStickers()
export const TOTAL_STICKERS = ALL_STICKERS.length
