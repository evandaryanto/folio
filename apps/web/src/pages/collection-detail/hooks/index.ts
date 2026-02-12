// Page-specific hook
export { useCollectionPage } from "./use-collection-page";
export type { CollectionTab } from "./use-collection-page";

// Re-export global hooks used by this page
export { useCollection } from "@/hooks/use-collections";
export {
  useFields,
  useCreateField,
  useUpdateField,
  useDeleteField,
} from "@/hooks/use-fields";
export { useRecords, useCreateRecord } from "@/hooks/use-records";
