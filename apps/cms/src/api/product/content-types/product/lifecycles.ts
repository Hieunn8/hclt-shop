import { revalidateFrontend } from "../../../../utils/revalidate";

export default {
  afterCreate(event: unknown) {
    void revalidateFrontend("product", event as Parameters<typeof revalidateFrontend>[1]);
  },
  afterUpdate(event: unknown) {
    void revalidateFrontend("product", event as Parameters<typeof revalidateFrontend>[1]);
  },
  afterDelete(event: unknown) {
    void revalidateFrontend("product", event as Parameters<typeof revalidateFrontend>[1]);
  }
};
