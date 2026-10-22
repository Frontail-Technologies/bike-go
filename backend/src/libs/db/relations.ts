import { relations } from "drizzle-orm";
import {
  account,
  bookingAddonItems,
  bookingAddons,
  bookings,
  customerProfiles,
  loanApplications,
  loanDocuments,
  loanStatusHistory,
  locations,
  session,
  user,
  vehicleBlocks,
  vehicleImages,
  vehicles,
} from "./schema";

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(customerProfiles, { fields: [user.id], references: [customerProfiles.userId] }),
  sessions: many(session),
  accounts: many(account),
  bookings: many(bookings),
  loanApplications: many(loanApplications),
}));

export const sessionRelations = relations(session, ({ one }) => ({ user: one(user, { fields: [session.userId], references: [user.id] }) }));
export const accountRelations = relations(account, ({ one }) => ({ user: one(user, { fields: [account.userId], references: [user.id] }) }));
export const customerProfileRelations = relations(customerProfiles, ({ one }) => ({ user: one(user, { fields: [customerProfiles.userId], references: [user.id] }) }));

export const locationRelations = relations(locations, ({ many }) => ({ vehicles: many(vehicles) }));

export const vehicleRelations = relations(vehicles, ({ one, many }) => ({
  location: one(locations, { fields: [vehicles.locationId], references: [locations.id] }),
  images: many(vehicleImages),
  blocks: many(vehicleBlocks),
  bookings: many(bookings),
}));
export const vehicleImageRelations = relations(vehicleImages, ({ one }) => ({ vehicle: one(vehicles, { fields: [vehicleImages.vehicleId], references: [vehicles.id] }) }));
export const vehicleBlockRelations = relations(vehicleBlocks, ({ one }) => ({ vehicle: one(vehicles, { fields: [vehicleBlocks.vehicleId], references: [vehicles.id] }) }));

export const bookingRelations = relations(bookings, ({ one, many }) => ({
  user: one(user, { fields: [bookings.userId], references: [user.id] }),
  vehicle: one(vehicles, { fields: [bookings.vehicleId], references: [vehicles.id] }),
  pickupLocation: one(locations, { fields: [bookings.pickupLocationId], references: [locations.id], relationName: "pickup" }),
  returnLocation: one(locations, { fields: [bookings.returnLocationId], references: [locations.id], relationName: "return" }),
  addonItems: many(bookingAddonItems),
}));
export const bookingAddonItemRelations = relations(bookingAddonItems, ({ one }) => ({
  booking: one(bookings, { fields: [bookingAddonItems.bookingId], references: [bookings.id] }),
  addon: one(bookingAddons, { fields: [bookingAddonItems.addonId], references: [bookingAddons.id] }),
}));

export const loanApplicationRelations = relations(loanApplications, ({ one, many }) => ({
  user: one(user, { fields: [loanApplications.userId], references: [user.id] }),
  documents: many(loanDocuments),
  history: many(loanStatusHistory),
}));
export const loanDocumentRelations = relations(loanDocuments, ({ one }) => ({ application: one(loanApplications, { fields: [loanDocuments.applicationId], references: [loanApplications.id] }) }));
export const loanStatusHistoryRelations = relations(loanStatusHistory, ({ one }) => ({
  application: one(loanApplications, { fields: [loanStatusHistory.applicationId], references: [loanApplications.id] }),
}));
