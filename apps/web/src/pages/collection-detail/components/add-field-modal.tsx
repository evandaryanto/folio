import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldType } from "@folio/contract/enums";
import type { CreateFieldRequest } from "@folio/contract/field";

interface AddFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateFieldRequest) => Promise<void>;
  isLoading: boolean;
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.Text]: "Text",
  [FieldType.Textarea]: "Textarea",
  [FieldType.Number]: "Number",
  [FieldType.Boolean]: "Boolean",
  [FieldType.Date]: "Date",
  [FieldType.Datetime]: "Date & Time",
  [FieldType.Select]: "Select",
  [FieldType.MultiSelect]: "Multi Select",
  [FieldType.Relation]: "Relation",
  [FieldType.Json]: "JSON",
};

interface Choice {
  value: string;
  label: string;
}

export function AddFieldModal({
  open,
  onOpenChange,
  onCreate,
  isLoading,
}: AddFieldModalProps) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>(FieldType.Text);
  const [isRequired, setIsRequired] = useState(false);
  const [isUnique, setIsUnique] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setSlug("");
    setName("");
    setFieldType(FieldType.Text);
    setIsRequired(false);
    setIsUnique(false);
    setChoices([]);
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name if slug is empty or matches previous auto-generated
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9_]+$/.test(slug)) {
      newErrors.slug =
        "Slug can only contain lowercase letters, numbers, and underscores";
    }

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (
      (fieldType === FieldType.Select || fieldType === FieldType.MultiSelect) &&
      choices.length === 0
    ) {
      newErrors.choices = "At least one choice is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const data: CreateFieldRequest = {
      slug,
      name,
      fieldType,
      isRequired,
      isUnique,
    };

    // Add options for Select/MultiSelect
    if (fieldType === FieldType.Select || fieldType === FieldType.MultiSelect) {
      data.options = { choices };
    }

    await onCreate(data);
    handleOpenChange(false);
  };

  const addChoice = () => {
    setChoices([...choices, { value: "", label: "" }]);
  };

  const updateChoice = (
    index: number,
    field: "value" | "label",
    value: string,
  ) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    // Auto-generate value from label if value is empty
    if (field === "label" && !newChoices[index].value) {
      newChoices[index].value = generateSlug(value);
    }
    setChoices(newChoices);
  };

  const removeChoice = (index: number) => {
    setChoices(choices.filter((_, i) => i !== index));
  };

  const showChoicesField =
    fieldType === FieldType.Select || fieldType === FieldType.MultiSelect;

  const baseInputClass =
    "w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Field</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="field-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <input
              id="field-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={baseInputClass}
              placeholder="e.g., First Name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="field-slug">
              Slug <span className="text-destructive">*</span>
            </Label>
            <input
              id="field-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={`${baseInputClass} font-mono`}
              placeholder="e.g., first_name"
            />
            <p className="text-xs text-muted-foreground">
              Used in API responses. Only lowercase letters, numbers, and
              underscores.
            </p>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug}</p>
            )}
          </div>

          {/* Field Type */}
          <div className="space-y-2">
            <Label htmlFor="field-type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={fieldType}
              onValueChange={(value) => setFieldType(value as FieldType)}
            >
              <SelectTrigger id="field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Choices for Select/MultiSelect */}
          {showChoicesField && (
            <div className="space-y-2">
              <Label>
                Choices <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {choices.map((choice, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={choice.label}
                        onChange={(e) =>
                          updateChoice(index, "label", e.target.value)
                        }
                        className={baseInputClass}
                        placeholder="Label"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={choice.value}
                        onChange={(e) =>
                          updateChoice(index, "value", e.target.value)
                        }
                        className={`${baseInputClass} font-mono`}
                        placeholder="value"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => removeChoice(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChoice}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Choice
                </Button>
              </div>
              {errors.choices && (
                <p className="text-sm text-destructive">{errors.choices}</p>
              )}
            </div>
          )}

          {/* Flags */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="field-required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked === true)}
              />
              <Label htmlFor="field-required" className="text-sm font-normal">
                Required
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="field-unique"
                checked={isUnique}
                onCheckedChange={(checked) => setIsUnique(checked === true)}
              />
              <Label htmlFor="field-unique" className="text-sm font-normal">
                Unique
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Field
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
