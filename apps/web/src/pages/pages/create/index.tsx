import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { routes } from "@/lib/routes";
import { useCreatePage } from "@/hooks/use-pages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function CreatePagePage() {
  const navigate = useNavigate();
  const createPage = useCreatePage();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  const canSubmit = name.trim().length > 0 && slug.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const page = await createPage.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        blocks: [],
        isActive: true,
      });
      navigate(routes.pageDetail(page.slug));
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(routes.pages())}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-bold">Create Page</h2>
      </div>

      <div className="max-w-lg space-y-4">
        <div>
          <Label htmlFor="name" className="text-xs font-semibold">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Sales Dashboard"
            className="mt-1"
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="slug" className="text-xs font-semibold">
            Slug
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="e.g. sales-dashboard"
            className="mt-1 font-mono"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            URL-friendly identifier. Auto-generated from name.
          </p>
        </div>

        <div>
          <Label htmlFor="description" className="text-xs font-semibold">
            Description (optional)
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this page is for..."
            rows={3}
            className="mt-1"
          />
        </div>

        <div className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createPage.isPending}
          >
            {createPage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Check className="w-4 h-4 mr-1.5" />
            )}
            Create Page
          </Button>
        </div>
      </div>
    </>
  );
}
