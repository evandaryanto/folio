import { ArrowLeft, Loader2, Save, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompositionBuilder } from "./hooks";
import { ConfigPanel, PreviewPanel } from "./components";

export default function CompositionBuilderPage() {
  const {
    collectionSlug,
    isEditMode,
    isLoading,
    isSaving,
    collection,
    fields,
    collections,
    name,
    setName,
    slug,
    setSlug,
    description,
    setDescription,
    accessLevel,
    setAccessLevel,
    joins,
    addJoin,
    updateJoin,
    removeJoin,
    filters,
    addFilter,
    updateFilter,
    removeFilter,
    groupBy,
    toggleGroupBy,
    aggregations,
    addAggregation,
    updateAggregation,
    removeAggregation,
    sorts,
    addSort,
    updateSort,
    removeSort,
    limit,
    setLimit,
    config,
    errors,
    isValid,
    endpointUrl,
    handleSubmit,
    goBack,
    previewResult,
    isPreviewLoading,
    handlePreview,
    clearPreview,
  } = useCompositionBuilder();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-background shrink-0">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">
            {isEditMode ? "Edit" : "Create"} API
          </h1>
          <p className="text-sm text-muted-foreground">
            {collection?.name ?? collectionSlug} → {name || "Untitled API"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={isPreviewLoading}
        >
          {isPreviewLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Test
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid || isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isEditMode ? "Save Changes" : "Create API"}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Configuration */}
        <div className="w-[400px] border-r border-border bg-background shrink-0">
          <ConfigPanel
            fields={fields}
            collections={collections}
            currentCollectionSlug={collectionSlug ?? ""}
            name={name}
            setName={setName}
            slug={slug}
            setSlug={setSlug}
            description={description}
            setDescription={setDescription}
            accessLevel={accessLevel}
            setAccessLevel={setAccessLevel}
            joins={joins}
            addJoin={addJoin}
            updateJoin={updateJoin}
            removeJoin={removeJoin}
            filters={filters}
            addFilter={addFilter}
            updateFilter={updateFilter}
            removeFilter={removeFilter}
            groupBy={groupBy}
            toggleGroupBy={toggleGroupBy}
            aggregations={aggregations}
            addAggregation={addAggregation}
            updateAggregation={updateAggregation}
            removeAggregation={removeAggregation}
            sorts={sorts}
            addSort={addSort}
            updateSort={updateSort}
            removeSort={removeSort}
            limit={limit}
            setLimit={setLimit}
            errors={errors}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-muted/30">
          <PreviewPanel
            config={config}
            endpointUrl={endpointUrl}
            accessLevel={accessLevel}
            previewResult={previewResult}
            clearPreview={clearPreview}
          />
        </div>
      </div>
    </div>
  );
}
