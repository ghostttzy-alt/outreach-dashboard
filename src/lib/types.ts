import type { Activity, Client, Email, Lead, Settings, Site, Template } from "@prisma/client";

/** Shape of a Prisma record after JSON serialization (Dates become strings). */
export type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

export type LeadDTO = Serialized<Lead>;
export type EmailDTO = Serialized<Email>;
export type SiteDTO = Serialized<Site>;
export type ClientDTO = Serialized<Client>;
export type ActivityDTO = Serialized<Activity>;
export type TemplateDTO = Serialized<Template>;
export type SettingsDTO = Serialized<Settings>;

export type LeadFull = LeadDTO & {
  emails: EmailDTO[];
  sites: SiteDTO[];
  client: ClientDTO | null;
  activities: ActivityDTO[];
};
