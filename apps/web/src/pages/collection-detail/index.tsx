import { Link } from "react-router-dom";
import {
  Settings,
  Plus,
  Loader2,
  Layers,
  Zap,
  Globe,
  Lock,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { useCollectionPage } from "./hooks";
import {
  RecordsTable,
  FieldsList,
  CreateRecordModal,
  AddFieldModal,
  EditFieldModal,
} from "./components";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCompositions } from "@/hooks/use-compositions";
import { useApp } from "@/providers";
import { AccessLevel } from "@folio/contract/enums";

function AccessBadge({ access }: { access: AccessLevel }) {
  const Icon =
    access === AccessLevel.Public
      ? Globe
      : access === AccessLevel.Internal
        ? Users
        : Lock;
  const label =
    access === AccessLevel.Public
      ? "public"
      : access === AccessLevel.Internal
        ? "internal"
        : "private";

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[11px]">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function CollectionDetailPage() {
  const { user } = useApp();
  const {
    tab,
    setTab,
    showCreateRecord,
    setShowCreateRecord,
    showAddField,
    setShowAddField,
    editingField,
    setEditingField,
    collection,
    collectionLoading,
    collectionError,
    fields,
    fieldsLoading,
    records,
    recordsLoading,
    isCreatingRecord,
    isCreatingField,
    isUpdatingField,
    handleCreateRecord,
    handleCreateField,
    handleUpdateField,
  } = useCollectionPage();

  const { data: allCompositions, isPending: compositionsLoading } =
    useCompositions();

  // Filter compositions that use this collection
  const compositions = allCompositions?.filter(
    (c) => c.config.from === collection?.slug,
  );

  if (collectionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (collectionError || !collection) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Failed to load collection</p>
        {collectionError && (
          <p className="text-sm">{collectionError.message}</p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{collection.icon || "📁"}</span>
        <div>
          <h2 className="text-lg font-bold">{collection.name}</h2>
          <span className="font-mono text-xs text-muted-foreground">
            {formatNumber(records?.length ?? 0)} records · {fields?.length ?? 0}{" "}
            fields
          </span>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Settings
          </Button>
          {tab === "records" && (
            <Button size="sm" onClick={() => setShowCreateRecord(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Record
            </Button>
          )}
          {tab === "schema" && (
            <Button size="sm" onClick={() => setShowAddField(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Field
            </Button>
          )}
          {tab === "apis" && (
            <Link to={routes.compositionBuilder(collection.slug)}>
              <Button size="sm">
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Create API
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-5">
        {(["records", "schema", "apis"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground",
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Records Tab */}
      {tab === "records" && (
        <RecordsTable
          records={records}
          fields={fields}
          isLoading={recordsLoading || fieldsLoading}
        />
      )}

      {/* Schema Tab */}
      {tab === "schema" && (
        <FieldsList
          fields={fields}
          isLoading={fieldsLoading}
          onAddField={() => setShowAddField(true)}
          onEditField={(field) => setEditingField(field)}
        />
      )}

      {/* APIs Tab */}
      {tab === "apis" && (
        <>
          {compositionsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : compositions && compositions.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-card border-b border-border">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Endpoint
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Access
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {compositions.map((comp) => (
                    <tr
                      key={comp.id}
                      className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          to={routes.compositionDetail(comp.slug)}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {comp.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        /c/{user?.workspaceSlug}/{comp.slug}
                      </td>
                      <td className="px-4 py-2.5">
                        <AccessBadge access={comp.accessLevel} />
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px]",
                            comp.isActive
                              ? "bg-green-500/10 text-green-600"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {comp.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          to={routes.compositionDetail(comp.slug)}
                          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors inline-flex"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  No compositions yet
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a composition to expose this collection via API
                </p>
                <Link to={routes.compositionBuilder(collection.slug)}>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Composition
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create Record Modal */}
      <CreateRecordModal
        open={showCreateRecord}
        onOpenChange={setShowCreateRecord}
        fields={fields ?? []}
        onCreate={handleCreateRecord}
        isLoading={isCreatingRecord}
      />

      {/* Add Field Modal */}
      <AddFieldModal
        open={showAddField}
        onOpenChange={setShowAddField}
        onCreate={handleCreateField}
        isLoading={isCreatingField}
      />

      {/* Edit Field Modal */}
      <EditFieldModal
        open={!!editingField}
        onOpenChange={(open) => !open && setEditingField(null)}
        field={editingField}
        onUpdate={handleUpdateField}
        isLoading={isUpdatingField}
      />
    </>
  );
}
