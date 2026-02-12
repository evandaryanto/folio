import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCollection } from "@/hooks/use-collections";
import {
  useFields,
  useCreateField,
  useUpdateField,
  useDeleteField,
} from "@/hooks/use-fields";
import { useRecords, useCreateRecord } from "@/hooks/use-records";
import type { FieldResponse } from "@folio/contract/field";

export type CollectionTab = "records" | "schema" | "apis";

export function useCollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<CollectionTab>("records");
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<FieldResponse | null>(null);

  // Data fetching
  const {
    data: collection,
    isLoading: collectionLoading,
    error: collectionError,
  } = useCollection(slug ?? "");

  const { data: fields, isLoading: fieldsLoading } = useFields(collection?.id);
  const { data: records, isLoading: recordsLoading } = useRecords(
    collection?.id,
  );

  // Mutations
  const createRecord = useCreateRecord(collection?.id);
  const createField = useCreateField(collection?.id);
  const updateField = useUpdateField(collection?.id);
  const deleteField = useDeleteField(collection?.id);

  // Handlers
  const handleCreateRecord = async (data: Record<string, unknown>) => {
    await createRecord.mutateAsync(data);
    setShowCreateRecord(false);
  };

  const handleCreateField = async (
    data: Parameters<typeof createField.mutateAsync>[0],
  ) => {
    await createField.mutateAsync(data);
    setShowAddField(false);
  };

  const handleUpdateField = async (
    data: Parameters<typeof updateField.mutateAsync>[0]["data"],
  ) => {
    if (editingField) {
      await updateField.mutateAsync({ fieldId: editingField.id, data });
      setEditingField(null);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    await deleteField.mutateAsync(fieldId);
  };

  return {
    // Route params
    slug,

    // Tab state
    tab,
    setTab,

    // Modal states
    showCreateRecord,
    setShowCreateRecord,
    showAddField,
    setShowAddField,
    editingField,
    setEditingField,

    // Data
    collection,
    collectionLoading,
    collectionError,
    fields,
    fieldsLoading,
    records,
    recordsLoading,

    // Mutation states
    isCreatingRecord: createRecord.isPending,
    isCreatingField: createField.isPending,
    isUpdatingField: updateField.isPending,
    isDeletingField: deleteField.isPending,

    // Handlers
    handleCreateRecord,
    handleCreateField,
    handleUpdateField,
    handleDeleteField,
  };
}
