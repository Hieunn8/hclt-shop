import { revalidateFrontend } from "../../../../utils/revalidate";

export default {
  async afterCreate(event: unknown) {
    await revalidateFrontend("hero-slide", event as Parameters<typeof revalidateFrontend>[1]);
  },
  async afterUpdate(event: unknown) {
    await revalidateFrontend("hero-slide", event as Parameters<typeof revalidateFrontend>[1]);
  },
  async afterDelete(event: unknown) {
    await revalidateFrontend("hero-slide", event as Parameters<typeof revalidateFrontend>[1]);
  }
};
