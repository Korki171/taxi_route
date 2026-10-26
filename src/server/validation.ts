import { z } from "zod";
import { invalid } from "./errors";

const trimmed = (max: number) => z.string().trim().min(1, "Pflichtfeld").max(max);
const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const emailSchema = z.string().trim().toLowerCase().email("Ungültige E-Mail-Adresse").max(254);
export const passwordSchema = z
  .string()
  .min(10, "Das Passwort muss mindestens 10 Zeichen lang sein.")
  .max(200);

export const countrySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "Ländercode im Format ISO-3166 (z. B. AT, DE)");

export const userInputSchema = z.object({
  name: trimmed(120),
  email: emailSchema,
  password: passwordSchema,
});

export const orgProfileSchema = z.object({
  name: trimmed(160),
  legalName: optionalTrimmed(200),
  street: trimmed(200),
  postalCode: trimmed(20),
  city: trimmed(120),
  country: countrySchema,
  email: emailSchema,
  phone: trimmed(40),
  website: optionalTrimmed(200),
  vatId: optionalTrimmed(40),
  registerNumber: optionalTrimmed(60),
  contactPerson: optionalTrimmed(120),
});

export const registrationSchema = z.object({
  user: userInputSchema,
  organization: orgProfileSchema.extend({
    // Bei der Selbstregistrierung nur die beiden MVP-Typen.
    type: z.enum(["TRANSPORT_COMPANY", "TRAVEL_AGENCY"]),
  }),
});

export const transportProfileSchema = z.object({
  concessionNumber: optionalTrimmed(80),
  vehicleCategories: z
    .array(z.enum(["SEDAN", "ESTATE", "MINIVAN", "VAN", "MINIBUS", "BUS", "LUXURY", "WHEELCHAIR"]))
    .max(8),
  declaredRegions: z.array(z.string().trim().min(1).max(60)).max(30),
  fleetSize: z.number().int().min(0).max(10000).optional(),
});

export const memberRoleSchema = z.enum(["OWNER", "ADMIN", "DISPATCHER", "BOOKER", "FINANCE", "VIEWER"]);

export function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues[0];
    throw invalid(`${first.path.join(".") || "Eingabe"}: ${first.message}`);
  }
  return r.data;
}
